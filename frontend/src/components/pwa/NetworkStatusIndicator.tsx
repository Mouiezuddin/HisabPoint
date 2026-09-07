import React, { useState, useEffect } from 'react';
import { useNetworkStatus } from '../../features/pwa/useNetworkStatus';

export function NetworkStatusIndicator() {
  const isOnline = useNetworkStatus();
  const [showOnlineBriefly, setShowOnlineBriefly] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowOnlineBriefly(true);
      const timer = setTimeout(() => {
        setShowOnlineBriefly(false);
        setWasOffline(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // If online and not coming back from an offline event, remain invisible
  if (isOnline && !showOnlineBriefly) {
    return null;
  }

  return (
    <div
      role="status"
      className={`fixed top-0 left-0 right-0 z-50 py-1.5 px-4 text-center text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
        isOnline
          ? 'bg-emerald-800 text-emerald-100 border-b border-emerald-600'
          : 'bg-rose-900 text-rose-100 border-b border-rose-700 shadow-md'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'
        }`}
      />
      <span>
        {isOnline
          ? 'Back Online — Cloud Sync Restored'
          : 'Offline Mode — You are disconnected. Adding transactions requires internet connectivity.'}
      </span>
    </div>
  );
}
