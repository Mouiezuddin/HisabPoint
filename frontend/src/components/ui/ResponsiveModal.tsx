import React, { useEffect } from 'react';

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export function ResponsiveModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidthClass = 'max-w-lg',
}: ResponsiveModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      {/* Darkened backdrop */}
      <div
        className="fixed inset-0 bg-leather-950/75 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Skeuomorphic Parchment Modal Box */}
      <div
        className={`relative w-full ${maxWidthClass} bg-parchment-100 rounded-t-3xl md:rounded-3xl border-2 border-gold-600/60 shadow-2xl z-10 overflow-hidden max-h-[90vh] flex flex-col transition-all transform animate-slideUp leather-stitch`}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Pull Indicator */}
        <div className="w-12 h-1.5 bg-parchment-300 rounded-full mx-auto my-2 md:hidden flex-shrink-0" />

        {/* Leather Binder Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-leather-900 via-leather-800 to-leather-950 text-white border-b-2 border-gold-500/40 flex-shrink-0">
          <h2 className="text-lg font-black gold-emboss font-serif tracking-wide">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-leather-950 hover:bg-black text-gold-400 font-bold flex items-center justify-center border border-gold-500/50 shadow-sm active:scale-95 transition-transform"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-gradient-to-b from-parchment-50 to-parchment-100">{children}</div>
      </div>
    </div>
  );
}
