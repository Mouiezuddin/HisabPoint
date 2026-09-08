import React from 'react';
import { ResponsiveModal } from '../ui/ResponsiveModal';
import { IOSInstallInstructions } from './IOSInstallInstructions';
import { usePWA } from '../../features/pwa/usePWA';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallAppModal({ isOpen, onClose }: InstallAppModalProps) {
  const { isIOS, isAndroid, promptInstall } = usePWA();

  const handleNativeInstall = async () => {
    const res = await promptInstall();
    if (res.outcome === 'accepted') {
      onClose();
    }
  };

  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose} title="Install HisabPoint App">
      <div className="space-y-5 text-center">
        {/* App Icon Graphic */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-[#f7f4ea] border-2 border-gold-500 shadow-lg flex items-center justify-center overflow-hidden p-1">
          <img src="/logo-mark.webp" alt="HisabPoint Icon" className="w-full h-full rounded-2xl object-cover" />
        </div>

        <div>
          <h3 className="text-xl font-black font-serif text-stone-900">
            HisabPoint Digital Ledger
          </h3>
          <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto">
            Install on your device for instant 1-tap access, fast fullscreen experience, and offline app-shell support.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-2 py-2 text-left">
          <div className="bg-white/80 p-2.5 rounded-xl border border-parchment-300 text-center">
            <span className="text-lg">⚡</span>
            <p className="text-[11px] font-bold text-stone-900 mt-0.5">Instant Load</p>
            <p className="text-[9px] text-stone-500">Opens in &lt;1 second</p>
          </div>
          <div className="bg-white/80 p-2.5 rounded-xl border border-parchment-300 text-center">
            <span className="text-lg">📱</span>
            <p className="text-[11px] font-bold text-stone-900 mt-0.5">No Browser Bar</p>
            <p className="text-[9px] text-stone-500">Pure app view</p>
          </div>
          <div className="bg-white/80 p-2.5 rounded-xl border border-parchment-300 text-center">
            <span className="text-lg">🔒</span>
            <p className="text-[11px] font-bold text-stone-900 mt-0.5">Secure Khata</p>
            <p className="text-[9px] text-stone-500">Bank-grade SSL</p>
          </div>
        </div>

        {/* Platform Specific Action */}
        {isIOS ? (
          <IOSInstallInstructions />
        ) : (
          <div className="space-y-3 pt-2">
            <button
              onClick={handleNativeInstall}
              className="w-full btn-forest text-white font-black py-3.5 px-6 rounded-xl shadow-skeuo-green flex items-center justify-center gap-2 text-sm transition-transform active:scale-98"
              id="btn-confirm-pwa-install"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Install HisabPoint App
            </button>

            <p className="text-[11px] text-stone-500">
              {isAndroid
                ? 'Tip: If prompt does not appear, tap your Chrome menu (⋮) → "Add to Home Screen".'
                : 'On Desktop Chrome/Edge: You can also click the Install icon in the address bar.'}
            </p>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
}
