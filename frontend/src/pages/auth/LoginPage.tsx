import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../features/auth/AuthContext';
import { getErrorMessage } from '../../utils/format';

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function LoginPage() {
  const { login, verify2FA, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Rate Limiting & Lockout State
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // 2FA Challenge State
  const [twoFaPending, setTwoFaPending] = useState(false);
  const [preAuthToken, setPreAuthToken] = useState('');
  const [twoFaCode, setTwoFaCode] = useState('');
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  // Initialize lockout, failed attempts, and check for ?demo=true on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('demo') === 'true') {
      setEmail('demo@hisabpoint.com');
      setPassword('demo1234');
      setIsDemoMode(true);
    }

    const storedUntil = localStorage.getItem('hisab_login_lockout_until');
    if (storedUntil) {
      const lockoutUntil = parseInt(storedUntil, 10);
      const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      if (remaining > 0) {
        setLockoutSeconds(remaining);
        setRemainingAttempts(0);
        return;
      } else {
        localStorage.removeItem('hisab_login_lockout_until');
        localStorage.removeItem('hisab_failed_login_attempts');
      }
    }

    const storedAttempts = parseInt(localStorage.getItem('hisab_failed_login_attempts') || '0', 10);
    if (!isNaN(storedAttempts) && storedAttempts > 0 && storedAttempts < 5) {
      setRemainingAttempts(5 - storedAttempts);
    }
  }, []);

  // Countdown timer tick
  useEffect(() => {
    if (lockoutSeconds <= 0) return;

    const timer = setInterval(() => {
      const storedUntil = localStorage.getItem('hisab_login_lockout_until');
      if (storedUntil) {
        const lockoutUntil = parseInt(storedUntil, 10);
        const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
        if (remaining <= 0) {
          localStorage.removeItem('hisab_login_lockout_until');
          localStorage.removeItem('hisab_failed_login_attempts');
          setLockoutSeconds(0);
          setRemainingAttempts(null);
          setError('');
        } else {
          setLockoutSeconds(remaining);
        }
      } else {
        setLockoutSeconds((prev) => {
          if (prev <= 1) {
            localStorage.removeItem('hisab_login_lockout_until');
            localStorage.removeItem('hisab_failed_login_attempts');
            setRemainingAttempts(null);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      const res = await login(email.trim(), password);
      // Clean up lockout state on successful login
      localStorage.removeItem('hisab_login_lockout_until');
      localStorage.removeItem('hisab_failed_login_attempts');
      setLockoutSeconds(0);
      setRemainingAttempts(null);

      if (res && res['2fa_required'] && res.pre_auth_token) {
        setTwoFaPending(true);
        setPreAuthToken(res.pre_auth_token);
        setTwoFaCode('');
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: unknown) {
      const errorObj = err as {
        response?: {
          status?: number;
          data?: {
            locked?: boolean;
            retry_after?: number;
            remaining_attempts?: number;
            message?: string;
            detail?: string;
          };
        };
      };
      const respStatus = errorObj?.response?.status;
      const respData = errorObj?.response?.data;

      // Track failed attempts in localStorage
      const currentFailed = (parseInt(localStorage.getItem('hisab_failed_login_attempts') || '0', 10) || 0) + 1;

      // Lock if server returns 429/locked OR client reaches 5 failed attempts
      const isLockedNow = respStatus === 429 || Boolean(respData?.locked) || currentFailed >= 5;

      if (isLockedNow) {
        const retryAfter = typeof respData?.retry_after === 'number' ? respData.retry_after : 1800;
        const lockoutUntil = Date.now() + retryAfter * 1000;
        localStorage.setItem('hisab_login_lockout_until', lockoutUntil.toString());
        localStorage.setItem('hisab_failed_login_attempts', '5');
        setLockoutSeconds(retryAfter);
        setRemainingAttempts(0);
        setError(
          respData?.message ||
          respData?.detail ||
          'Too many failed login attempts (5/5). Your account is locked for 30 minutes.'
        );
      } else {
        localStorage.setItem('hisab_failed_login_attempts', currentFailed.toString());
        const remaining = typeof respData?.remaining_attempts === 'number'
          ? respData.remaining_attempts
          : Math.max(1, 5 - currentFailed);
        setRemainingAttempts(remaining);
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleTwoFaSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!twoFaCode.trim() || !preAuthToken) return;
    setTwoFaLoading(true);
    setError('');
    try {
      await verify2FA(preAuthToken, twoFaCode.trim());
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setTwoFaLoading(false);
    }
  }

  function handleCancelTwoFa() {
    setTwoFaPending(false);
    setPreAuthToken('');
    setTwoFaCode('');
    setError('');
  }

  async function handleGoogleSuccess(credentialResponse: { credential?: string }) {
    if (lockoutSeconds > 0) return;
    if (!credentialResponse.credential) {
      setError('Google authentication did not provide a valid credential token.');
      return;
    }
    setGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogle(credentialResponse.credential);
      localStorage.removeItem('hisab_login_lockout_until');
      setLockoutSeconds(0);
      setRemainingAttempts(null);
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  }

  function handleGoogleError() {
    setError('Google Sign-In failed or was cancelled. Please try again.');
  }

  function handleDemoFill() {
    if (lockoutSeconds > 0) return;
    setEmail('demo@hisabpoint.com');
    setPassword('demo1234');
  }

  const isLocked = lockoutSeconds > 0;

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

                {!twoFaPending && (
                  <button
                    type="button"
                    onClick={handleDemoFill}
                    disabled={isLocked}
                    className={`text-[11px] font-bold text-[#194a32] bg-[#ece5d5] hover:bg-[#e2d8c3] px-2.5 py-1 rounded-lg border border-[#cfc4a6] transition-all ${
                      isLocked ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                    title={isLocked ? 'Locked' : 'Auto-fill demo credentials'}
                  >
                    ⚡ Fill Demo
                  </button>
                )}
              </div>

              <div>
                <h1 className="text-2xl font-black font-serif text-[#1c1815]">
                  {twoFaPending ? 'Security Verification' : 'Welcome Back!'}
                </h1>
                <p className="text-xs text-[#665e52] font-medium mt-1">
                  {twoFaPending
                    ? 'Verify your identity using your authenticator code'
                    : 'Sign in to access your digital shop khata & customer ledger'}
                </p>
              </div>

              {/* 30-Minute Lockout Alert with Live Countdown */}
              {isLocked ? (
                <div className="bg-gradient-to-br from-[#fef3c7] via-[#fde68a] to-[#fcd34d] border-2 border-[#d97706] rounded-2xl p-4 shadow-md space-y-3 text-[#78350f]">
                  <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-[#92400e]">
                    <span className="text-xl">⏳</span>
                    <span>Account Locked (5 Failed Attempts)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#78350f] font-medium">
                    Too many consecutive incorrect passwords. Sign-in has been locked for 30 minutes to protect your ledger data.
                  </p>
                  <div className="bg-[#fffbeb] border border-[#f59e0b] rounded-xl p-3 flex items-center justify-between shadow-inner">
                    <span className="text-xs font-black uppercase tracking-wider text-[#b45309]">
                      Unlocks In:
                    </span>
                    <span className="font-mono text-2xl font-black text-[#b45309] tracking-widest bg-white/90 px-3 py-0.5 rounded-lg border border-[#fde68a] shadow-sm">
                      {formatCountdown(lockoutSeconds)}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#92400e]/80 text-center font-semibold italic">
                    The login form will automatically re-enable once the timer expires.
                  </p>
                </div>
              ) : (
                <>
                  {/* Remaining attempts warning banner */}
                  {remainingAttempts !== null && remainingAttempts > 0 && remainingAttempts < 5 && (
                    <div className="bg-amber-50 border border-amber-400 text-amber-900 rounded-xl px-3.5 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-sm animate-pulse">
                      <span className="text-base">⚠️</span>
                      <span>
                        <strong>Security Notice:</strong> {remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining before a 30-minute lockout.
                      </span>
                    </div>
                  )}

                  {isDemoMode && !error && (
                    <div className="bg-emerald-50 border border-emerald-400 text-emerald-900 rounded-xl px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
                      <div className="flex items-center gap-2">
                        <span className="text-base">⚡</span>
                        <span>
                          <strong>Demo Mode Active:</strong> Test credentials loaded. Click <strong>Sign In to Khata</strong> below!
                        </span>
                      </div>
                      <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-[10px] font-bold">Product Hunt</span>
                    </div>
                  )}

                  {error && (
                    <div className="bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold rounded-xl px-4 py-3 shadow-sm" role="alert">
                      {error}
                    </div>
                  )}
                </>
              )}

              {twoFaPending ? (
                <form onSubmit={handleTwoFaSubmit} className="space-y-4" noValidate>
                  <div className="bg-[#fff9e6] border border-[#d4af37]/60 rounded-xl p-3.5 text-center space-y-1">
                    <div className="text-2xl">🛡️</div>
                    <p className="text-xs font-bold text-stone-800">
                      Two-Factor Authentication Required
                    </p>
                    <p className="text-[11px] text-stone-600">
                      Enter the 6-digit code from Google Authenticator, Authy, or one of your 8 backup recovery codes.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#4a433b] mb-1.5" htmlFor="login-2fa-code">
                      6-Digit Authenticator or Recovery Code
                    </label>
                    <input
                      id="login-2fa-code"
                      type="text"
                      autoFocus
                      maxLength={16}
                      value={twoFaCode}
                      onChange={(e) => setTwoFaCode(e.target.value)}
                      placeholder="e.g. 123456 or A1B2-C3D4"
                      className="input text-center text-base tracking-widest font-mono font-bold bg-[#fffdf7] uppercase"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={twoFaLoading || !twoFaCode.trim()}
                    className="w-full btn-forest text-white font-bold py-3.5 text-xs rounded-xl shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                    id="login-2fa-submit"
                  >
                    {twoFaLoading ? (
                      <span>Verifying Code…</span>
                    ) : (
                      <>
                        <span>Verify & Unlock Khata</span>
                        <span>→</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelTwoFa}
                    className="w-full text-center text-xs font-bold text-[#665e52] hover:text-[#194a32] hover:underline pt-2"
                  >
                    ← Back to Standard Sign In
                  </button>
                </form>
              ) : (
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
                        disabled={isLocked}
                        className={`input text-xs pl-10 bg-[#fffdf7] ${
                          isLocked ? 'opacity-60 cursor-not-allowed bg-stone-100' : ''
                        }`}
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
                        disabled={isLocked}
                        className={`input text-xs pl-10 pr-10 bg-[#fffdf7] ${
                          isLocked ? 'opacity-60 cursor-not-allowed bg-stone-100' : ''
                        }`}
                        required
                      />
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-bold hover:text-stone-800 disabled:opacity-40"
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLocked || loading || googleLoading}
                    className={`w-full btn-forest text-white font-bold py-3.5 text-xs rounded-xl shadow-md flex items-center justify-center gap-2 mt-2 ${
                      isLocked ? 'opacity-50 cursor-not-allowed bg-stone-600 hover:bg-stone-600' : ''
                    }`}
                    id="login-submit"
                  >
                    {isLocked ? (
                      <span>🔒 Locked ({formatCountdown(lockoutSeconds)})</span>
                    ) : loading ? (
                      <span>Signing In…</span>
                    ) : (
                      <>
                        <span>Sign In to Khata</span>
                        <span>→</span>
                      </>
                    )}
                  </button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#d8cfbe]" />
                    </div>
                    <div className="relative flex justify-center text-[11px] uppercase">
                      <span className="bg-[#f7f4ea] px-2 text-[#786f62] font-bold">or continue with</span>
                    </div>
                  </div>

                  <div className={`flex justify-center w-full min-h-[40px] items-center ${isLocked ? 'opacity-40 pointer-events-none' : ''}`}>
                    {googleLoading ? (
                      <div className="text-xs font-bold text-[#194a32] animate-pulse">
                        Signing in with Google...
                      </div>
                    ) : (
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        shape="pill"
                        theme="outline"
                        text="continue_with"
                        width="320"
                      />
                    )}
                  </div>
                </form>
              )}
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
