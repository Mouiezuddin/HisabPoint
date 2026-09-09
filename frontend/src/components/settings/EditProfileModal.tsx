import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../features/auth/AuthContext';
import { authService } from '../../services/auth.service';
import { showToast } from '../ui/Toast';
import { getErrorMessage } from '../../utils/format';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authService.updateProfile({ name: name.trim(), phone: phone.trim() });
      await refreshUser();
      showToast('Profile updated successfully.', 'success');
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profile & Account">
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {error && (
          <div className="bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold rounded-xl p-3">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="prof-name">
            Full Name *
          </label>
          <input
            id="prof-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Merchant / Shopkeeper Name"
            className="input text-xs"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="prof-phone">
            Phone Number
          </label>
          <input
            id="prof-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="input text-xs"
          />
        </div>

        {/* Email (Read-only) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-stone-700" htmlFor="prof-email">
              Email Address
            </label>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-300">
              ✓ Primary Login
            </span>
          </div>
          <input
            id="prof-email"
            type="email"
            value={user?.email || ''}
            disabled
            className="input text-xs bg-stone-100 text-stone-500 cursor-not-allowed border-dashed"
          />
          <p className="text-[10px] text-stone-400 mt-1">
            Email address is tied to your login credentials and cannot be changed here.
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
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
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
