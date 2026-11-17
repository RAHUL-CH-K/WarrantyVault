import React, { useMemo, useState } from 'react';
import JSZip from 'jszip';
import {
  Download,
  FileSpreadsheet,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { SharedMember } from '../types/vault';
import { formatDateDDMMMYYYY, formatINR } from '../utils/formatters';

export function SharedVaultView() {
  const { assets, members, inviteMember, removeMember, addToast } = useVault();

  const [phoneInput, setPhoneInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [roleInput, setRoleInput] =
    useState<SharedMember['role']>('Family');

  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2027-12-31');
  const [gstOnly, setGstOnly] = useState(true);
  const [exporting, setExporting] = useState(false);

  const invitedCount = members.filter((m) => m.role !== 'Owner').length;

  const filteredExportAssets = useMemo(() => {
    return assets.filter((item) => {
      if (gstOnly && !item.gstEligible) return false;
      if (startDate && item.purchaseDate < startDate) return false;
      if (endDate && item.purchaseDate > endDate) return false;
      return true;
    });
  }, [assets, gstOnly, startDate, endDate]);

  const exportTotalValue = useMemo(
    () => filteredExportAssets.reduce((sum, item) => sum + item.amountInr, 0),
    [filteredExportAssets]
  );

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = inviteMember(phoneInput, nameInput, roleInput);
    if (ok) {
      setPhoneInput('');
      setNameInput('');
    }
  };

  const handleExportZipCsv = async () => {
    if (filteredExportAssets.length === 0) {
      addToast(
        'No invoices match filter',
        'Adjust the date range or GST filter to export.',
        'error'
      );
      return;
    }

    setExporting(true);
    try {
      const headers = [
        'Asset ID',
        'Brand',
        'Product Name',
        'Model',
        'Serial Number',
        'Purchase Date',
        'Expiry Date',
        'Seller GSTIN',
        'GST Eligible',
        'Invoice Amount (INR)',
      ];
      const rows = filteredExportAssets.map((a) => [
        a.id,
        `"${a.brand}"`,
        `"${a.productName}"`,
        `"${a.model}"`,
        `"${a.serialNumber || 'PENDING'}"`,
        a.purchaseDate,
        a.expiryDate,
        `"${a.sellerGstin || ''}"`,
        a.gstEligible ? 'YES' : 'NO',
        a.amountInr,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((r) => r.join(',')),
      ].join('\n');

      const zip = new JSZip();
      zip.file('warrantyvault_gst_invoices.csv', csvContent);
      zip.file(
        'ca_summary_manifest.json',
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            invoiceCount: filteredExportAssets.length,
            totalInr: exportTotalValue,
            gstOnlyFilter: gstOnly,
            dateRange: { startDate, endDate },
            items: filteredExportAssets.map((a) => ({
              brand: a.brand,
              productName: a.productName,
              sellerGstin: a.sellerGstin,
              purchaseDate: a.purchaseDate,
              amountInr: a.amountInr,
            })),
          },
          null,
          2
        )
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `WarrantyVault_CA_Export_${startDate}_to_${endDate}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      addToast(
        'ZIP + CSV exported',
        `${filteredExportAssets.length} invoices (${formatINR(exportTotalValue)}) downloaded.`
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Shared Vault &amp; CA Export
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Share warranty access with family or clinic staff, and export GST-ready invoice bundles for your Chartered Accountant
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Shared Members & Invite */}
        <section className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Vault Members
                </h2>
                <p className="text-xs text-slate-500">
                  Invite family, spouse, or clinic manager
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold font-mono tabular-nums text-[#0F766E]">
              {invitedCount} of 3 slots used
            </span>
          </div>

          {/* Member Rows */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 p-3.5 bg-white"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {member.name}
                    </p>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-md border whitespace-nowrap shrink-0 ${
                        member.role === 'Owner'
                          ? 'bg-teal-50 text-[#0F766E] border-teal-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-500 mt-0.5 tabular-nums">
                    +91 {member.phone} · Added {formatDateDDMMMYYYY(member.addedAt)}
                  </p>
                </div>

                {member.role !== 'Owner' && (
                  <button
                    type="button"
                    onClick={() => removeMember(member.id)}
                    aria-label={`Remove ${member.name}`}
                    className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Invite Form */}
          <form
            onSubmit={handleInvite}
            className="pt-2 border-t border-slate-100 space-y-3"
          >
            <h3 className="text-sm font-semibold text-slate-900">
              Invite by phone number
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Member Name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Riya Kulkarni"
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#0F766E]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Role
                </label>
                <select
                  value={roleInput}
                  onChange={(e) =>
                    setRoleInput(e.target.value as SharedMember['role'])
                  }
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:border-[#0F766E]"
                >
                  <option value="Family">Family</option>
                  <option value="CA / Tax">CA / Tax</option>
                  <option value="Clinic Staff">Clinic Staff</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="flex-1 flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:border-[#0F766E]">
                <span className="px-3 py-2.5 bg-slate-50 border-r border-slate-200 text-xs font-mono font-semibold text-slate-700">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phoneInput}
                  onChange={(e) =>
                    setPhoneInput(e.target.value.replace(/\D/g, ''))
                  }
                  placeholder="98110 22345"
                  className="w-full min-h-[44px] px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={invitedCount >= 3}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-50 text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                <span>Send Invite</span>
              </button>
            </div>
          </form>
        </section>

        {/* Right: GST / CA Export Card */}
        <section className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                GST / CA Export
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Download GST-compliant invoice CSV and manifest bundle for quarterly ITC filing
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-[#FAFAF7] cursor-pointer min-h-[48px]">
            <div>
              <span className="block text-sm font-medium text-slate-900">
                GST Eligible invoices only
              </span>
              <span className="block text-xs text-slate-500">
                Filter out personal non-ITC home receipts
              </span>
            </div>
            <input
              type="checkbox"
              checked={gstOnly}
              onChange={(e) => setGstOnly(e.target.checked)}
              className="w-5 h-5 accent-[#0F766E]"
            />
          </label>

          {/* Live Preview Count */}
          <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-teal-900">
                Matching Invoices Ready
              </span>
              <p className="text-xl font-bold text-[#0F766E] tabular-nums mt-0.5">
                {filteredExportAssets.length}{' '}
                {filteredExportAssets.length === 1 ? 'invoice' : 'invoices'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-teal-900">
                Total Taxable Value
              </span>
              <p className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
                {formatINR(exportTotalValue)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportZipCsv}
            disabled={exporting}
            className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Preparing Archive…' : 'Export ZIP + CSV'}</span>
          </button>
        </section>
      </div>
    </div>
  );
}
