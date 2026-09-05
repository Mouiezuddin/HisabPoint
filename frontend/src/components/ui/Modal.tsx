import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel matching Screen 24 */}
      <div className="relative bg-parchment-100 text-stone-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl border-4 border-parchment-300 space-y-4">
        <div className="flex items-center justify-between border-b border-parchment-300 pb-2">
          <h2 id="modal-title" className="text-lg font-black font-serif text-stone-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-parchment-200 hover:bg-parchment-300 text-stone-800 font-bold text-xs flex items-center justify-center"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  loading,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center space-y-3 py-2">
        {/* Warning Icon Badge matching Screen 24 */}
        <div className="w-14 h-14 rounded-full bg-amber-100 border-2 border-amber-400 text-amber-800 flex items-center justify-center text-2xl font-black mx-auto shadow-sm">
          !
        </div>

        <h3 className="text-xl font-black font-serif text-stone-900">{title}</h3>
        <p className="text-xs text-stone-600 font-medium leading-relaxed">{message}</p>

        <div className="flex gap-3 pt-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 bg-parchment-200 hover:bg-parchment-300 text-stone-800 font-bold text-xs rounded-xl border border-parchment-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-md"
          >
            {loading ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
