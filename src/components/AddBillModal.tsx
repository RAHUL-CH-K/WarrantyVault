import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  MessageCircle,
  QrCode,
  Upload,
  X,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import {
  BRAND_HELPLINES,
  INVOICE_FADED_IMG,
  INVOICE_RESTORED_IMG,
} from '../data/mockVaultData';
import { addMonthsToIso, offsetDaysFromToday } from '../utils/formatters';
import { AssetCategory } from '../types/vault';

export function AddBillModal() {
  const { addBillOpen, setAddBillOpen, addAsset, openVerificationModal, addToast } =
    useVault();
  const [mode, setMode] = useState<'upload' | 'whatsapp'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [brand, setBrand] = useState('LG');
  const [productName, setProductName] = useState('32L Convection Microwave Oven');
  const [model, setModel] = useState('MC3286BRUM');
  const [category, setCategory] = useState<AssetCategory>('appliance');
  const [amountInr, setAmountInr] = useState('17990');
  const [warrantyMonths, setWarrantyMonths] = useState('12');
  const [purchaseDate, setPurchaseDate] = useState(offsetDaysFromToday(-5));
  const [gstEligible, setGstEligible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!addBillOpen) return null;

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      addToast('Unsupported file type', 'Upload a JPG, PNG, or PDF invoice.', 'error');
      return;
    }
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPreviewUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(INVOICE_RESTORED_IMG);
    }
    addToast('Bill scanned', 'Fields pre-filled from uploaded bill.');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleSaveNewBill = (e: React.FormEvent) => {
    e.preventDefault();
    const months = Math.max(1, Number(warrantyMonths) || 12);
    const amount = Math.max(0, Number(amountInr) || 0);
    const helpline = BRAND_HELPLINES[brand] || {
      name: `${brand} Customer Care`,
      phone: '1800 102 0000',
    };
    const newId = `asset-${Date.now()}`;

    addAsset({
      id: newId,
      brand: brand.trim() || 'Generic',
      productName: productName.trim() || 'Home Appliance',
      model: model.trim() || 'STD-01',
      category,
      serialNumber: null,
      purchaseDate,
      warrantyMonths: months,
      expiryDate: addMonthsToIso(purchaseDate, months),
      sellerGstin: gstEligible ? '27AABCR4521M1Z2' : '',
      amountInr: amount,
      gstEligible,
      needsConfirmation: true,
      lowConfidenceFields: ['serialNumber'],
      invoiceOriginalUrl: previewUrl || INVOICE_FADED_IMG,
      invoiceRestoredUrl: previewUrl || INVOICE_RESTORED_IMG,
      serialStickerUrl: null,
      supportName: helpline.name,
      supportPhone: helpline.phone,
      addedAt: offsetDaysFromToday(0),
      animatedVideos: [],
    });

    setAddBillOpen(false);
    setPreviewUrl(null);
    openVerificationModal(newId);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add bill to WarrantyVault"
    >
      <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">
              Add a Bill to Your Vault
            </h2>
            <p className="text-xs text-slate-500">
              Upload an invoice photo or forward it on WhatsApp
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddBillOpen(false)}
            aria-label="Close modal"
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="px-5 pt-4">
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`min-h-[44px] px-3 py-2 rounded-lg text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors ${
                mode === 'upload'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Bill Photo</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('whatsapp')}
              className={`min-h-[44px] px-3 py-2 rounded-lg text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors ${
                mode === 'whatsapp'
                  ? 'bg-white text-[#0F766E] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send via WhatsApp</span>
            </button>
          </div>
        </div>

        {mode === 'upload' ? (
          <form onSubmit={handleSaveNewBill} className="p-5 space-y-4">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-5 text-center transition-colors ${
                dragActive
                  ? 'border-[#0F766E] bg-teal-50/70'
                  : 'border-slate-300 bg-[#FAFAF7] hover:border-[#0F766E]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              {previewUrl ? (
                <div className="flex items-center justify-center gap-3 text-left">
                  <img
                    src={previewUrl}
                    alt="Uploaded invoice preview"
                    className="w-16 h-20 object-cover rounded-lg border border-slate-200"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#0F766E] inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Bill image attached</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Click to replace or confirm extracted details below
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-11 h-11 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center mx-auto mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    Drop invoice image here, or tap to browse
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports faded thermal receipts, JPG, PNG, and PDF tax bills
                  </p>
                </>
              )}
            </div>

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
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AssetCategory)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:border-[#0F766E]"
                >
                  <option value="appliance">Home Appliance</option>
                  <option value="electronics">Office / Electronics</option>
                  <option value="power">Inverter / Power</option>
                  <option value="medical">Clinic / Medical</option>
                </select>
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
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Model Number
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono text-slate-900 focus:outline-none focus:border-[#0F766E]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={amountInr}
                  onChange={(e) => setAmountInr(e.target.value)}
                  required
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:border-[#0F766E]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  required
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#0F766E]"
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
                  onChange={(e) => setWarrantyMonths(e.target.value)}
                  required
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono tabular-nums text-slate-900 focus:outline-none focus:border-[#0F766E]"
                />
              </div>
            </div>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer min-h-[44px]">
              <span className="text-xs font-medium text-slate-700">
                Mark as GST Input Credit Eligible (Business / Clinic)
              </span>
              <input
                type="checkbox"
                checked={gstEligible}
                onChange={(e) => setGstEligible(e.target.checked)}
                className="w-4 h-4 accent-[#0F766E]"
              />
            </label>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMode('whatsapp')}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                Send via WhatsApp instead
              </button>
              <button
                type="submit"
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0F766E] text-white text-sm font-medium hover:bg-[#115E59] transition-colors whitespace-nowrap"
              >
                Save &amp; Verify Bill
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 text-center space-y-4">
            <div className="inline-flex p-4 rounded-2xl bg-[#FAFAF7] border border-slate-200">
              {/* Crisp deterministic SVG QR for WhatsApp */}
              <svg
                width="148"
                height="148"
                viewBox="0 0 148 148"
                className="text-slate-900"
                aria-label="WhatsApp WarrantyVault QR Code"
              >
                <rect width="148" height="148" fill="#FFFFFF" rx="8" />
                <rect x="12" y="12" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="22" y="22" width="16" height="16" fill="#0F766E" />
                <rect x="100" y="12" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="110" y="22" width="16" height="16" fill="#0F766E" />
                <rect x="12" y="100" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="22" y="110" width="16" height="16" fill="#0F766E" />
                <path
                  fill="currentColor"
                  d="M60 14h8v8h-8zm16 0h12v8H76zM60 30h16v8H60zm24 8h8v16h-8zM14 60h16v8H14zm24 0h12v12H38zm22 0h18v8H60zm26 0h12v16H86zm24 0h22v8h-22zm-50 20h16v12H60zm26 4h14v10H86zm24-4h10v20h-10zm14 14h10v16h-10zM60 100h12v12H60zm20 4h16v8H80zm-20 18h20v12H60zm28-4h16v16H88zm24 8h22v10h-22z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Forward any bill to +91 90040 82858
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Scan this QR code with your phone camera to open WhatsApp. Snap a faded receipt or forward an Amazon/Flipkart PDF—it appears here in seconds.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
              <button
                type="button"
                onClick={() => {
                  addToast(
                    'Opening WhatsApp Vault',
                    'Message +91 90040 82858 with any bill photo.'
                  );
                  setAddBillOpen(false);
                }}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0F766E] text-white text-sm font-medium hover:bg-[#115E59] transition-colors inline-flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                <span>Open WhatsApp Chat</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('upload')}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Back to Web Upload
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
