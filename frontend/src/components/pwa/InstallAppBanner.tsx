import React, { useState, useEffect } from 'react';
import { usePWA } from '../../features/pwa/usePWA';
import { InstallAppModal } from './InstallAppModal';

export function InstallAppBanner() {
  const { isInstallable, isInstalled, isDismissed, dismissInstall, promptInstall, isIOS } = usePWA();
  const [showModal, setShowModal] = useState(false);
  const [isDelayedVisible, setIsDelayedVisible] = useState(false);

  // Wait 3.5 seconds after mounting so initial paint and page interactions are smooth
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsDelayedVisible(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  // Do not show if:
  // 1. Already installed
  // 2. Not installable (unless iOS where manual guide is supported)
  // 3. Dismissed recently
  // 4. Initial delay not reached
  if (isInstalled || isDismissed || !isDelayedVisible || !isInstallable) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      // On iOS, open modal with 3-step guide
      setShowModal(true);
    } else {
      const result = await promptInstall();
      if (result.outcome === 'manual') {
        setShowModal(true);
      }
    }
  };

  return (
    <>
      <aside 
        role="region"
        aria-label="Install HisabPoint App"
        className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:right-6 md:w-96 z-40 bg-gradient-to-r from-forest-950 via-forest-900 to-forest-950 text-white rounded-2xl border-2 border-gold-500/70 p-4 shadow-2xl animate-slideUp leather-stitch backdrop-blur-md"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-forest-950 flex items-center justify-center flex-shrink-0 shadow-md border border-amber-200">
            <span className="text-xl">📱</span>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black font-serif gold-emboss tracking-tight">
              Install HisabPoint
            </h4>
            <p className="text-[11px] text-amber-100/80 leading-relaxed mt-0.5">
              Keep your digital khata one tap away on your home screen. Fast, fullscreen & works like an app.
            </p>

            <div className="flex items-center gap-2.5 mt-3">
              <button
                onClick={handleInstallClick}
                className="btn-forest text-white text-xs font-black px-4 py-2 rounded-xl shadow-md transition-all active:scale-95 border border-gold-400/40"
                id="btn-install-banner-action"
              >
                Install App
              </button>
              <button
                onClick={dismissInstall}
                className="text-xs font-semibold text-amber-200/60 hover:text-white px-2.5 py-1.5 transition-colors"
                id="btn-install-banner-dismiss"
              >
                Not now
              </button>
            </div>
          </div>

          <button
            onClick={dismissInstall}
            className="text-amber-200/50 hover:text-white text-xs p-1"
            aria-label="Close install banner"
          >
            ✕
          </button>
        </div>
      </aside>

      {/* Manual Install Modal */}
      <InstallAppModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
