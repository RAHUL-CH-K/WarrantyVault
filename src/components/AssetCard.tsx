import {
  BatteryCharging,
  Camera,
  ChevronRight,
  Laptop,
  Refrigerator,
  Stethoscope,
} from 'lucide-react';
import { AssetCategory, AssetItem } from '../types/vault';
import {
  computeReadiness,
  computeStatus,
  formatINR,
  getDaysRemaining,
  getWarrantyProgress,
} from '../utils/formatters';
import { StatusBadge } from './StatusBadge';

interface AssetCardProps {
  asset: AssetItem;
  onSelect: (id: string) => void;
  onAddSerialClick?: (id: string) => void;
}

const CATEGORY_ICON: Record<AssetCategory, typeof Refrigerator> = {
  appliance: Refrigerator,
  electronics: Laptop,
  power: BatteryCharging,
  medical: Stethoscope,
};

export function AssetCard({
  asset,
  onSelect,
  onAddSerialClick,
}: AssetCardProps) {
  const status = computeStatus(asset);
  const daysLeft = getDaysRemaining(asset.expiryDate);
  const progress = getWarrantyProgress(asset.purchaseDate, asset.expiryDate);
  const { score } = computeReadiness(asset);
  const Icon = CATEGORY_ICON[asset.category];

  const isMissingSerial = !asset.serialNumber || !asset.serialStickerUrl;

  const barColor =
    status === 'expired'
      ? 'bg-slate-400'
      : status === 'expiring_soon'
        ? 'bg-amber-500'
        : status === 'missing_serial'
          ? 'bg-orange-500'
          : 'bg-[#0F766E]';

  const daysLabel =
    daysLeft < 0
      ? `Expired ${Math.abs(daysLeft)}d ago`
      : daysLeft === 0
        ? 'Expires today'
        : `${daysLeft} days left`;

  return (
    <article
      className={`group bg-white rounded-2xl border transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between ${
        status === 'missing_serial'
          ? 'border-orange-300'
          : 'border-slate-200'
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(asset.id)}
        className="w-full text-left p-4 sm:p-5 flex-1 flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] rounded-2xl"
      >
        <div>
          {/* Top row: Icon + Title + Status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                  {asset.brand} {asset.productName}
                </h3>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 truncate">
                  <span className="font-mono truncate">{asset.model}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-slate-700 tabular-nums">
                    {formatINR(asset.amountInr)}
                  </span>
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F766E] transition-colors shrink-0 mt-1" />
          </div>

          {/* Status & Readiness row */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <StatusBadge status={status} compact />
            <span
              className={`text-xs font-semibold tabular-nums ${
                score === 100 ? 'text-[#0F766E]' : 'text-amber-700'
              }`}
            >
              {score}% ready
            </span>
          </div>

          {/* Expiry Progress Bar */}
          <div className="mt-3.5">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-500">Warranty period</span>
              <span
                className={`font-medium tabular-nums ${
                  daysLeft < 0
                    ? 'text-slate-500'
                    : daysLeft <= 30
                      ? 'text-amber-700'
                      : 'text-slate-700'
                }`}
              >
                {daysLabel}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </button>

      {/* Missing Serial Nudge */}
      {isMissingSerial && (
        <div className="px-4 pb-4 pt-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onAddSerialClick) {
                onAddSerialClick(asset.id);
              } else {
                onSelect(asset.id);
              }
            }}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 text-xs font-medium inline-flex items-center justify-center gap-2 transition-colors"
          >
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span>Add Serial Photo / Scan QR</span>
          </button>
        </div>
      )}
    </article>
  );
}
