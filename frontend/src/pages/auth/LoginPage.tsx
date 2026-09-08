import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { getErrorMessage } from '../../utils/format';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleDemoFill() {
    setEmail('demo@hisabpoint.com');
    setPassword('demo1234');
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
          {/* Left Page - Bahi Khata Sign In Form */}
          <div className="bg-[#f7f4ea] text-[#2c2825] rounded-2xl p-6 sm:p-8 border border-[#e5dec8] shadow-lg flex flex-col justify-between bg-paper-lines relative">
            <div className="space-y-6">
              {/* Brand Header */}
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-2.5 cursor-pointer group"
                  onClick={() => navigate('/')}
                >
                  <img
                    src="/logo-mark.png"
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

                <button
                  type="button"
                  onClick={handleDemoFill}
                  className="text-[11px] font-bold text-[#194a32] bg-[#ece5d5] hover:bg-[#e2d8c3] px-2.5 py-1 rounded-lg border border-[#cfc4a6] transition-all"
                  title="Auto-fill demo credentials"
                >
                  ⚡ Fill Demo
                </button>
              </div>

              <div>
                <h1 className="text-2xl font-black font-serif text-[#1c1815]">Welcome Back!</h1>
                <p className="text-xs text-[#665e52] font-medium mt-1">
                  Sign in to access your digital shop khata & customer ledger
                </p>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold rounded-xl px-4 py-3 shadow-sm" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label className="block text-xs font-bold text-[#4a433b] mb-1.5" htmlFor="login-email">
                    Email or Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
                      📱
                    </span>
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="9876543210 or email@domain.com"
                      className="input text-xs pl-10 bg-[#fffdf7]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-[#4a433b]" htmlFor="login-password">
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-xs text-[#194a32] font-bold hover:underline">
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
                      🔒
                    </span>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input text-xs pl-10 pr-10 bg-[#fffdf7]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-bold hover:text-stone-800"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-forest text-white font-bold py-3.5 text-xs rounded-xl shadow-md flex items-center justify-center gap-2 mt-2"
                  id="login-submit"
                >
                  {loading ? (
                    <span>Signing In…</span>
                  ) : (
                    <>
                      <span>Sign In to Khata</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="pt-6 mt-6 border-t border-[#e5dec8] text-center">
              <p className="text-xs text-[#665e52] font-semibold">
                New to HisabPoint?{' '}
                <Link to="/register" className="text-[#194a32] font-black hover:underline">
                  Create Shop Account
                </Link>
              </p>
            </div>
          </div>

          {/* Right Page - Illustrated Shopkeeper Trust & Feature Showcase */}
          <div className="hidden md:flex bg-[#f7f4ea] text-[#2c2825] rounded-2xl p-6 sm:p-8 border border-[#e5dec8] shadow-lg flex-col justify-between bg-paper-lines relative">
            {/* Header Badge */}
            <div className="border-b border-[#e5dec8] pb-4 flex justify-between items-center">
              <span className="text-xs font-bold text-[#194a32] uppercase tracking-widest font-serif">
                ✦ DIGITAL BAHI KHATA ✦
              </span>
              <span className="text-xs text-[#786f62] font-medium">Page 01</span>
            </div>

            {/* Middle Feature Visual Box */}
            <div className="my-auto space-y-4 py-2">
              <div className="bg-[#ffffff] p-5 rounded-2xl border border-[#e5dec8] shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#194a32]/10 text-[#194a32] flex items-center justify-center text-2xl font-bold">
                    🏪
                  </div>
                  <div>
                    <h3 className="font-bold text-sm font-serif text-[#1c1815]">Kirana & General Store Khata</h3>
                    <p className="text-[11px] text-[#786f62] font-medium">100% Safe, Secure & Auto-Synced</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
                  <div className="bg-[#f7f4ea] p-2 rounded-xl border border-[#e5dec8]">
                    <p className="text-[10px] text-[#786f62] uppercase font-bold">Total Dues Managed</p>
                    <p className="font-black text-[#b91c1c] text-sm">₹84,500</p>
                  </div>
                  <div className="bg-[#f7f4ea] p-2 rounded-xl border border-[#e5dec8]">
                    <p className="text-[10px] text-[#786f62] uppercase font-bold">Active Customers</p>
                    <p className="font-black text-[#194a32] text-sm">27 Shops</p>
                  </div>
                </div>
              </div>

              {/* Shopkeeper Review Quote */}
              <div className="bg-[#194a32] text-white p-4 rounded-2xl shadow-md space-y-1 text-xs">
                <p className="font-bold font-serif text-[#e8e2d2]">"Ab koi hisab miss nahi hota. Customer balances are always clear!"</p>
                <p className="text-[10px] text-emerald-200 text-right">— Imran Shaikh, Shop Owner</p>
              </div>
            </div>

            {/* Bottom Trust Icons */}
            <div className="border-t border-[#e5dec8] pt-4 flex items-center justify-between text-[11px] font-bold text-[#5c5449]">
              <span className="flex items-center gap-1">🛡️ 100% Data Safe</span>
              <span className="flex items-center gap-1">📱 Mobile & Laptop</span>
              <span className="flex items-center gap-1">⚡ Instant Sync</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
