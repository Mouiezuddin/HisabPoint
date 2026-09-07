import React, { useState } from 'react';
import { usePWA } from '../../features/pwa/usePWA';
import { InstallAppModal } from './InstallAppModal';

interface InstallAppButtonProps {
  className?: string;
  variant?: 'primary' | 'outline' | 'compact';
  label?: string;
}

export function InstallAppButton({
  className = '',
  variant = 'primary',
  label = 'Install App',
}: InstallAppButtonProps) {
  const { isInstalled, isInstallable, promptInstall, isIOS } = usePWA();
  const [modalOpen, setModalOpen] = useState(false);

  // If already installed, hide the install button
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isIOS) {
      setModalOpen(true);
    } else {
      const res = await promptInstall();
      if (res.outcome === 'manual') {
        setModalOpen(true);
      }
    }
  };

  let baseStyle = 'inline-flex items-center gap-2 font-bold transition-all active:scale-95 cursor-pointer ';
  if (variant === 'primary') {
    baseStyle += 'btn-forest text-white text-xs px-4 py-2.5 rounded-xl shadow-md border border-gold-500/40 ';
  } else if (variant === 'outline') {
    baseStyle += 'bg-parchment-50 border border-gold-600/50 text-stone-800 hover:bg-parchment-200 text-xs px-4 py-2 rounded-xl shadow-xs ';
  } else if (variant === 'compact') {
    baseStyle += 'p-2 bg-forest-900/80 hover:bg-forest-900 border border-gold-500/40 rounded-xl text-gold-300 text-xs ';
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`${baseStyle} ${className}`}
        title="Install HisabPoint on your home screen or desktop"
        id="btn-trigger-install-app"
      >
        <svg className="w-4 h-4 text-gold-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>{label}</span>
      </button>

      <InstallAppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
