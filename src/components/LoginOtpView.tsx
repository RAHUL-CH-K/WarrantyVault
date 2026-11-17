import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';

export function LoginOtpView() {
  const { profile, updateProfile, setCurrentView, addToast } = useVault();
  const [phone, setPhone] = useState(profile.phone.replace(/\s+/g, ''));
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (step !== 'otp' || timer <= 0) return;
    const id = setInterval(() => {
      setTimer((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [step, timer]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phone.replace(/\D/g, '').slice(-10);
    if (cleaned.length !== 10) {
      addToast('Invalid phone number', 'Enter a 10-digit Indian mobile number.', 'error');
      return;
    }
    setPhone(cleaned);
    setStep('otp');
    setTimer(30);
    setOtp(['', '', '', '', '', '']);
    addToast('OTP sent via SMS & WhatsApp', `Code dispatched to +91 ${cleaned}.`);
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.join('').length < 6) {
      addToast('Enter 6-digit OTP', 'Use the demo code 482910 or check SMS.', 'error');
      return;
    }
    const formatted = `${phone.slice(0, 5)} ${phone.slice(5)}`;
    updateProfile({ phone: formatted });
    setCurrentView('dashboard');
    addToast('Signed in to WarrantyVault', `Vault synced with +91 ${formatted}.`);
  };

  const fillDemoOtp = () => {
    setOtp(['4', '8', '2', '9', '1', '0']);
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Login / OTP Card */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <button
              type="button"
              onClick={() => setCurrentView('dashboard')}
              className="min-h-[44px] -ml-2 px-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-[#0F766E] mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Vault Dashboard</span>
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#0F766E] text-white flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold font-display text-slate-900">
                WarrantyVault
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mt-4">
              {step === 'phone'
                ? 'Sign in to your Warranty Vault'
                : 'Enter 6-digit verification code'}
            </h1>
            <p className="text-sm text-slate-600 mt-1.5">
              {step === 'phone'
                ? 'Access restored invoices, scan serial stickers, and download GST claim packets.'
                : `We sent a 6-digit OTP to +91 ${phone.slice(0, 5)} ${phone.slice(5)}`}
            </p>

            {step === 'phone' ? (
              <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Mobile Number
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-300 bg-white focus-within:border-[#0F766E] focus-within:ring-2 focus-within:ring-teal-600/15 overflow-hidden">
                    <span className="px-3.5 py-3 bg-slate-50 border-r border-slate-200 text-sm font-mono font-semibold text-slate-700">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="98204 51120"
                      className="flex-1 min-h-[48px] px-3.5 py-2.5 text-base font-mono tabular-nums text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#0F766E] text-white text-sm font-semibold hover:bg-[#115E59] transition-colors"
                >
                  Send OTP
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="mt-6 space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-700">
                      6-Digit OTP
                    </span>
                    <button
                      type="button"
                      onClick={fillDemoOtp}
                      className="text-xs font-medium text-[#0F766E] hover:underline"
                    >
                      Auto-fill demo OTP (482910)
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-2 sm:gap-3">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          inputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        aria-label={`OTP digit ${idx + 1}`}
                        className="h-12 sm:h-14 text-center text-lg font-mono font-semibold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-600/20"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="text-slate-600 hover:text-slate-900 font-medium min-h-[44px]"
                  >
                    Change number
                  </button>
                  {timer > 0 ? (
                    <span className="text-slate-500 tabular-nums">
                      Resend OTP in 00:{String(timer).padStart(2, '0')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setTimer(30);
                        addToast('OTP resent', `New code sent to +91 ${phone}.`);
                      }}
                      className="text-[#0F766E] font-semibold hover:underline min-h-[44px]"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#0F766E] text-white text-sm font-semibold hover:bg-[#115E59] transition-colors inline-flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify &amp; Open Vault</span>
                </button>
              </form>
            )}
          </div>

          <p className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
            Protected under India DPDP privacy controls. Only members you invite can view your invoices.
          </p>
        </div>

        {/* Right: WhatsApp Continuity Side Note */}
        <div className="lg:col-span-5 bg-[#0F766E] text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold leading-snug">
              Already messaged us on WhatsApp? You&apos;re already registered.
            </h2>
            <p className="text-sm text-teal-50 leading-relaxed">
              Just sign in with the same +91 number you used to send bill photos to WarrantyVault Bot. All your receipts, extracted GSTINs, and expiry alerts are waiting inside.
            </p>
            <ul className="space-y-2 text-xs text-teal-100 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Automatic thermal bill fade-restoration</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>T-30 &amp; T-7 day WhatsApp expiry reminders</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>One-click 3-page warranty claim PDFs</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => {
              addToast(
                'WhatsApp Bot Ready',
                'Message +91 90040 82858 with any invoice photo.'
              );
            }}
            className="mt-8 w-full min-h-[48px] px-4 py-3 rounded-xl bg-white text-[#0F766E] text-sm font-semibold hover:bg-teal-50 transition-colors inline-flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Open WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
