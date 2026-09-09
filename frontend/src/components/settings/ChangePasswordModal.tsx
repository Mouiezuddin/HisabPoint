import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { authService } from '../../services/auth.service';
import { showToast } from '../ui/Toast';
import { getErrorMessage } from '../../utils/format';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function reset() {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!oldPassword) {
      setError('Current password is required.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword(oldPassword, newPassword);
      showToast('Password changed successfully.', 'success');
      handleClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Change Password">
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {error && (
          <div className="bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold rounded-xl p-3">
            {error}
          </div>
        )}

        {/* Current Password */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="old-pass">
            Current Password *
          </label>
          <div className="relative">
            <input
              id="old-pass"
              type={showOld ? 'text' : 'password'}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Enter current password"
              className="input text-xs pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowOld(!showOld)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800 text-xs"
            >
              {showOld ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="new-pass">
            New Password *
          </label>
          <div className="relative">
            <input
              id="new-pass"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="input text-xs pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800 text-xs"
            >
              {showNew ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="confirm-pass">
            Confirm New Password *
          </label>
          <input
            id="confirm-pass"
            type={showNew ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            className="input text-xs"
            required
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 py-2.5 bg-parchment-200 hover:bg-parchment-300 text-stone-800 font-bold text-xs rounded-xl border border-parchment-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 btn-forest text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
