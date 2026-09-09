import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { showToast } from './Toast';
import { useAuth } from '../../features/auth/AuthContext';

export interface UpiAccount {
  id: string;
  label: string;
  upiId: string;
  isDefault?: boolean;
}

const DEFAULT_ACCOUNTS: UpiAccount[] = [
  { id: 'default-1', label: 'Primary (GPay / PhonePe)', upiId: 'shopkeeper@upi', isDefault: true },
];

interface UpiQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  amount: string;
  upiId?: string;
  shopName?: string;
}

export function UpiQrModal({
  isOpen,
  onClose,
  customerName,
  amount,
  upiId: initialUpiId,
  shopName: initialShopName,
}: UpiQrModalProps) {
  const { user } = useAuth();
  const storageKey = `hisabpoint_saved_upi_${user?.id || 'default'}`;

  // Saved accounts state
  const [accounts, setAccounts] = useState<UpiAccount[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore parse errors
    }
    return DEFAULT_ACCOUNTS;
  });

  // Selected account ID
  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    const defaultAcc = accounts.find((a) => a.isDefault);
    return defaultAcc ? defaultAcc.id : accounts[0]?.id || 'default-1';
  });

  // View state: 'view' (QR code) or 'manage' (list/add/edit accounts)
  const [view, setView] = useState<'view' | 'manage'>('view');

  // Add / Edit form state
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLabel, setFormLabel] = useState('');
  const [formUpiId, setFormUpiId] = useState('');
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formError, setFormError] = useState('');

  // Persist accounts when changed
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(accounts));
    } catch {
      // Ignore localstorage errors
    }
  }, [accounts, storageKey]);

  // Ensure selectedAccountId is valid
  useEffect(() => {
    if (!accounts.some((a) => a.id === selectedAccountId)) {
      const def = accounts.find((a) => a.isDefault) || accounts[0];
      if (def) setSelectedAccountId(def.id);
    }
  }, [accounts, selectedAccountId]);

  const activeAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
  const activeUpiId = initialUpiId || activeAccount?.upiId || 'shopkeeper@upi';
  const effectiveShopName = initialShopName || user?.name || 'HisabPoint Khata';

  const cleanAmount = parseFloat(amount) || 0;
  const upiUrl = `upi://pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent(effectiveShopName)}&am=${cleanAmount}&cu=INR&tn=${encodeURIComponent(`Dues Payment - ${customerName}`)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiUrl)}`;

  function handleCopyUpi() {
    navigator.clipboard.writeText(activeUpiId);
    showToast(`UPI ID ${activeUpiId} copied!`, 'success');
  }

  function handleOpenAddForm() {
    setEditingId(null);
    setFormLabel('');
    setFormUpiId('');
    setFormIsDefault(accounts.length === 0);
    setFormError('');
    setIsAdding(true);
  }

  function handleOpenEditForm(acc: UpiAccount) {
    setEditingId(acc.id);
    setFormLabel(acc.label);
    setFormUpiId(acc.upiId);
    setFormIsDefault(!!acc.isDefault);
    setFormError('');
    setIsAdding(true);
  }

  function handleSaveAccount(e: React.FormEvent) {
    e.preventDefault();
    const cleanLabel = formLabel.trim() || 'My UPI';
    const cleanUpi = formUpiId.trim().toLowerCase();

    if (!cleanUpi) {
      setFormError('Please enter a valid UPI ID (e.g. 9876543210@okaxis).');
      return;
    }
    if (!cleanUpi.includes('@')) {
      setFormError('Invalid UPI format. Must contain "@" (e.g. name@upi, 9876543210@ybl).');
      return;
    }

    if (editingId) {
      // Edit existing
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === editingId) {
            return {
              ...acc,
              label: cleanLabel,
              upiId: cleanUpi,
              isDefault: formIsDefault,
            };
          }
          return formIsDefault ? { ...acc, isDefault: false } : acc;
        })
      );
      showToast('UPI account updated!', 'success');
    } else {
      // Create new
      const newAcc: UpiAccount = {
        id: `upi-${Date.now()}`,
        label: cleanLabel,
        upiId: cleanUpi,
        isDefault: formIsDefault || accounts.length === 0,
      };

      setAccounts((prev) => {
        const next = formIsDefault ? prev.map((a) => ({ ...a, isDefault: false })) : [...prev];
        return [...next, newAcc];
      });

      setSelectedAccountId(newAcc.id);
      showToast(`Added ${cleanLabel}!`, 'success');
    }

    setIsAdding(false);
    setEditingId(null);
  }

  function handleDeleteAccount(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (accounts.length <= 1) {
      showToast('You must keep at least one UPI ID.', 'info');
      return;
    }
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    showToast('UPI account removed.', 'info');
  }

  function handleSetDefault(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setAccounts((prev) =>
      prev.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }))
    );
    showToast('Set as default UPI account.', 'success');
  }

  function handleCloseModal() {
    setView('view');
    setIsAdding(false);
    onClose();
  }

  async function handleDownloadQr() {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `UPI-QR-${customerName.replace(/\s+/g, '_')}-${cleanAmount}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      showToast('QR code downloaded!', 'success');
    } catch {
      window.open(qrImageUrl, '_blank');
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleCloseModal} title="Scan QR Code to Pay">
      <div className="space-y-4 py-1">
        {/* Customer & Amount Banner */}
        <div className="text-center">
          <p className="text-xs text-stone-600 font-medium">
            Customer: <strong className="text-stone-900 font-serif">{customerName}</strong>
          </p>
          <p className="text-3xl font-black font-serif text-rose-800 font-tabular mt-0.5">
            ₹{cleanAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Multi-UPI Account Switcher Bar */}
        <div className="bg-parchment-200/70 p-2 rounded-2xl border border-parchment-300">
          <div className="flex items-center justify-between gap-2 mb-1.5 px-1">
            <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
              <span>💳</span>
              <span>Active UPI Destination:</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setView(view === 'view' ? 'manage' : 'view');
                setIsAdding(false);
              }}
              className="text-[11px] font-bold text-forest-900 hover:text-forest-950 underline flex items-center gap-1"
            >
              {view === 'view' ? '⚙️ Manage / Add UPI' : '← Back to QR Code'}
            </button>
          </div>

          {/* Pill selector buttons for simultaneous switching */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {accounts.map((acc) => {
              const isSelected = acc.id === selectedAccountId;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    setSelectedAccountId(acc.id);
                    if (view === 'manage') setView('view');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-[#194a32] text-amber-200 border-[#d4af37] shadow-sm scale-[1.02]'
                      : 'bg-white text-stone-700 hover:bg-parchment-100 border-stone-300'
                  }`}
                  title={acc.upiId}
                >
                  <span>{acc.label}</span>
                  {acc.isDefault && <span className="text-[10px] text-gold-400">★</span>}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setView('manage');
                handleOpenAddForm();
              }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-forest-950 border border-[#d4af37]/50 whitespace-nowrap transition-all flex items-center gap-1"
              title="Add another UPI ID"
            >
              <span>+</span>
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: QR Code & Payment Details */}
        {view === 'view' && (
          <div className="space-y-4 text-center">
            {/* Demo ID Notice */}
            {activeUpiId === 'shopkeeper@upi' && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 text-[11px] text-amber-900 flex items-center justify-between gap-2 text-left">
                <span>
                  ⚠️ <strong>Demo UPI ID active:</strong> Click &quot;Manage / Add UPI&quot; to add your real GPay, PhonePe, or Paytm UPI ID.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setView('manage');
                    handleOpenAddForm();
                  }}
                  className="bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold px-2 py-1 rounded-lg text-[10px] whitespace-nowrap border border-amber-400"
                >
                  Setup Now
                </button>
              </div>
            )}

            {/* QR Code Container */}
            <div className="bg-white rounded-2xl p-4 border-2 border-parchment-300 shadow-md inline-block mx-auto transition-all">
              <img
                src={qrImageUrl}
                alt={`UPI QR Code for ${customerName} - ₹${amount}`}
                className="w-52 h-52 mx-auto rounded-lg"
              />
              <div className="mt-3 pt-2.5 border-t border-stone-200 space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs font-bold text-stone-600">UPI ID:</span>
                  <span className="text-xs font-mono font-black text-forest-950 select-all break-all bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                    {activeUpiId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="text-xs font-bold text-[#194a32] hover:underline"
                    title="Copy UPI ID"
                  >
                    Copy
                  </button>
                </div>

                <div className="text-[10px] text-stone-500 font-medium">
                  Beneficiary: <strong>{effectiveShopName}</strong>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="btn-parchment-bevel px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                title="Download QR code image to print or share"
              >
                <span>⬇️</span>
                <span>Download QR</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setView('manage');
                  handleOpenEditForm(activeAccount);
                }}
                className="btn-parchment-bevel px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                title="Edit this UPI ID"
              >
                <span>✏️</span>
                <span>Edit UPI</span>
              </button>
            </div>

            {/* Supported Apps */}
            <div className="border-t border-parchment-300 pt-3">
              <p className="text-[10px] uppercase font-bold tracking-wider text-stone-500 mb-1">
                Scan with Any UPI App
              </p>
              <div className="flex items-center justify-center gap-3 text-xs font-bold text-stone-700">
                <span>Google Pay</span>
                <span>•</span>
                <span>PhonePe</span>
                <span>•</span>
                <span>Paytm</span>
                <span>•</span>
                <span>BHIM</span>
                <span>•</span>
                <span>Cred</span>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Manage & Add UPI Accounts */}
        {view === 'manage' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-900 font-serif">
                Manage Shop UPI Accounts
              </h3>
              {!isAdding && (
                <button
                  type="button"
                  onClick={handleOpenAddForm}
                  className="btn-forest text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1"
                >
                  <span>+</span>
                  <span>Add New UPI ID</span>
                </button>
              )}
            </div>

            {/* Add / Edit Form */}
            {isAdding && (
              <form onSubmit={handleSaveAccount} className="bg-parchment-100 p-4 rounded-xl border border-parchment-300 space-y-3">
                <h4 className="text-xs font-bold text-stone-800">
                  {editingId ? 'Edit UPI Account' : 'Add New UPI ID'}
                </h4>

                {formError && (
                  <div className="bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold rounded-lg p-2">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1" htmlFor="upi-label">
                    Account Nickname / Label
                  </label>
                  <input
                    id="upi-label"
                    type="text"
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    placeholder="e.g. Shop PhonePe, Counter GPay, Current Account"
                    className="input text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1" htmlFor="upi-vpa">
                    UPI ID (VPA)
                  </label>
                  <input
                    id="upi-vpa"
                    type="text"
                    value={formUpiId}
                    onChange={(e) => setFormUpiId(e.target.value)}
                    placeholder="e.g. 9876543210@okaxis or shopname@ibl"
                    className="input text-xs font-mono"
                    required
                  />
                  <p className="text-[10px] text-stone-500 mt-1">
                    Find this in your Google Pay / PhonePe / Paytm profile under &quot;UPI ID&quot;.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="upi-default"
                    type="checkbox"
                    checked={formIsDefault}
                    onChange={(e) => setFormIsDefault(e.target.checked)}
                    className="rounded border-stone-300 text-forest-900 focus:ring-forest-900"
                  />
                  <label htmlFor="upi-default" className="text-xs text-stone-700 font-medium cursor-pointer">
                    Set as default UPI ID for customer QR payments
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setEditingId(null);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-stone-600 hover:text-stone-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-forest text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow-xs"
                  >
                    Save UPI ID
                  </button>
                </div>
              </form>
            )}

            {/* List of Accounts */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {accounts.map((acc) => {
                const isSelected = acc.id === selectedAccountId;
                return (
                  <div
                    key={acc.id}
                    onClick={() => {
                      setSelectedAccountId(acc.id);
                      setView('view');
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-parchment-200/80 border-[#d4af37] shadow-xs'
                        : 'bg-white border-parchment-300 hover:bg-parchment-100'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900 truncate">{acc.label}</span>
                        {acc.isDefault ? (
                          <span className="bg-gold-500/20 text-forest-950 border border-gold-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            Default
                          </span>
                        ) : null}
                        {isSelected ? (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            Active
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs font-mono text-stone-600 truncate mt-0.5">{acc.upiId}</div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {!acc.isDefault && (
                        <button
                          type="button"
                          onClick={(e) => handleSetDefault(acc.id, e)}
                          className="text-[11px] text-stone-500 hover:text-forest-900 font-bold px-2 py-1 rounded hover:bg-stone-100"
                          title="Set as Default"
                        >
                          Make Default
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEditForm(acc)}
                        className="text-[11px] text-stone-700 hover:text-stone-950 font-bold px-2 py-1 rounded hover:bg-stone-100"
                        title="Edit UPI Account"
                      >
                        ✏️
                      </button>

                      {accounts.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteAccount(acc.id, e)}
                          className="text-[11px] text-rose-600 hover:text-rose-800 font-bold px-2 py-1 rounded hover:bg-rose-50"
                          title="Delete UPI Account"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setView('view')}
              className="w-full py-2 btn-parchment-bevel text-xs font-bold rounded-xl text-stone-800"
            >
              ← Back to QR Code
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
