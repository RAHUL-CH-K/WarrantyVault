import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { addMonthsToIso, formatDateDDMMMYYYY } from '../utils/formatters';

export function VerificationModal() {
  const {
    assets,
    verificationAssetId,
    closeVerificationModal,
    confirmVerification,
  } = useVault();

  const targetAsset = assets.find((a) => a.id === verificationAssetId);

  const [brand, setBrand] = useState('');
  const [productName, setProductName] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState(12);
  const [sellerGstin, setSellerGstin] = useState('');
  const [amountInr, setAmountInr] = useState(0);

  useEffect(() => {
    if (targetAsset) {
      setBrand(targetAsset.brand);
      setProductName(targetAsset.productName);
      setModel(targetAsset.model);
      setSerialNumber(targetAsset.serialNumber || '');
      setPurchaseDate(targetAsset.purchaseDate);
      setWarrantyMonths(targetAsset.warrantyMonths);
      setSellerGstin(targetAsset.sellerGstin);
      setAmountInr(targetAsset.amountInr);
    }
  }, [targetAsset]);

  if (!targetAsset) return null;

  const liveExpiry = addMonthsToIso(purchaseDate, Number(warrantyMonths) || 0);
  const isLowConf = (field: string) =>
    targetAsset.lowConfidenceFields.includes(field);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    confirmVerification(targetAsset.id, {
      brand: brand.trim(),
      productName: productName.trim(),
      model: model.trim(),
      serialNumber: serialNumber.trim() || null,
      purchaseDate,
      warrantyMonths: Number(warrantyMonths) || 12,
      expiryDate: liveExpiry,
      sellerGstin: sellerGstin.trim().toUpperCase(),
      amountInr: Number(amountInr) || 0,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Verify WhatsApp extracted bill details"
    >
      <div className="bg-white w-full sm:max-w-4xl rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">
              Verify &amp; Confirm Extracted Bill
            </h2>
            <p className="text-xs text-slate-500">
              Fields highlighted in amber had low OCR confidence from WhatsApp photo
            </p>
          </div>
          <button
            type="button"
            onClick={closeVerificationModal}
            aria-label="Close verification modal"
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-5"
        >
          {/* Left: Invoice Image */}
          <div className="bg-slate-100 rounded-2xl border border-slate-200 p-3 flex flex-col">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-2 px-1">
              <span className="font-medium">Restored WhatsApp Invoice</span>
              <span>Auto-enhanced</span>
            </div>
            <div className="flex-1 min-h-[260px] max-h-[440px] rounded-xl overflow-hidden bg-white flex items-center justify-center">
              <img
                src={targetAsset.invoiceRestoredUrl}
                alt={`${targetAsset.productName} invoice`}
                referrerPolicy="no-referrer"
                className="max-h-[420px] w-full object-contain"
              />
            </div>
          </div>

          {/* Right: Editable Fields */}
          <div className="space-y-3.5">
            {targetAsset.lowConfidenceFields.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Please double-check the highlighted amber fields before saving. Expiry date updates automatically.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  required
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#0F766E]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono text-slate-900 focus:outline-none focus:border-[#0F766E]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#0F766E]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1">
                  <span>Serial Number</span>
                  {isLowConf('serialNumber') && (
                    <span className="text-amber-700 font-semibold">
                      Low confidence
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="Enter or scan serial sticker later"
                  className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-sm font-mono text-slate-900 focus:outline-none focus:border-[#0F766E] ${
                    isLowConf('serialNumber')
                      ? 'border-amber-400 bg-amber-50/70'
                      : 'border-slate-200 bg-white'
                  }`}
                />
              </div>

              <div>
                <label className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1">
                  <span>Purchase Date</span>
                  {isLowConf('purchaseDate') && (
                    <span className="text-amber-700 font-semibold">Verify</span>
                  )}
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  required
                  className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-sm text-slate-900 focus:outline-none focus:border-[#0F766E] ${
                    isLowConf('purchaseDate')
                      ? 'border-amber-400 bg-amber-50/70'
                      : 'border-slate-200 bg-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Warranty (Months)
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={warrantyMonths}
                  onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                  required
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1">
                  <span>Seller GSTIN</span>
                  {isLowConf('sellerGstin') && (
                    <span className="text-amber-700 font-semibold">Verify</span>
                  )}
                </label>
                <input
                  type="text"
                  value={sellerGstin}
                  onChange={(e) => setSellerGstin(e.target.value)}
                  className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-sm font-mono text-slate-900 focus:outline-none focus:border-[#0F766E] ${
                    isLowConf('sellerGstin')
                      ? 'border-amber-400 bg-amber-50/70'
                      : 'border-slate-200 bg-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Invoice Amount (₹)
                </label>
                <input
                  type="number"
                  value={amountInr}
                  onChange={(e) => setAmountInr(Number(e.target.value))}
                  required
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:border-[#0F766E]"
                />
              </div>
            </div>

            {/* Live Expiry Preview */}
            <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 flex items-center justify-between">
              <span className="text-xs font-medium text-teal-900">
                Calculated Warranty Expiry
              </span>
              <span className="text-sm font-semibold font-mono tabular-nums text-[#0F766E]">
                {formatDateDDMMMYYYY(liveExpiry)}
              </span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={closeVerificationModal}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0F766E] text-white text-sm font-medium hover:bg-[#115E59] inline-flex items-center justify-center gap-2 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm &amp; Save</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
