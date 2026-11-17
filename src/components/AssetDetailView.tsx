import { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  Pencil,
  QrCode,
  Share2,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import {
  computeReadiness,
  computeStatus,
  formatDateDDMMMYYYY,
  formatINR,
  getDaysRemaining,
  getWarrantyProgress,
} from '../utils/formatters';
import { StatusBadge } from './StatusBadge';
import { PhotoViewer } from './PhotoViewer';
import { FieldRow } from './FieldRow';
import { ReadinessRing } from './ReadinessRing';
import { QrScannerModal } from './QrScannerModal';
import { VideoAnimatorPanel } from './VideoAnimatorPanel';

export function AssetDetailView() {
  const {
    assets,
    selectedAssetId,
    setCurrentView,
    openClaimPacket,
    openVerificationModal,
    updateAsset,
    deleteAsset,
    linkQrSerial,
    addAnimatedVideo,
    addToast,
  } = useVault();

  const [qrOpen, setQrOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const asset = assets.find((a) => a.id === selectedAssetId) || assets[0];

  if (!asset) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <p className="text-sm text-slate-600">No asset selected.</p>
        <button
          type="button"
          onClick={() => setCurrentView('dashboard')}
          className="mt-3 min-h-[44px] px-4 py-2 rounded-xl bg-[#0F766E] text-white text-sm font-medium"
        >
          Back to Vault
        </button>
      </div>
    );
  }

  const status = computeStatus(asset);
  const { score, checks } = computeReadiness(asset);
  const daysLeft = getDaysRemaining(asset.expiryDate);
  const progress = getWarrantyProgress(asset.purchaseDate, asset.expiryDate);

  const handleFieldSave = (
    field: keyof typeof asset,
    rawVal: string,
    isNumber = false
  ) => {
    const val = isNumber ? Number(rawVal) || 0 : rawVal;
    updateAsset(asset.id, {
      [field]: val === '' && field === 'serialNumber' ? null : val,
      lowConfidenceFields: asset.lowConfidenceFields.filter((f) => f !== field),
    });
    addToast('Field updated', 'Vault record saved.');
  };

  const handleShare = async () => {
    const summary = `${asset.brand} ${asset.productName} (${asset.model}) | S/N: ${asset.serialNumber || 'Pending'} | Purchase: ${formatDateDDMMMYYYY(asset.purchaseDate)} | Expiry: ${formatDateDDMMMYYYY(asset.expiryDate)} | Amount: ${formatINR(asset.amountInr)}`;
    try {
      await navigator.clipboard.writeText(summary);
      addToast('Asset summary copied', 'Ready to paste into WhatsApp or email.');
    } catch {
      addToast('Summary prepared', summary, 'info');
    }
  };

  return (
    <div className="space-y-6 pb-32 lg:pb-24">
      {/* Top Breadcrumb + Quick QR Action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setCurrentView('dashboard')}
            aria-label="Back to Vault"
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                {asset.brand} {asset.productName}
              </h1>
              <StatusBadge status={status} compact />
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono truncate">
              {asset.model} · Added {formatDateDDMMMYYYY(asset.addedAt)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setQrOpen(true)}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-[#0F766E] bg-teal-50 hover:bg-teal-100 text-[#0F766E] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
        >
          <QrCode className="w-4 h-4" />
          <span>Scan Serial QR</span>
        </button>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: PhotoViewer + QR Link Card + Photo-to-Video Studio */}
        <div className="lg:col-span-6 space-y-5">
          <PhotoViewer
            invoiceOriginalUrl={asset.invoiceOriginalUrl}
            invoiceRestoredUrl={asset.invoiceRestoredUrl}
            serialStickerUrl={asset.serialStickerUrl}
            productName={`${asset.brand} ${asset.productName}`}
            onOpenQrScanner={() => setQrOpen(true)}
          />

          {/* Quick Camera QR Link Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Link Serial Sticker via Camera QR
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {asset.serialNumber
                    ? `Current S/N: ${asset.serialNumber}. Re-scan anytime to update.`
                    : 'Scan the QR code on the appliance or warranty card to auto-fill serial number.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setQrOpen(true)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0F766E] text-white text-xs sm:text-sm font-medium hover:bg-[#115E59] transition-colors whitespace-nowrap shrink-0"
            >
              {asset.serialNumber ? 'Re-scan QR' : 'Open Scanner'}
            </button>
          </div>

          {/* Photo-to-Video Animation Panel (gemini-omni-1.2-flash) */}
          <VideoAnimatorPanel
            assetName={`${asset.brand} ${asset.productName}`}
            defaultImageUrl={asset.invoiceRestoredUrl}
            stickerImageUrl={asset.serialStickerUrl}
            clips={asset.animatedVideos || []}
            onClipGenerated={(clip) => addAnimatedVideo(asset.id, clip)}
          />
        </div>

        {/* Right Column: Structured Fields + Timeline + Claim Readiness */}
        <div className="lg:col-span-6 space-y-5">
          {/* Warranty Timeline Card */}
          <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Warranty Timeline
              </h2>
              <span
                className={`text-xs font-semibold tabular-nums ${
                  daysLeft < 0
                    ? 'text-slate-500'
                    : daysLeft <= 30
                      ? 'text-amber-700'
                      : 'text-[#0F766E]'
                }`}
              >
                {daysLeft < 0
                  ? `Expired ${Math.abs(daysLeft)} days ago`
                  : `${daysLeft} days remaining`}
              </span>
            </div>

            <div className="relative pt-2 pb-1">
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    daysLeft < 0
                      ? 'bg-slate-400'
                      : daysLeft <= 30
                        ? 'bg-amber-500'
                        : 'bg-[#0F766E]'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600 tabular-nums">
                <div>
                  <span className="block text-[11px] text-slate-400">Purchase</span>
                  <span className="font-medium text-slate-800">
                    {formatDateDDMMMYYYY(asset.purchaseDate)}
                  </span>
                </div>
                <div className="text-center">
                  <span className="block text-[11px] text-[#0F766E] font-medium">
                    Today
                  </span>
                  <span className="font-medium text-slate-700">{progress}% elapsed</span>
                </div>
                <div className="text-right">
                  <span className="block text-[11px] text-slate-400">Expiry</span>
                  <span className="font-medium text-slate-800">
                    {formatDateDDMMMYYYY(asset.expiryDate)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Structured Editable Fields */}
          <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">
                Asset &amp; Invoice Details
              </h2>
              <span className="text-xs text-slate-500">
                Tap pencil to edit inline
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-1">
              <FieldRow
                label="Brand"
                value={asset.brand}
                onSave={(v) => handleFieldSave('brand', v)}
              />
              <FieldRow
                label="Product"
                value={asset.productName}
                onSave={(v) => handleFieldSave('productName', v)}
              />
              <FieldRow
                label="Model"
                value={asset.model}
                mono
                onSave={(v) => handleFieldSave('model', v)}
              />
              <FieldRow
                label="Serial Number"
                value={asset.serialNumber || ''}
                mono
                lowConfidence={asset.lowConfidenceFields.includes('serialNumber')}
                placeholder="Missing — scan QR or enter serial"
                onSave={(v) => handleFieldSave('serialNumber', v)}
              />
              <FieldRow
                label="Purchase Date"
                value={asset.purchaseDate}
                displayValue={formatDateDDMMMYYYY(asset.purchaseDate)}
                type="date"
                lowConfidence={asset.lowConfidenceFields.includes('purchaseDate')}
                onSave={(v) => handleFieldSave('purchaseDate', v)}
              />
              <FieldRow
                label="Warranty Months"
                value={String(asset.warrantyMonths)}
                displayValue={`${asset.warrantyMonths} months`}
                type="number"
                mono
                onSave={(v) => handleFieldSave('warrantyMonths', v, true)}
              />
              <FieldRow
                label="Expiry Date"
                value={asset.expiryDate}
                displayValue={formatDateDDMMMYYYY(asset.expiryDate)}
                editable={false}
              />
              <FieldRow
                label="Seller GSTIN"
                value={asset.sellerGstin}
                mono
                lowConfidence={asset.lowConfidenceFields.includes('sellerGstin')}
                placeholder="No GSTIN recorded"
                onSave={(v) => handleFieldSave('sellerGstin', v.toUpperCase())}
              />
              <FieldRow
                label="Invoice Amount"
                value={String(asset.amountInr)}
                displayValue={formatINR(asset.amountInr)}
                type="number"
                mono
                onSave={(v) => handleFieldSave('amountInr', v, true)}
              />
            </div>

            {/* GST Eligible Toggle */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between px-3 py-2">
              <div>
                <p className="text-sm font-medium text-slate-900">GST Eligible</p>
                <p className="text-xs text-slate-500">
                  Include this invoice in CA / ITC quarterly export
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={asset.gstEligible}
                onClick={() => {
                  updateAsset(asset.id, { gstEligible: !asset.gstEligible });
                  addToast(
                    !asset.gstEligible ? 'Marked GST Eligible' : 'Removed GST flag'
                  );
                }}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] ${
                  asset.gstEligible ? 'bg-[#0F766E]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xs transition duration-150 ${
                    asset.gstEligible ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Claim Readiness Checklist */}
          <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Claim Readiness Checklist
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Required by Indian OEM service centres for warranty claims
                </p>
              </div>
              <ReadinessRing percentage={score} size={58} strokeWidth={5} />
            </div>

            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {[
                { label: 'Restored Invoice', ok: checks.invoice },
                { label: 'Serial Sticker Photo', ok: checks.serialPhoto },
                { label: 'Purchase Date Verified', ok: checks.purchaseDate },
                { label: 'Serial Number Linked', ok: checks.serialNumber },
              ].map((row) => (
                <li
                  key={row.label}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                    row.ok
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : 'bg-orange-50/70 border-orange-200 text-orange-900'
                  }`}
                >
                  {row.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-orange-600 shrink-0" />
                  )}
                  <span className="font-medium">{row.label}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 lg:left-64 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openVerificationModal(asset.id)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium inline-flex items-center gap-1.5"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium inline-flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-700 text-xs sm:text-sm font-medium inline-flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => openClaimPacket(asset.id)}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Generate Claim Packet</span>
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">
              Delete this asset record?
            </h3>
            <p className="text-xs text-slate-600">
              This will permanently remove {asset.brand} {asset.productName} and its restored invoice from your vault.
            </p>
            <div className="flex items-center gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(false);
                  deleteAsset(asset.id);
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700"
              >
                Delete Asset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera QR Scanner Modal */}
      <QrScannerModal
        open={qrOpen}
        assetName={`${asset.brand} ${asset.productName}`}
        defaultModel={asset.model}
        onClose={() => setQrOpen(false)}
        onLinked={(sn, mod, stickerDataUrl) =>
          linkQrSerial(asset.id, sn, mod, stickerDataUrl)
        }
      />
    </div>
  );
}
