import React, { useState, useEffect } from 'react';
import { useOfflineSync } from '../../features/offline/useOfflineSync';

export function NetworkStatusIndicator() {
  const { isOnline, pendingCount, isSyncing, syncNow } = useOfflineSync();
  const [showOnlineBriefly, setShowOnlineBriefly] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline && !isSyncing && pendingCount === 0) {
      setShowOnlineBriefly(true);
      const timer = setTimeout(() => {
        setShowOnlineBriefly(false);
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, isSyncing, pendingCount]);

  // If online, not syncing, no pending items, and not temporarily showing restoration banner, hide
  if (isOnline && !isSyncing && pendingCount === 0 && !showOnlineBriefly) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 left-0 right-0 z-50 py-1.5 px-4 text-xs font-bold transition-all duration-300 flex items-center justify-between shadow-md ${
        !isOnline
          ? 'bg-amber-800 text-amber-100 border-b border-amber-600'
          : isSyncing
          ? 'bg-sky-900 text-sky-100 border-b border-sky-600'
          : pendingCount > 0
          ? 'bg-amber-900 text-amber-100 border-b border-amber-700'
          : 'bg-emerald-800 text-emerald-100 border-b border-emerald-600'
      }`}
    >
      <div className="flex items-center gap-2 mx-auto sm:mx-0">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            !isOnline
              ? 'bg-amber-400 animate-pulse'
              : isSyncing
              ? 'bg-sky-400 animate-ping'
              : pendingCount > 0
              ? 'bg-amber-400'
              : 'bg-emerald-400'
          }`}
        />
        <span>
          {!isOnline
            ? `Offline Mode — Working offline. Changes sync automatically on reconnect (${pendingCount} pending)`
            : isSyncing
            ? `Cloud Sync Active — Uploading offline transactions...`
            : pendingCount > 0
            ? `Online — ${pendingCount} offline changes queued for sync`
            : 'Back Online — All offline records synchronized!'}
        </span>
      </div>

      {/* Manual Sync Button if online and has pending items */}
      {isOnline && pendingCount > 0 && !isSyncing && (
        <button
          onClick={() => syncNow()}
          className="ml-3 px-2.5 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold text-[11px] shadow-xs cursor-pointer transition-colors"
          title="Click to sync immediately"
        >
          Sync Now
        </button>
      )}
    </div>
  );
}
