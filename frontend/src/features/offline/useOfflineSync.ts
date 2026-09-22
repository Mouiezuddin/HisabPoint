/**
 * HisabPoint useOfflineSync hook
 * Provides real-time network status, pending outbox item count, and auto-sync on reconnect.
 */

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNetworkStatus } from '../pwa/useNetworkStatus';
import {
  processSyncQueue,
  subscribeToSyncEvents,
  isCurrentlySyncing,
  type SyncEvent,
} from './syncManager';
import { getPendingSyncCount } from './indexedDb';

export function useOfflineSync() {
  const isOnline = useNetworkStatus();
  const queryClient = useQueryClient();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(isCurrentlySyncing());

  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingSyncCount();
    setPendingCount(count);
  }, []);

  // Sync listener to update counts and states dynamically
  useEffect(() => {
    refreshPendingCount();

    const unsubscribe = subscribeToSyncEvents((event: SyncEvent) => {
      if (event.type === 'sync_start') {
        setIsSyncing(true);
      } else if (event.type === 'sync_complete') {
        setIsSyncing(false);
        refreshPendingCount();
      } else {
        refreshPendingCount();
      }
    });

    return unsubscribe;
  }, [refreshPendingCount]);

  // Trigger sync when transitioning from offline to online
  useEffect(() => {
    if (isOnline) {
      getPendingSyncCount().then((count) => {
        setPendingCount(count);
        if (count > 0 && !isCurrentlySyncing()) {
          processSyncQueue(queryClient);
        }
      });
    }
  }, [isOnline, queryClient]);

  const syncNow = useCallback(async () => {
    if (!isOnline) return { success: 0, failed: 0 };
    return processSyncQueue(queryClient);
  }, [isOnline, queryClient]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    syncNow,
    refreshPendingCount,
  };
}
