import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  Check,
  Copy,
  Download,
  FileText,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import {
  computeReadiness,
  computeStatus,
  formatDateDDMMMYYYY,
  formatINR,
} from '../utils/formatters';
import { StatusBadge } from './StatusBadge';

export function ClaimPacketView() {
  const { assets, selectedAssetId, profile, addToast } = useVault();
  const [packetAssetId, setPacketAssetId] = useState(
    selectedAssetId || assets[0]?.id || ''
  );
  const [step, setStep] = useState<1 | 2 | 3>(2);
  const [activePage, setActivePage] = useState<1 | 2 | 3>(1);
  const [copied, setCopied] = useState(false);

  const asset =
    assets.find((a) => a.id === packetAssetId) || assets[0] || null;

  const defaultComplaint = asset
    ? `Dear ${asset.supportName} Team,\n\nI would like to register a warranty service request for my ${asset.brand} ${asset.productName} (Model: ${asset.model}).\n\n• Serial Number: ${asset.serialNumber || 'Attached on sticker'}\n• Purchase Date: ${formatDateDDMMMYYYY(asset.purchaseDate)}\n• Invoice Amount: ${formatINR(asset.amountInr)}\n• Seller GSTIN: ${asset.sellerGstin || 'Available on invoice'}\n• Registered Mobile: +91 ${profile.phone}\n\nPlease find the restored tax invoice and serial plate attached in the claim packet. Kindly share a technician visit slot and ticket number.\n\nRegards,\n${profile.name}`
    : '';

  const [complaintText, setComplaintText] = useState(defaultComplaint);

  useEffect(() => {
    setComplaintText(defaultComplaint);
  }, [packetAssetId, assets]);

  if (!asset) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <p className="text-sm text-slate-600">
          Add an asset to your vault to generate a warranty claim packet.
        </p>
      </div>
    );
  }

  const { score } = computeReadiness(asset);
  const status = computeStatus(asset);

  const handleCopyComplaint = async () => {
    try {
      await navigator.clipboard.writeText(complaintText);
      setCopied(true);
      addToast('Complaint text copied', 'Ready to paste in WhatsApp or email.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Copy manually', 'Select the text box to copy.', 'info');
    }
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 44;

    // Page 1: Summary
    doc.setFillColor(15, 118, 110);
    doc.rect(0, 0, 595, 76, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('WarrantyVault Warranty Claim Packet', margin, 42);
    doc.setFontSize(10);
    doc.text(`Page 1 of 3 · Generated ${formatDateDDMMMYYYY(new Date().toISOString().slice(0, 10))}`, margin, 60);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.text(`${asset.brand} ${asset.productName}`, margin, 115);

    doc.setFontSize(10);
    const rows = [
      ['Owner Name', profile.name],
      ['Registered Mobile', `+91 ${profile.phone}`],
      ['Model Number', asset.model],
      ['Serial Number', asset.serialNumber || 'Pending QR Scan'],
      ['Purchase Date', formatDateDDMMMYYYY(asset.purchaseDate)],
      ['Warranty Period', `${asset.warrantyMonths} months`],
      ['Warranty Expiry', formatDateDDMMMYYYY(asset.expiryDate)],
      ['Invoice Amount', `INR ${asset.amountInr.toLocaleString('en-IN')}`],
      ['Seller GSTIN', asset.sellerGstin || 'N/A'],
      ['Claim Readiness', `${score}%`],
    ];

    let y = 148;
    for (const [k, v] of rows) {
      doc.setTextColor(100, 116, 139);
      doc.text(k, margin, y);
      doc.setTextColor(15, 23, 42);
      doc.text(String(v), margin + 150, y);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + 8, 550, y + 8);
      y += 28;
    }

    // Page 2: Customer Care & Complaint Draft
    doc.addPage();
    doc.setFillColor(15, 118, 110);
    doc.rect(0, 0, 595, 64, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('Brand Customer Care & Service Request', margin, 38);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text(`Support Desk: ${asset.supportName}`, margin, 100);
    doc.text(`Toll-Free / Helpline: ${asset.supportPhone}`, margin, 120);

    doc.setFontSize(11);
    doc.text('Complaint / Service Request Script:', margin, 160);
    doc.setFontSize(10);
    const splitComplaint = doc.splitTextToSize(complaintText, 505);
    doc.text(splitComplaint, margin, 182);

    // Page 3: Proof Attachments Checklist
    doc.addPage();
    doc.setFillColor(15, 118, 110);
    doc.rect(0, 0, 595, 64, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('Verified Invoice & Serial Sticker Proof', margin, 38);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text(
      '1. Fade-Restored Tax Invoice: Attached & timestamped in WarrantyVault',
      margin,
      110
    );
    doc.text(
      `2. Appliance Serial Sticker: ${
        asset.serialStickerUrl ? 'Verified & Linked' : 'Not yet captured'
      }`,
      margin,
      135
    );
    doc.text(
      `3. Video Proof Clips Attached: ${(asset.animatedVideos || []).length}`,
      margin,
      160
    );

    const filename = `WarrantyVault_Claim_${asset.brand}_${asset.model}.pdf`.replace(
      /\s+/g,
      '_'
    );
    doc.save(filename);
    setStep(3);
    addToast('3-page Claim Packet PDF downloaded', filename);
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-12">
      {/* Header & Stepper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Claim Packet Generator
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Assemble a 3-page service proof PDF with restored invoice, serial sticker, and brand helpline
          </p>
        </div>

        {/* 3-Step Indicator */}
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl self-start">
          {[
            { num: 1 as const, label: '1. Asset' },
            { num: 2 as const, label: '2. Preview' },
            { num: 3 as const, label: '3. Export' },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setStep(s.num)}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                step === s.num
                  ? 'bg-[#0F766E] text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Step 1 Asset Selector + Brand Support Card + Complaint Box */}
        <div className="lg:col-span-5 space-y-5">
          {/* Step 1: Select Asset */}
          <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3">
            <label
              htmlFor="claim-asset-select"
              className="block text-sm font-semibold text-slate-900"
            >
              Step 1 · Select Vault Asset
            </label>
            <select
              id="claim-asset-select"
              value={asset.id}
              onChange={(e) => {
                setPacketAssetId(e.target.value);
                setStep(2);
              }}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:border-[#0F766E]"
            >
              {assets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.brand} {item.productName} ({computeReadiness(item).score}% ready)
                </option>
              ))}
            </select>

            <div className="flex items-center justify-between pt-1">
              <StatusBadge status={status} compact />
              <span className="text-xs font-semibold text-slate-700 tabular-nums">
                Readiness: {score}%
              </span>
            </div>
          </section>

          {/* Brand Support Helpline Card */}
          <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-medium text-slate-500">
                Authorized Brand Support
              </span>
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 mt-0.5">
                {asset.supportName}
              </h3>
              <p className="text-sm font-mono font-semibold text-[#0F766E] tabular-nums mt-0.5">
                {asset.supportPhone}
              </p>
            </div>
            <a
              href={`tel:${asset.supportPhone.replace(/\s+/g, '')}`}
              onClick={() =>
                addToast(
                  `Dialing ${asset.supportName}`,
                  asset.supportPhone,
                  'info'
                )
              }
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs sm:text-sm font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call now</span>
            </a>
          </section>

          {/* Copyable Complaint Message */}
          <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Service Complaint Message
              </h3>
              <button
                type="button"
                onClick={handleCopyComplaint}
                className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-800 inline-flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy complaint text</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={8}
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              aria-label="Auto-generated warranty complaint message"
              className="w-full p-3 rounded-xl border border-slate-200 bg-[#FAFAF7] text-xs text-slate-800 leading-relaxed focus:outline-none focus:border-[#0F766E]"
            />
          </section>
        </div>

        {/* Right: Step 2 & 3 — 3-Page PDF Preview + Export Actions */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0F766E]" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Step 2 · 3-Page Claim Packet Preview
                </h2>
              </div>

              {/* Page switcher */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {[
                  { page: 1 as const, label: 'Page 1: Summary' },
                  { page: 2 as const, label: 'Page 2: Support' },
                  { page: 3 as const, label: 'Page 3: Proof' },
                ].map((p) => (
                  <button
                    key={p.page}
                    type="button"
                    onClick={() => {
                      setActivePage(p.page);
                      setStep(2);
                    }}
                    className={`min-h-[38px] px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      activePage === p.page
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Paper Sheet Preview */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden min-h-[420px]">
              <div className="bg-[#0F766E] text-white px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="font-bold text-sm font-display">
                    WarrantyVault Claim Dossier
                  </span>
                </div>
                <span className="text-xs text-teal-100 tabular-nums">
                  Page {activePage} of 3
                </span>
              </div>

              {activePage === 1 && (
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-xs text-slate-500">Covered Asset</p>
                      <h3 className="text-lg font-bold text-slate-900">
                        {asset.brand} {asset.productName}
                      </h3>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">
                        Model {asset.model}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Invoice Value</p>
                      <p className="text-lg font-bold text-slate-900 tabular-nums">
                        {formatINR(asset.amountInr)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[#FAFAF7] border border-slate-100">
                      <span className="text-slate-500">Customer Name</span>
                      <p className="font-semibold text-slate-900 mt-0.5">
                        {profile.name}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FAFAF7] border border-slate-100">
                      <span className="text-slate-500">Registered Phone</span>
                      <p className="font-semibold font-mono text-slate-900 mt-0.5">
                        +91 {profile.phone}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FAFAF7] border border-slate-100">
                      <span className="text-slate-500">Serial Number</span>
                      <p className="font-semibold font-mono text-slate-900 mt-0.5">
                        {asset.serialNumber || 'Missing — link via QR'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FAFAF7] border border-slate-100">
                      <span className="text-slate-500">Seller GSTIN</span>
                      <p className="font-semibold font-mono text-slate-900 mt-0.5">
                        {asset.sellerGstin || 'Not recorded'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FAFAF7] border border-slate-100">
                      <span className="text-slate-500">Purchase Date</span>
                      <p className="font-semibold text-slate-900 mt-0.5 tabular-nums">
                        {formatDateDDMMMYYYY(asset.purchaseDate)}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FAFAF7] border border-slate-100">
                      <span className="text-slate-500">Warranty Valid Until</span>
                      <p className="font-semibold text-[#0F766E] mt-0.5 tabular-nums">
                        {formatDateDDMMMYYYY(asset.expiryDate)} ({asset.warrantyMonths}m)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activePage === 2 && (
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-teal-800">
                        Brand Service Desk
                      </p>
                      <p className="text-base font-bold text-teal-950">
                        {asset.supportName}
                      </p>
                      <p className="text-sm font-mono font-semibold text-[#0F766E] mt-0.5">
                        {asset.supportPhone}
                      </p>
                    </div>
                    <a
                      href={`tel:${asset.supportPhone.replace(/\s+/g, '')}`}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0F766E] text-white text-xs font-medium inline-flex items-center gap-1.5"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call now</span>
                    </a>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">
                      Email / WhatsApp Complaint Text
                    </p>
                    <pre className="whitespace-pre-wrap font-sans text-xs text-slate-700 bg-[#FAFAF7] p-4 rounded-xl border border-slate-200 leading-relaxed">
                      {complaintText}
                    </pre>
                  </div>
                </div>
              )}

              {activePage === 3 && (
                <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700">
                      Restored Tax Invoice
                    </p>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 h-64 overflow-hidden flex items-center justify-center">
                      <img
                        src={asset.invoiceRestoredUrl}
                        alt="Restored invoice proof"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700">
                      Serial Sticker Plate
                    </p>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 h-64 overflow-hidden flex items-center justify-center">
                      {asset.serialStickerUrl ? (
                        <img
                          src={asset.serialStickerUrl}
                          alt="Serial sticker proof"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <p className="text-xs text-orange-700 px-4 text-center">
                          Serial sticker not linked yet. Scan QR on Asset Detail page.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Export Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="flex-1 min-w-[170px] min-h-[48px] px-4 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(3);
                  addToast(
                    'Claim packet shared to WhatsApp',
                    `Sent 3-page PDF for ${asset.brand} ${asset.productName} to +91 ${profile.phone}.`
                  );
                }}
                className="flex-1 min-w-[170px] min-h-[48px] px-4 py-2.5 rounded-xl border border-[#0F766E] bg-teal-50 hover:bg-teal-100 text-[#0F766E] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share on WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleCopyComplaint}
                className="min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Copy complaint text</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
