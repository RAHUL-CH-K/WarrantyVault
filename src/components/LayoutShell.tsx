import React from 'react';
import {
  Bell,
  CheckCircle2,
  FileCheck2,
  FolderLock,
  LogIn,
  Plus,
  Settings,
  ShieldCheck,
  Users,
  X,
  AlertCircle,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { AppView } from '../types/vault';

const SIDEBAR_ITEMS: Array<{
  id: AppView;
  label: string;
  Icon: typeof FolderLock;
}> = [
  { id: 'dashboard', label: 'Vault', Icon: FolderLock },
  { id: 'claim-packets', label: 'Claim Packets', Icon: FileCheck2 },
  { id: 'shared-vault', label: 'Shared Vault', Icon: Users },
  { id: 'reminders', label: 'Reminders', Icon: Bell },
  { id: 'settings', label: 'Settings', Icon: Settings },
];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const {
    currentView,
    setCurrentView,
    setAddBillOpen,
    profile,
    toasts,
    dismissToast,
  } = useVault();

  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-[#FAFAF7] text-slate-900">
        <main className="max-w-6xl mx-auto py-6 px-4">{children}</main>
        <ToastContainer toasts={toasts} dismissToast={dismissToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-slate-900 flex">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-30">
        <div className="px-5 py-5 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-2.5 text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0F766E] text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold font-display tracking-tight text-slate-900 whitespace-nowrap">
              WarrantyVault
            </span>
          </button>
        </div>

        <nav
          aria-label="Primary Sidebar Navigation"
          className="flex-1 px-3 py-4 space-y-1"
        >
          {SIDEBAR_ITEMS.map(({ id, label, Icon }) => {
            const isActive =
              currentView === id ||
              (id === 'dashboard' && currentView === 'asset-detail');
            return (
              <button
                key={id}
                type="button"
                onClick={() => setCurrentView(id)}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-50 text-[#0F766E] font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Account Footer */}
        <div className="p-3 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-[#FAFAF7] border border-slate-200 space-y-2.5">
            <div>
              <p className="text-xs font-semibold text-slate-900 truncate">
                {profile.name}
              </p>
              <p className="text-[11px] font-mono text-slate-500 tabular-nums">
                +91 {profile.phone}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentView('login')}
              className="w-full min-h-[38px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>OTP Login Screen</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Compact Mobile Top Header (<= 56px) */}
        <header className="lg:hidden sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0F766E] text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-base font-bold font-display text-slate-900">
              WarrantyVault
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('login')}
            className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            +91 {profile.phone.slice(0, 5)}…
          </button>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (4 tabs + central '+' button) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 grid grid-cols-5 items-center"
      >
        <button
          type="button"
          onClick={() => setCurrentView('dashboard')}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            currentView === 'dashboard' || currentView === 'asset-detail'
              ? 'text-[#0F766E]'
              : 'text-slate-500'
          }`}
        >
          <FolderLock className="w-5 h-5" />
          <span>Vault</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('claim-packets')}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            currentView === 'claim-packets' ? 'text-[#0F766E]' : 'text-slate-500'
          }`}
        >
          <FileCheck2 className="w-5 h-5" />
          <span>Claims</span>
        </button>

        {/* Central '+' Add Bill CTA */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => setAddBillOpen(true)}
            aria-label="Add bill"
            className="-mt-4 w-12 h-12 rounded-2xl bg-[#0F766E] text-white shadow-lg flex items-center justify-center hover:bg-[#115E59] active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setCurrentView('shared-vault')}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            currentView === 'shared-vault' ? 'text-[#0F766E]' : 'text-slate-500'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Shared</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('settings')}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            currentView === 'settings' || currentView === 'reminders'
              ? 'text-[#0F766E]'
              : 'text-slate-500'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </nav>

      <ToastContainer toasts={toasts} dismissToast={dismissToast} />
    </div>
  );
}

function ToastContainer({
  toasts,
  dismissToast,
}: {
  toasts: ReturnType<typeof useVault>['toasts'];
  dismissToast: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-20 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 space-y-2 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-slate-900 text-white rounded-xl px-4 py-3 shadow-lg flex items-start justify-between gap-3 border border-slate-800"
        >
          <div className="flex items-start gap-2.5 min-w-0">
            {toast.variant === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold">{toast.title}</p>
              {toast.description && (
                <p className="text-xs text-slate-300 mt-0.5 truncate">
                  {toast.description}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
