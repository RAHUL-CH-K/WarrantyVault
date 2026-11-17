import { AlertCircle, CheckCircle2, Clock, Archive } from 'lucide-react';
import { WarrantyStatus } from '../types/vault';

interface StatusBadgeProps {
  status: WarrantyStatus;
  compact?: boolean;
}

const STATUS_MAP: Record<
  WarrantyStatus,
  {
    label: string;
    classes: string;
    Icon: typeof CheckCircle2;
  }
> = {
  active: {
    label: 'Active',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Icon: CheckCircle2,
  },
  expiring_soon: {
    label: 'Expiring Soon',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
    Icon: Clock,
  },
  missing_serial: {
    label: 'Missing Serial',
    classes: 'bg-orange-50 text-orange-700 border-red-300',
    Icon: AlertCircle,
  },
  expired: {
    label: 'Expired',
    classes: 'bg-slate-100 text-slate-600 border-slate-200',
    Icon: Archive,
  },
};

export function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  const cfg = STATUS_MAP[status];
  const Icon = cfg.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border font-medium whitespace-nowrap shrink-0 ${
        compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } ${cfg.classes}`}
    >
      <Icon className={compact ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />
      <span>{cfg.label}</span>
    </span>
  );
}
