import React, { useMemo, useState } from 'react';
import {
  Bell,
  Clock,
  Lock,
  LogIn,
  MessageCircle,
  RotateCcw,
  Shield,
  Trash2,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import {
  formatDateDDMMMYYYY,
  formatINR,
  getDaysRemaining,
  offsetDaysFromToday,
} from '../utils/formatters';

export function RemindersSettingsView() {
  const {
    assets,
    profile,
    currentView,
    setCurrentView,
    updateProfile,
    clearAllData,
    resetDemoData,
    openAssetDetail,
  } = useVault();

  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [vaultName, setVaultName] = useState(profile.vaultName);
  const [confirmWipe, setConfirmWipe] = useState(false);

  const upcomingAlerts = useMemo(() => {
    const events: Array<{
      id: string;
      assetId: string;
      title: string;
      brand: string;
      amountInr: number;
      alertType: 'T-30 Days' | 'T-7 Days';
      alertDate: string;
      daysUntilAlert: number;
      expiryDate: string;
    }> = [];

    for (const item of assets) {
      const daysLeft = getDaysRemaining(item.expiryDate);
      if (daysLeft < 0) continue;

      if (daysLeft >= 7) {
        events.push({
          id: `${item.id}-t7`,
          assetId: item.id,
          title: item.productName,
          brand: item.brand,
          amountInr: item.amountInr,
          alertType: 'T-7 Days',
          alertDate: offsetDaysFromToday(daysLeft - 7),
          daysUntilAlert: daysLeft - 7,
          expiryDate: item.expiryDate,
        });
      }
      if (daysLeft >= 30) {
        events.push({
          id: `${item.id}-t30`,
          assetId: item.id,
          title: item.productName,
          brand: item.brand,
          amountInr: item.amountInr,
          alertType: 'T-30 Days',
          alertDate: offsetDaysFromToday(daysLeft - 30),
          daysUntilAlert: daysLeft - 30,
          expiryDate: item.expiryDate,
        });
      }
    }

    return events.sort((a, b) => a.daysUntilAlert - b.daysUntilAlert).slice(0, 8);
  }, [assets]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim() || profile.name,
      phone: phone.trim() || profile.phone,
      vaultName: vaultName.trim() || profile.vaultName,
    });
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {currentView === 'reminders'
              ? 'Warranty Reminders & Alerts'
              : 'Account & Privacy Settings'}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Track scheduled WhatsApp expiry alerts and manage your vault profile
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl">
          <button
            type="button"
            onClick={() => setCurrentView('reminders')}
            className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              currentView === 'reminders'
                ? 'bg-[#0F766E] text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Reminders
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('settings')}
            className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              currentView === 'settings'
                ? 'bg-[#0F766E] text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Reminders Timeline */}
        <section
          className={`lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 ${
            currentView === 'settings' ? 'order-2 lg:order-1' : 'order-1'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Upcoming Alert Timeline
                </h2>
                <p className="text-xs text-slate-500">
                  Automatic T-30 and T-7 day warranty notifications
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#FAFAF7] border border-slate-200 flex items-center gap-2.5 text-xs text-slate-700">
            <MessageCircle className="w-4 h-4 text-[#0F766E] shrink-0" />
            <span>
              Reminders are sent on WhatsApp at <strong>9:00 AM IST</strong>
            </span>
          </div>

          {upcomingAlerts.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              No upcoming warranty alerts scheduled.
            </p>
          ) : (
            <div className="relative pl-5 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
              {upcomingAlerts.map((alert) => (
                <button
                  key={alert.id}
                  type="button"
                  onClick={() => openAssetDetail(alert.assetId)}
                  className="relative w-full text-left block p-3.5 rounded-xl border border-slate-200 hover:border-[#0F766E] bg-white transition-colors"
                >
                  <span
                    className={`absolute -left-[18px] top-4 w-3 h-3 rounded-full border-2 border-white ${
                      alert.daysUntilAlert <= 7
                        ? 'bg-amber-500'
                        : 'bg-[#0F766E]'
                    }`}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#0F766E] inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {alert.alertType} ·{' '}
                        {formatDateDDMMMYYYY(alert.alertDate)}
                      </span>
                    </span>
                    <span className="text-xs font-mono text-slate-500 tabular-nums">
                      {formatINR(alert.amountInr)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {alert.brand} {alert.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                    Warranty expires {formatDateDDMMMYYYY(alert.expiryDate)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Settings & DPDP Privacy */}
        <section
          className={`lg:col-span-6 space-y-5 ${
            currentView === 'settings' ? 'order-1 lg:order-2' : 'order-2'
          }`}
        >
          <form
            onSubmit={handleSaveProfile}
            className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900">
                Profile &amp; Vault Identity
              </h2>
              <button
                type="button"
                onClick={() => setCurrentView('login')}
                className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-[#0F766E] hover:bg-teal-50 inline-flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Preview OTP Login</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#0F766E]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Vault Label
              </label>
              <input
                type="text"
                value={vaultName}
                onChange={(e) => setVaultName(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#0F766E]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Registered WhatsApp Number
              </label>
              <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:border-[#0F766E]">
                <span className="px-3 py-2.5 bg-slate-50 border-r border-slate-200 text-xs font-mono font-semibold text-slate-700">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-sm font-semibold transition-colors"
            >
              Save Profile
            </button>
          </form>

          {/* Privacy & DPDP Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Privacy &amp; DPDP Act Compliance
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  All invoices, serial numbers, and GST documents are stored in private encrypted storage under India&apos;s Digital Personal Data Protection (DPDP) Act. WarrantyVault never sells bill history or shares records with third-party lenders.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={resetDemoData}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Sample Vault</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmWipe(true)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete my data</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Delete My Data Confirmation Modal */}
      {confirmWipe && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5 text-red-700">
              <Shield className="w-5 h-5" />
              <h3 className="text-base font-semibold text-slate-900">
                Permanently delete all vault data?
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Under DPDP compliance, all uploaded bills, serial stickers, and shared vault links will be permanently erased from this device.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmWipe(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmWipe(false);
                  clearAllData();
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700"
              >
                Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
