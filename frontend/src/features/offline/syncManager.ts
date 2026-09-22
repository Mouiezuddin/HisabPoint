/**
 * HisabPoint Offline Sync Manager
 * Sequentially flushes the IndexedDB Outbox to Django REST endpoints upon reconnection.
 */

import {
  getPendingSyncItems,
  removeSyncItem,
  updateSyncItemStatus,
  removeCustomerLocal,
  saveCustomerLocal,
  saveTransactionLocal,
  getCustomerLocal,
  remapCustomerIdInOutbox,
  type SyncQueueItem,
} from './indexedDb';
import { customerService } from '../../services/customer.service';
import { ledgerService } from '../../services/ledger.service';
import type { QueryClient } from '@tanstack/react-query';
import type { CreateCustomerData, CreateTransactionData } from '../../types';

export type SyncEventType = 'sync_start' | 'item_synced' | 'item_failed' | 'sync_complete';

export interface SyncEvent {
  type: SyncEventType;
  total?: number;
  remaining?: number;
  item?: SyncQueueItem;
  error?: string;
  successCount?: number;
  failedCount?: number;
}

type SyncListener = (event: SyncEvent) => void;

let isSyncing = false;
const listeners = new Set<SyncListener>();

export function subscribeToSyncEvents(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(event: SyncEvent) {
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch (err) {
      console.error('Error in sync listener:', err);
    }
  });
}

export function isCurrentlySyncing(): boolean {
  return isSyncing;
}

export async function processSyncQueue(
  queryClient?: QueryClient
): Promise<{ success: number; failed: number }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: 0, failed: 0 };
  }

  if (isSyncing) {
    return { success: 0, failed: 0 };
  }

  const items = await getPendingSyncItems();
  if (items.length === 0) {
    return { success: 0, failed: 0 };
  }

  isSyncing = true;
  notifyListeners({ type: 'sync_start', total: items.length });

  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.queue_id) continue;

    await updateSyncItemStatus(item.queue_id, 'syncing');

    try {
      if (item.type === 'CREATE_CUSTOMER') {
        const payload = item.payload as CreateCustomerData;
        const serverCustomer = await customerService.create(payload);

        // Remap temporary ID if customer was created offline
        if (item.tempCustomerId) {
          await removeCustomerLocal(item.tempCustomerId);
          await saveCustomerLocal(serverCustomer);
          await remapCustomerIdInOutbox(item.tempCustomerId, serverCustomer.id);
        } else {
          await saveCustomerLocal(serverCustomer);
        }

        await removeSyncItem(item.queue_id);
        successCount++;
        notifyListeners({ type: 'item_synced', item, remaining: items.length - (i + 1) });
      } else if (item.type === 'CREATE_TRANSACTION') {
        const payload = item.payload as CreateTransactionData;
        if (!item.customerId) {
          throw new Error('Transaction is missing a target customer ID.');
        }

        const res = await ledgerService.createTransaction(item.customerId, payload);
        if (res?.transaction) {
          await saveTransactionLocal(res.transaction);

          // Update local customer balance if cached
          const existingCust = await getCustomerLocal(item.customerId);
          if (existingCust) {
            existingCust.balance = res.balance;
            existingCust.balance_status = parseFloat(res.balance) > 0 ? 'due' : 'settled';
            await saveCustomerLocal(existingCust);
          }
        }

        await removeSyncItem(item.queue_id);
        successCount++;
        notifyListeners({ type: 'item_synced', item, remaining: items.length - (i + 1) });
      }
    } catch (err: unknown) {
      console.error(`Failed to sync queue item #${item.queue_id}:`, err);
      const errMsg = err instanceof Error ? err.message : 'Network sync error';
      await updateSyncItemStatus(item.queue_id, 'failed', errMsg);
      failedCount++;
      notifyListeners({ type: 'item_failed', item, error: errMsg });
    }
  }

  isSyncing = false;

  // Invalidate UI queries so views reload authoritative backend data
  if (queryClient) {
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    queryClient.invalidateQueries({ queryKey: ['customer'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
  }

  notifyListeners({ type: 'sync_complete', successCount, failedCount });
  return { success: successCount, failed: failedCount };
}
