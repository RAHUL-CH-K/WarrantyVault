import { Check, CheckCheck, FileImage, MessageCircle, Pencil } from 'lucide-react';
import { INVOICE_FADED_IMG } from '../data/mockVaultData';

interface WhatsAppPreviewProps {
  onConfirmSample: () => void;
  onEditOnWeb: () => void;
}

export function WhatsAppPreview({
  onConfirmSample,
  onEditOnWeb,
}: WhatsAppPreviewProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden max-w-md w-full mx-auto text-left">
      {/* WhatsApp header */}
      <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">WarrantyVault Bot</p>
            <p className="text-[11px] text-emerald-100">Official WhatsApp Vault</p>
          </div>
        </div>
        <span className="text-[11px] text-emerald-100 font-mono">
          +91 90040 82858
        </span>
      </div>

      {/* Chat Thread */}
      <div className="bg-[#ECE5DD] p-4 space-y-3">
        {/* User message with bill photo */}
        <div className="flex justify-end">
          <div className="bg-[#DCF8C6] rounded-xl rounded-tr-xs p-2 max-w-[82%] shadow-2xs">
            <div className="relative rounded-lg overflow-hidden bg-slate-200 h-24 mb-1.5">
              <img
                src={INVOICE_FADED_IMG}
                alt="Bill photo sent on WhatsApp"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] inline-flex items-center gap-1">
                <FileImage className="w-3 h-3" />
                <span>aquaguard_bill.jpg</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-1 text-[10px] text-slate-600">
              <span>10:14 AM</span>
              <CheckCheck className="w-3.5 h-3.5 text-sky-600" />
            </div>
          </div>
        </div>

        {/* Bot reply */}
        <div className="flex justify-start">
          <div className="bg-white rounded-xl rounded-tl-xs p-3 max-w-[90%] shadow-2xs border border-slate-200/70">
            <p className="text-xs font-semibold text-slate-900">
              Bill enhanced &amp; extracted
            </p>
            <div className="mt-2 space-y-1 text-xs text-slate-700 tabular-nums">
              <p>
                <span className="text-slate-500">Product:</span> Aquaguard Aura RO
              </p>
              <p>
                <span className="text-slate-500">Amount:</span> ₹16,490
              </p>
              <p>
                <span className="text-slate-500">Warranty:</span> 12 months
              </p>
              <p className="text-amber-700 font-medium">
                Serial number missing — verify or scan sticker
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onConfirmSample}
                className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#0F766E] text-white text-xs font-medium hover:bg-[#115E59] transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm</span>
              </button>
              <button
                type="button"
                onClick={onEditOnWeb}
                className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium hover:bg-slate-100 transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit on Web</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
