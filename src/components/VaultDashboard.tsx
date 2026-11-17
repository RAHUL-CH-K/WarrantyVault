import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { FilterOption, SortOption } from '../types/vault';
import {
  computeReadiness,
  computeStatus,
  formatINR,
  getDaysRemaining,
} from '../utils/formatters';
import { AssetCard } from './AssetCard';
import { ReadinessRing } from './ReadinessRing';
import { WhatsAppPreview } from './WhatsAppPreview';

const FILTER_TABS: Array<{ id: FilterOption; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'expiring_soon', label: 'Expiring Soon' },
  { id: 'missing_serial', label: 'Missing Serial' },
  { id: 'expired', label: 'Expired' },
];

export function VaultDashboard() {
  const {
    assets,
    isLoading,
    hasError,
    openAssetDetail,
    openVerificationModal,
    confirmVerification,
    setAddBillOpen,
    triggerRefresh,
    triggerSimulatedError,
    resetDemoData,
  } = useVault();

  const [filter, setFilter] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('expiry');

  const pendingItems = useMemo(
    () => assets.filter((a) => a.needsConfirmation),
    [assets]
  );

  const metrics = useMemo(() => {
    let protectedValue = 0;
    let totalReadiness = 0;
    let expiring30Count = 0;

    for (const item of assets) {
      const daysLeft = getDaysRemaining(item.expiryDate);
      if (daysLeft >= 0) {
        protectedValue += item.amountInr;
      }
      if (daysLeft >= 0 && daysLeft <= 30) {
        expiring30Count += 1;
      }
      totalReadiness += computeReadiness(item).score;
    }

    const avgReadiness =
      assets.length > 0 ? Math.round(totalReadiness / assets.length) : 0;

    return {
      protectedValue,
      avgReadiness,
      expiring30Count,
      totalItems: assets.length,
    };
  }, [assets]);

  const statusCounts = useMemo(() => {
    const counts: Record<FilterOption, number> = {
      all: assets.length,
      active: 0,
      expiring_soon: 0,
      missing_serial: 0,
      expired: 0,
    };
    for (const item of assets) {
      const st = computeStatus(item);
      counts[st] += 1;
    }
    return counts;
  }, [assets]);

  const filteredAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = assets.filter((item) => {
      const st = computeStatus(item);
      if (filter !== 'all' && st !== filter) return false;
      if (!q) return true;
      return (
        item.brand.toLowerCase().includes(q) ||
        item.productName.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q) ||
        (item.serialNumber || '').toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'value') return b.amountInr - a.amountInr;
      if (sortBy === 'recent') return b.addedAt.localeCompare(a.addedAt);
      return getDaysRemaining(a.expiryDate) - getDaysRemaining(b.expiryDate);
    });
  }, [assets, filter, searchQuery, sortBy]);

  return (
    <div className="space-y-6 pb-24 lg:pb-12">
      {/* Pending Confirmation Banner */}
      {pendingItems.length > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-950">
                {pendingItems.length}{' '}
                {pendingItems.length === 1 ? 'item needs' : 'items need'}{' '}
                confirmation
              </p>
              <p className="text-xs text-amber-800">
                WhatsApp OCR flagged low-confidence serial or GSTIN fields on{' '}
                {pendingItems.map((i) => i.brand).join(' & ')}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openVerificationModal(pendingItems[0].id)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-900 text-white text-xs sm:text-sm font-medium hover:bg-amber-950 transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
          >
            <span>Review &amp; Confirm</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Summary Cards */}
      <section
        aria-label="Vault overview summary"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500">
            Protected Value
          </span>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
              {formatINR(metrics.protectedValue)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Active warranty coverage
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-medium text-slate-500">
              Claim Readiness
            </span>
            <p className="text-sm font-semibold text-slate-900 mt-1">
              {metrics.avgReadiness >= 85 ? 'Audit Ready' : 'Action Needed'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Bills &amp; serials verified
            </p>
          </div>
          <ReadinessRing percentage={metrics.avgReadiness} size={62} strokeWidth={6} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500">
            Expiring in 30 Days
          </span>
          <div className="mt-2">
            <p
              className={`text-xl sm:text-2xl font-bold tabular-nums ${
                metrics.expiring30Count > 0 ? 'text-amber-700' : 'text-slate-900'
              }`}
            >
              {metrics.expiring30Count}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              WhatsApp alerts scheduled
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500">Total Items</span>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
              {metrics.totalItems}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Home &amp; clinic assets
            </p>
          </div>
        </div>
      </section>

      {/* Filter, Search & Sort Controls */}
      <section className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Segmented Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {FILTER_TABS.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#0F766E] text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-xs tabular-nums ${
                      active ? 'text-teal-100' : 'text-slate-400'
                    }`}
                  >
                    {statusCounts[tab.id]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search + Sort */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search brand, model, serial…"
                aria-label="Search vault assets"
                className="w-full min-h-[44px] pl-10 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-[#0F766E]"
              />
            </div>

            <div className="relative shrink-0">
              <SlidersHorizontal className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort assets"
                className="min-h-[44px] pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:border-[#0F766E]"
              >
                <option value="expiry">Sort: Expiry date</option>
                <option value="value">Sort: Highest value</option>
                <option value="recent">Sort: Recently added</option>
              </select>
            </div>

            <button
              type="button"
              onClick={triggerRefresh}
              aria-label="Sync WhatsApp bills"
              title="Sync WhatsApp bills"
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-[#0F766E] hover:bg-slate-50 transition-colors shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Main Asset Grid / Loading / Error / Empty States */}
      {hasError ? (
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            Could not sync WhatsApp receipts
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Your local vault data is safe, but the latest WhatsApp sync timed out. Check your connection and retry.
          </p>
          <button
            type="button"
            onClick={() => {
              triggerSimulatedError(false);
              triggerRefresh();
            }}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0F766E] text-white text-sm font-medium hover:bg-[#115E59]"
          >
            Retry Sync
          </button>
        </div>
      ) : isLoading ? (
        <div
          aria-label="Loading assets"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 animate-pulse"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
              <div className="flex justify-between">
                <div className="h-6 bg-slate-100 rounded-lg w-24" />
                <div className="h-4 bg-slate-100 rounded w-16" />
              </div>
              <div className="h-2 bg-slate-100 rounded-full w-full" />
            </div>
          ))}
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 text-center space-y-6">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-slate-900">
              {assets.length === 0
                ? 'Your WarrantyVault is empty'
                : 'No matching assets found'}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              {assets.length === 0
                ? 'Send any bill photo to WarrantyVault on WhatsApp or upload a bill directly to track warranties.'
                : 'Try clearing your search or switching status filters.'}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              {assets.length === 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setAddBillOpen(true)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0F766E] text-white text-sm font-medium hover:bg-[#115E59]"
                  >
                    + Add First Bill
                  </button>
                  <button
                    type="button"
                    onClick={resetDemoData}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
                  >
                    Load 8 Sample Items
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setFilter('all');
                    setSearchQuery('');
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* WhatsApp conversation preview widget on empty state */}
          <div className="pt-2">
            <p className="text-xs font-medium text-slate-500 mb-3">
              How WhatsApp bill capture works
            </p>
            <WhatsAppPreview
              onConfirmSample={() => {
                if (pendingItems[0]) {
                  confirmVerification(pendingItems[0].id, {});
                } else {
                  resetDemoData();
                }
              }}
              onEditOnWeb={() => {
                if (pendingItems[0]) {
                  openVerificationModal(pendingItems[0].id);
                } else if (assets[0]) {
                  openVerificationModal(assets[0].id);
                } else {
                  resetDemoData();
                }
              }}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onSelect={openAssetDetail}
              onAddSerialClick={(id) => openAssetDetail(id)}
            />
          ))}
        </div>
      )}

      {/* Desktop Floating "+ Add bill" CTA */}
      <button
        type="button"
        onClick={() => setAddBillOpen(true)}
        className="hidden lg:inline-flex fixed bottom-7 right-7 z-30 min-h-[48px] px-5 py-3 rounded-2xl bg-[#0F766E] text-white text-sm font-semibold shadow-lg hover:bg-[#115E59] hover:-translate-y-0.5 transition-all items-center gap-2"
      >
        <Plus className="w-5 h-5" />
        <span>Add bill</span>
      </button>
    </div>
  );
}
