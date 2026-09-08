import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../features/auth/AuthContext';
import { getErrorMessage } from '../../utils/format';

export function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password2: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Your name or shop name is required.';
    if (!form.email.trim()) errs.email = 'Email address is required.';
    if (!form.password) errs.password = 'Password is required.';
    if (form.password.length < 8) errs.password = 'Must be at least 8 characters.';
    if (form.password !== form.password2) errs.password2 = 'Passwords do not match.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError('');
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        password2: form.password2,
      });
      navigate('/', { replace: true });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const resp = (err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }).response;
        const apiErrors = resp?.data?.errors;
        if (apiErrors) {
          const mapped: Record<string, string> = {};
          Object.entries(apiErrors).forEach(([k, v]) => {
            mapped[k] = v[0];
          });
          setErrors(mapped);
          return;
        }
      }
      setServerError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse: { credential?: string }) {
    if (!credentialResponse.credential) {
      setServerError('Google authentication did not provide a valid credential token.');
      return;
    }
    setGoogleLoading(true);
    setServerError('');
    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate('/', { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  }

  function handleGoogleError() {
    setServerError('Google Sign-In failed or was cancelled. Please try again.');
  }

  return (
    <div className="min-h-dvh bg-wood-desk text-amber-100 flex items-center justify-center p-4 selection:bg-gold-500 selection:text-forest-950 font-sans">
      <div className="w-full max-w-5xl bg-[#194a32] rounded-3xl border-4 border-[#d4af37]/60 p-4 sm:p-8 shadow-2xl leather-stitch relative">
        {/* Metal Brass Corners */}
        <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-gold-400 rounded-tl-2xl pointer-events-none shadow-md" />
        <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-gold-400 rounded-tr-2xl pointer-events-none shadow-md" />
        <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-gold-400 rounded-bl-2xl pointer-events-none shadow-md" />
        <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-gold-400 rounded-br-2xl pointer-events-none shadow-md" />

        {/* Center Spine Rings (Desktop) */}
        <div className="hidden md:flex flex-col justify-between items-center absolute left-1/2 top-10 bottom-10 -translate-x-1/2 z-20 pointer-events-none">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="w-4 h-6 bg-[#3b362e] rounded-full border-2 border-gold-500 shadow-lg" />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-stretch relative z-10">
          {/* Left Page - Bahi Khata Registration Form */}
          <div className="bg-[#f7f4ea] text-[#2c2825] rounded-2xl p-6 sm:p-8 border border-[#e5dec8] shadow-lg flex flex-col justify-between bg-paper-lines relative">
            <div className="space-y-4">
              {/* Brand Header */}
              <div
                className="flex items-center gap-2.5 cursor-pointer group"
                onClick={() => navigate('/')}
              >
                <img
                  src="/logo-mark.webp"
                  alt="HisabPoint Logo"
                  className="w-10 h-10 rounded-xl object-contain shadow-md border border-[#c4b595] bg-[#f7f4ea]"
                />
                <div>
                  <span className="text-2xl font-black font-serif text-[#194a32] tracking-tight group-hover:underline">
                    HisabPoint
                  </span>
                  <span className="ml-2 bg-gold-500 text-forest-950 text-[10px] font-black px-2 py-0.5 rounded shadow-sm border border-amber-300">
                    खाता
                  </span>
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-black font-serif text-[#1c1815]">Create Your Account</h1>
                <p className="text-xs text-[#665e52] font-medium mt-0.5">
                  Start your digital khata journey in less than 30 seconds
                </p>
              </div>

              {serverError && (
                <div className="bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold rounded-xl px-4 py-2.5 shadow-sm" role="alert">
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                <div>
                  <label className="block text-xs font-bold text-[#4a433b] mb-1" htmlFor="reg-name">
                    Shopkeeper Name / Shop Name
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
                      👤
                    </span>
                    <input
                      id="reg-name"
                      type="text"
                      value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                      placeholder="e.g. Moinuddin General Store"
                      className="input text-xs pl-10 bg-[#fffdf7]"
                      required
                    />
                  </div>
                  {errors.name && <p className="text-[10px] text-rose-700 font-bold mt-0.5">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#4a433b] mb-1" htmlFor="reg-phone">
                      Phone Number
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
                        📱
                      </span>
                      <input
                        id="reg-phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => set('phone', e.target.value)}
                        placeholder="9876543210"
                        className="input text-xs pl-10 bg-[#fffdf7]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#4a433b] mb-1" htmlFor="reg-email">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
                        ✉️
                      </span>
                      <input
                        id="reg-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => set('email', e.target.value)}
                        placeholder="you@domain.com"
                        className="input text-xs pl-10 bg-[#fffdf7]"
                        required
                      />
                    </div>
                    {errors.email && <p className="text-[10px] text-rose-700 font-bold mt-0.5">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#4a433b] mb-1" htmlFor="reg-password">
                      Password
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
                        🔒
                      </span>
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => set('password', e.target.value)}
                        placeholder="••••••••"
                        className="input text-xs pl-10 pr-9 bg-[#fffdf7]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-bold hover:text-stone-800"
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {errors.password && <p className="text-[10px] text-rose-700 font-bold mt-0.5">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#4a433b] mb-1" htmlFor="reg-password2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
                        🔑
                      </span>
                      <input
                        id="reg-password2"
                        type={showPassword ? 'text' : 'password'}
                        value={form.password2}
                        onChange={(e) => set('password2', e.target.value)}
                        placeholder="••••••••"
                        className="input text-xs pl-10 bg-[#fffdf7]"
                        required
                      />
                    </div>
                    {errors.password2 && <p className="text-[10px] text-rose-700 font-bold mt-0.5">{errors.password2}</p>}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full btn-forest text-white font-bold py-3.5 text-xs rounded-xl shadow-md flex items-center justify-center gap-2 mt-2"
                  id="reg-submit"
                >
                  {loading ? (
                    <span>Creating Account…</span>
                  ) : (
                    <>
                      <span>Get Started Free</span>
                      <span>→</span>
                    </>
                  )}
                </button>

                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#d8cfbe]" />
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase">
                    <span className="bg-[#f7f4ea] px-2 text-[#786f62] font-bold">or continue with</span>
                  </div>
                </div>

                <div className="flex justify-center w-full min-h-[40px] items-center">
                  {googleLoading ? (
                    <div className="text-xs font-bold text-[#194a32] animate-pulse">
                      Setting up account with Google...
                    </div>
                  ) : (
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      shape="pill"
                      theme="outline"
                      text="continue_with"
                      width="100%"
                    />
                  )}
                </div>
              </form>
            </div>

            <div className="pt-4 mt-4 border-t border-[#e5dec8] text-center">
              <p className="text-xs text-[#665e52] font-semibold">
                Already have an account?{' '}
                <Link to="/login" className="text-[#194a32] font-black hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>

          {/* Right Page - Benefits & Trust Showcase */}
          <div className="hidden md:flex bg-[#f7f4ea] text-[#2c2825] rounded-2xl p-6 sm:p-8 border border-[#e5dec8] shadow-lg flex-col justify-between bg-paper-lines relative">
            <div className="border-b border-[#e5dec8] pb-4 flex justify-between items-center">
              <span className="text-xs font-bold text-[#194a32] uppercase tracking-widest font-serif">
                ✦ WHY SHOPKEEPERS CHOOSE US ✦
              </span>
              <span className="text-xs text-[#786f62] font-medium">Page 02</span>
            </div>

            <div className="my-auto space-y-4 py-2">
              <h3 className="text-lg font-black font-serif text-[#194a32]">
                Leave paper notebooks behind. Keep khata 100% simple.
              </h3>

              <div className="bg-white p-4 rounded-2xl border border-[#e5dec8] space-y-2.5 text-xs font-medium text-[#4a433b] shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="text-emerald-700 font-bold text-sm">✓</span>
                  <span>100% Free — No hidden costs or limits</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-emerald-700 font-bold text-sm">✓</span>
                  <span>Automatic calculation — No manual math errors</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-emerald-700 font-bold text-sm">✓</span>
                  <span>Instant customer ledger & balance tracking</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-emerald-700 font-bold text-sm">✓</span>
                  <span>Syncs seamlessly on mobile, tablet & laptop</span>
                </div>
              </div>

              <div className="bg-[#ece5d5] p-3.5 rounded-xl border border-[#d8cea0] text-center space-y-0.5 text-xs">
                <p className="font-bold text-[#194a32]">⚡ Fast 30-Second Setup</p>
                <p className="text-[11px] text-[#665e52]">No credit card required. Start tracking customer dues immediately.</p>
              </div>
            </div>

            <div className="border-t border-[#e5dec8] pt-4 flex items-center justify-between text-[11px] font-bold text-[#5c5449]">
              <span className="flex items-center gap-1">🛡️ 100% Data Encrypted</span>
              <span className="flex items-center gap-1">🏪 Kirana & Retail</span>
              <span className="flex items-center gap-1">✨ Always Free</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
