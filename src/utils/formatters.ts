import { AssetItem, WarrantyStatus } from '../types/vault';

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function formatDateDDMMMYYYY(isoOrDate: string): string {
  if (!isoOrDate) return '—';
  const parts = isoOrDate.slice(0, 10).split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return isoOrDate;
  const [year, month, day] = parts;
  const dd = String(day).padStart(2, '0');
  const mmm = MONTHS_SHORT[(month - 1 + 12) % 12] || 'Jan';
  return `${dd} ${mmm} ${year}`;
}

export function addMonthsToIso(purchaseDate: string, months: number): string {
  const parts = purchaseDate.slice(0, 10).split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return purchaseDate;
  const [y, m, d] = parts;
  const dt = new Date(Date.UTC(y, m - 1 + months, d));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function offsetDaysFromToday(daysOffset: number): string {
  const now = new Date();
  const utc = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + daysOffset)
  );
  return utc.toISOString().slice(0, 10);
}

export function getDaysRemaining(expiryDate: string): number {
  const parts = expiryDate.slice(0, 10).split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return 0;
  const [y, m, d] = parts;
  const expUtc = Date.UTC(y, m - 1, d);
  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((expUtc - todayUtc) / (1000 * 60 * 60 * 24));
}

export function getWarrantyProgress(
  purchaseDate: string,
  expiryDate: string
): number {
  const p = purchaseDate.slice(0, 10).split('-').map(Number);
  const e = expiryDate.slice(0, 10).split('-').map(Number);
  if (p.length !== 3 || e.length !== 3) return 0;
  const start = Date.UTC(p[0], p[1] - 1, p[2]);
  const end = Date.UTC(e[0], e[1] - 1, e[2]);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  if (end <= start) return 100;
  const elapsed = ((today - start) / (end - start)) * 100;
  return Math.max(0, Math.min(100, Math.round(elapsed)));
}

export function computeReadiness(asset: AssetItem): {
  score: number;
  checks: {
    invoice: boolean;
    serialPhoto: boolean;
    purchaseDate: boolean;
    serialNumber: boolean;
  };
} {
  const checks = {
    invoice: Boolean(asset.invoiceRestoredUrl || asset.invoiceOriginalUrl),
    serialPhoto: Boolean(asset.serialStickerUrl),
    purchaseDate: Boolean(asset.purchaseDate && asset.purchaseDate.length >= 10),
    serialNumber: Boolean(asset.serialNumber && asset.serialNumber.trim().length >= 3),
  };

  let score = 0;
  if (checks.invoice) score += 35;
  if (checks.purchaseDate) score += 20;
  if (checks.serialNumber) score += 25;
  if (checks.serialPhoto) score += 20;

  return { score, checks };
}

export function computeStatus(asset: AssetItem): WarrantyStatus {
  const daysLeft = getDaysRemaining(asset.expiryDate);
  if (daysLeft < 0) return 'expired';
  if (!asset.serialNumber || !asset.serialStickerUrl) return 'missing_serial';
  if (daysLeft <= 30) return 'expiring_soon';
  return 'active';
}

export function parseQrPayload(raw: string): {
  serialNumber: string;
  model?: string;
  rawText: string;
} {
  const trimmed = raw.trim();
  // Try JSON payload e.g. {"sn":"AQG-99812","model":"GWPDARU000"}
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      const sn = String(
        parsed.serial ||
          parsed.serialNumber ||
          parsed.sn ||
          parsed.S ||
          ''
      ).trim();
      const model = parsed.model ? String(parsed.model).trim() : undefined;
      if (sn) return { serialNumber: sn, model, rawText: trimmed };
    } catch {
      // fall through
    }
  }

  // Try URL query params ?sn=... or ?serial=...
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const sn =
        url.searchParams.get('sn') ||
        url.searchParams.get('serial') ||
        url.searchParams.get('s') ||
        url.searchParams.get('serialNumber');
      const model = url.searchParams.get('model') || undefined;
      if (sn) return { serialNumber: sn.trim(), model, rawText: trimmed };
      const lastSeg = url.pathname.split('/').filter(Boolean).pop();
      if (lastSeg && lastSeg.length >= 4) {
        return { serialNumber: lastSeg.toUpperCase(), model, rawText: trimmed };
      }
    } catch {
      // fall through
    }
  }

  // Try key-value patterns like SN:ABC123 or S/N=ABC123
  const snMatch = trimmed.match(/(?:S\/?N|SERIAL(?:\s*NO)?)\s*[:=#-]\s*([A-Z0-9-]{4,})/i);
  const modelMatch = trimmed.match(/(?:MOD(?:EL)?)\s*[:=#-]\s*([A-Z0-9/-]{3,})/i);
  if (snMatch) {
    return {
      serialNumber: snMatch[1].toUpperCase(),
      model: modelMatch ? modelMatch[1].toUpperCase() : undefined,
      rawText: trimmed,
    };
  }

  return {
    serialNumber: trimmed.slice(0, 32).toUpperCase(),
    rawText: trimmed,
  };
}
