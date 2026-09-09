import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../features/auth/AuthContext';
import { authService } from '../../services/auth.service';
import { showToast } from '../ui/Toast';
import { getErrorMessage } from '../../utils/format';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChangePassword: () => void;
}

export function SecurityModal({ isOpen, onClose, onOpenChangePassword }: SecurityModalProps) {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState<'overview' | 'setup' | 'recovery' | 'disable'>('overview');
  const [setupData, setSetupData] = useState<{ secret: string; otpauth_url: string } | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [disablePassword, setDisablePassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const is2FA = !!user?.is_2fa_enabled;

  function handleClose() {
    setStep('overview');
    setSetupData(null);
    setTotpCode('');
    setRecoveryCodes([]);
    setDisablePassword('');
    setError('');
    onClose();
  }

  async function handleStartSetup() {
    setLoading(true);
    setError('');
    try {
      const data = await authService.setup2FA();
      setSetupData(data);
      setStep('setup');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm2FA(e: React.FormEvent) {
    e.preventDefault();
    if (!totpCode.trim()) {
      setError('Please enter the 6-digit code from your authenticator app.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await authService.confirm2FA(totpCode.trim());
      setRecoveryCodes(res.recovery_codes || []);
      await refreshUser();
      setStep('recovery');
      showToast('2FA enabled successfully!', 'success');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable2FA(e: React.FormEvent) {
    e.preventDefault();
    if (!disablePassword) {
      setError('Current password is required to disable 2FA.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authService.disable2FA(disablePassword);
      await refreshUser();
      showToast('Two-factor authentication disabled.', 'info');
      handleClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleCopyCodes() {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    showToast('Recovery codes copied to clipboard!', 'success');
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Security & Credentials">
      <div className="space-y-4 pt-1">
        {error && (
          <div className="bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold rounded-xl p-3">
            {error}
          </div>
        )}

        {/* STEP 1: Overview View */}
        {step === 'overview' && (
          <div className="space-y-4">
            {/* Password Card */}
            <div className="bg-parchment-200/60 rounded-xl p-4 border border-parchment-300 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-stone-900 font-serif">Account Password</h3>
                <p className="text-[11px] text-stone-500 mt-0.5">Keep your account safe with a strong password</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenChangePassword();
                }}
                className="bg-parchment-50 hover:bg-parchment-100 text-stone-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-parchment-300 shadow-xs whitespace-nowrap"
              >
                Change
              </button>
            </div>

            {/* Two-Factor Authentication Card */}
            <div className="bg-parchment-200/60 rounded-xl p-4 border border-parchment-300 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🛡️</span>
                  <h3 className="text-xs font-bold text-stone-900 font-serif">Two-Factor Authentication</h3>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    is2FA
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {is2FA ? '✓ Enabled' : 'Disabled'}
                </span>
              </div>

              <p className="text-[11px] text-stone-600 leading-relaxed">
                {is2FA
                  ? 'Two-factor authentication is active. You will be prompted for an authenticator code during login.'
                  : 'Add an extra layer of security. In addition to your password, you will need a 6-digit code from Google Authenticator or Authy.'}
              </p>

              <div className="pt-1">
                {is2FA ? (
                  <button
                    type="button"
                    onClick={() => setStep('disable')}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-xl border border-rose-300 shadow-xs transition-colors"
                  >
                    Disable Two-Factor Authentication
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartSetup}
                    disabled={loading}
                    className="w-full py-2 btn-forest text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Initializing…' : 'Setup 2FA Now'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Setup 2FA Flow */}
        {step === 'setup' && setupData && (
          <form onSubmit={handleConfirm2FA} className="space-y-4">
            <div className="bg-parchment-50 rounded-xl p-3.5 border border-parchment-300 space-y-3 text-center">
              <p className="text-xs text-stone-700 font-semibold">
                Scan this QR code with Google Authenticator, Authy, or Microsoft Authenticator:
              </p>

              <div className="flex justify-center my-1">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(setupData.otpauth_url)}`}
                  alt="2FA QR Code"
                  className="w-36 h-36 rounded-xl border-2 border-parchment-300 shadow-xs bg-white p-2"
                />
              </div>

              <div className="text-[11px] text-stone-500 font-medium">
                Or enter this secret key manually:
              </div>
              <div className="bg-stone-100 px-3 py-2 rounded-lg font-mono text-xs font-black tracking-widest text-forest-950 border border-stone-200 select-all break-all">
                {setupData.secret}
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(setupData.secret);
                  showToast('Secret key copied!', 'success');
                }}
                className="text-[11px] font-bold text-forest-900 hover:underline inline-block"
              >
                📋 Copy Secret Key
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="totp-input">
                Enter 6-Digit Authenticator Code
              </label>
              <input
                id="totp-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="input text-center text-lg font-mono tracking-widest font-black"
                required
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('overview')}
                disabled={loading}
                className="flex-1 py-2.5 bg-parchment-200 hover:bg-parchment-300 text-stone-800 font-bold text-xs rounded-xl border border-parchment-300"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 btn-forest text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
              >
                {loading ? 'Verifying…' : 'Confirm & Enable'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Recovery Codes Display */}
        {step === 'recovery' && (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 text-2xl font-bold flex items-center justify-center mx-auto border border-emerald-300">
              ✓
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 font-serif">Save Your Recovery Codes!</h3>
              <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                If you lose access to your authenticator app, these emergency codes can be used to log in. Each code can only be used once.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-stone-100 p-3 rounded-xl border border-stone-300 font-mono text-xs font-bold text-stone-800">
              {recoveryCodes.map((c, i) => (
                <div key={i} className="py-1 px-2 bg-white rounded border border-stone-200">
                  {c}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyCodes}
                className="flex-1 py-2.5 bg-parchment-200 hover:bg-parchment-300 text-stone-800 font-bold text-xs rounded-xl border border-parchment-300"
              >
                📋 Copy All Codes
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 btn-forest text-white font-bold text-xs rounded-xl shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Disable 2FA Form */}
        {step === 'disable' && (
          <form onSubmit={handleDisable2FA} className="space-y-4">
            <div className="bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-xl p-3">
              To disable 2FA, please enter your current account password to verify your identity.
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="disable-pass">
                Current Password
              </label>
              <input
                id="disable-pass"
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Enter account password"
                className="input text-xs"
                required
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('overview')}
                disabled={loading}
                className="flex-1 py-2.5 bg-parchment-200 hover:bg-parchment-300 text-stone-800 font-bold text-xs rounded-xl border border-parchment-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
              >
                {loading ? 'Disabling…' : 'Confirm Disable'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
