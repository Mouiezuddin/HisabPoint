import React from 'react';
import { usePWA } from '../../features/pwa/usePWA';

export function PWAUpdateToast() {
  const { updateAvailable, applyUpdate } = usePWA();

  if (!updateAvailable) return null;

  return (
    <div
      role="alert"
      className="fixed top-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-gradient-to-r from-forest-950 via-forest-900 to-forest-950 text-white rounded-2xl border-2 border-amber-400 p-4 shadow-2xl animate-slideDown leather-stitch backdrop-blur-md"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center flex-shrink-0 border border-amber-400/40">
          <svg className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wider font-serif">
            Update Available
          </h4>
          <p className="text-xs text-stone-200 mt-0.5">
            A new version of HisabPoint is ready.
          </p>
        </div>

        <button
          onClick={applyUpdate}
          className="btn-forest text-white text-xs font-black px-3.5 py-1.5 rounded-xl shadow-md border border-gold-400/50 flex-shrink-0 active:scale-95 transition-transform"
          id="btn-pwa-apply-update"
        >
          Update
        </button>
      </div>
    </div>
  );
}
