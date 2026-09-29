import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { authService } from '../../services/auth.service';
import { showToast } from '../ui/Toast';
import { useAuth } from '../../features/auth/AuthContext';

interface PrivacyDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyDataModal({ isOpen, onClose }: PrivacyDataModalProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [exporting, setExporting] = useState(false);
  const [showDeleteStep, setShowDeleteStep] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function handleExportData() {
    setExporting(true);
    try {
      const data = await authService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hisabpoint_dpdp_export_${user?.name?.toLowerCase().replace(/\s+/g, '_') || 'user'}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Personal data exported successfully (JSON format).', 'success');
    } catch {
      showToast('Failed to export data. Please try again.', 'error');
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError('');
    try {
      await authService.deleteAccount({
        password: password || undefined,
        confirmation: confirmation || undefined,
      });
      showToast('Account and all associated records have been permanently erased.', 'success');
      onClose();
      await logout();
      navigate('/', { replace: true });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const resp = (err as { response?: { data?: { message?: string } } }).response;
        setDeleteError(resp?.data?.message || 'Failed to erase account.');
      } else {
        setDeleteError('An unexpected error occurred while erasing your account.');
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Data Privacy & DPDP Rights">
      <div className="space-y-4 pt-1 max-h-[78vh] overflow-y-auto pr-1">
        {/* DPDP Compliance Badge */}
        <div className="bg-[#194a32] text-white p-4 rounded-2xl border border-emerald-700 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gold-300 font-serif">
              ✦ DPDP Act, 2023 Compliant
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-800 text-[10px] font-bold text-emerald-200">
              India
            </span>
          </div>
          <p className="text-xs text-stone-200 leading-relaxed">
            HisabPoint respects your sovereignty over your personal records in full compliance with the
            Digital Personal Data Protection Act, 2023.
          </p>
        </div>

        {/* Data Transparency Card: What happens to your data */}
        <div className="bg-white rounded-xl p-3.5 border border-[#ded5be] space-y-2">
          <p className="font-bold text-xs text-stone-900 font-serif flex items-center gap-1.5">
            <span>🔍</span>
            <span>What happens to your data? (Data Transparency)</span>
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-[#f9f7f1] p-2.5 rounded-lg border border-[#eae3d2]">
              <p className="font-bold text-[#194a32]">🔐 Never Sold or Shared</p>
              <p className="text-stone-600 text-[10px] mt-0.5">Your khata records are 100% private. We never sell data to advertisers.</p>
            </div>
            <div className="bg-[#f9f7f1] p-2.5 rounded-lg border border-[#eae3d2]">
              <p className="font-bold text-[#194a32]">🗄️ Tenant Isolated</p>
              <p className="text-stone-600 text-[10px] mt-0.5">Strict database isolation ensures other shopkeepers cannot see your books.</p>
            </div>
            <div className="bg-[#f9f7f1] p-2.5 rounded-lg border border-[#eae3d2]">
              <p className="font-bold text-[#194a32]">💬 Merchant Controlled</p>
              <p className="text-stone-600 text-[10px] mt-0.5">Customer reminders are only sent when you explicitly tap Send.</p>
            </div>
            <div className="bg-[#f9f7f1] p-2.5 rounded-lg border border-[#eae3d2]">
              <p className="font-bold text-[#194a32]">⏱️ Immediate Erasure</p>
              <p className="text-stone-600 text-[10px] mt-0.5">Deleting a customer or your account immediately purges live records.</p>
            </div>
          </div>
        </div>

        {/* Section 11: Data Portability */}
        <div className="bg-parchment-100 rounded-xl p-4 border border-parchment-300 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-stone-900 font-serif uppercase tracking-wide">
                1. Right to Access & Portability (Section 11)
              </h4>
              <p className="text-xs text-stone-600 mt-0.5">
                Download a complete, machine-readable JSON copy of your profile, business details, customer contacts, ledger transactions, and invoice summaries.
              </p>
            </div>
            <span className="text-xl">📦</span>
          </div>

          <button
            type="button"
            onClick={handleExportData}
            disabled={exporting}
            className="w-full py-2.5 px-4 bg-[#194a32] hover:bg-forest-950 text-gold-300 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            {exporting ? (
              <span>Preparing Export…</span>
            ) : (
              <>
                <span>📥</span>
                <span>Export My Data (JSON)</span>
              </>
            )}
          </button>
        </div>

        {/* Section 12: Right to Erasure / Delete Account */}
        <div className="bg-rose-50/70 rounded-xl p-4 border border-rose-200 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-rose-900 font-serif uppercase tracking-wide">
                2. Right to Erasure / Right to be Forgotten (Section 12)
              </h4>
              <p className="text-xs text-stone-600 mt-0.5">
                Permanently and irreversibly wipe your account, business profile, customer credit records, invoices, and login history from our servers.
              </p>
            </div>
            <span className="text-xl">⚠️</span>
          </div>

          {!showDeleteStep ? (
            <button
              type="button"
              onClick={() => setShowDeleteStep(true)}
              className="w-full py-2.5 px-4 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Request Account & Data Erasure
            </button>
          ) : (
            <div className="space-y-3 pt-2 border-t border-rose-200">
              <p className="text-xs text-rose-800 font-bold">
                Confirm Irreversible Account Deletion:
              </p>
              <p className="text-[11px] text-stone-600">
                Enter your account password (or type <strong>DELETE</strong> if using Google sign-in) to authorize complete data erasure.
              </p>

              <input
                type="password"
                placeholder="Enter password or type DELETE"
                value={password || confirmation}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setConfirmation(e.target.value);
                }}
                className="input text-xs w-full bg-white border-rose-300"
              />

              {deleteError && (
                <p className="text-[11px] text-rose-700 font-bold">{deleteError}</p>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting || (!password && confirmation !== 'DELETE')}
                  className="flex-1 py-2 bg-rose-800 hover:bg-rose-900 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  {deleting ? 'Erasing Everything…' : 'Permanently Delete Everything'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteStep(false);
                    setPassword('');
                    setConfirmation('');
                    setDeleteError('');
                  }}
                  className="px-3 py-2 bg-stone-200 text-stone-700 font-bold text-xs rounded-xl hover:bg-stone-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section 13: Grievance Officer & Statutory Notice */}
        <div className="bg-parchment-100 rounded-xl p-4 border border-parchment-300 space-y-2">
          <h4 className="text-xs font-bold text-stone-900 font-serif uppercase tracking-wide">
            3. Grievance Redressal & Statutory Notice (Section 13)
          </h4>
          <p className="text-xs text-stone-600">
            For data protection queries or formal grievance redressal, email our designated Grievance Officer at{' '}
            <a href="mailto:grievance@hisabpoint.com" className="font-bold text-[#194a32] underline">
              grievance@hisabpoint.com
            </a>
            . Unresolved grievances may be escalated to the <strong>Data Protection Board of India (DPBI)</strong>.
          </p>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/privacy');
              }}
              className="text-xs font-bold text-[#194a32] hover:underline"
            >
              Read Full Privacy Policy (English / हिन्दी) →
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-parchment-200 hover:bg-parchment-300 text-stone-800 font-bold text-xs rounded-xl border border-parchment-300 transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
