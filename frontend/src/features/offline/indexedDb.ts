/**
 * HisabPoint Native IndexedDB Engine
 * Zero-dependency local persistence for offline customers, transactions, and sync outbox.
 */

import type { Customer, CustomerListItem, Transaction, CreateCustomerData, CreateTransactionData } from '../../types';

const DB_NAME = 'hisabpoint-local-db';
const DB_VERSION = 1;

export interface SyncQueueItem {
  queue_id?: number;
  type: 'CREATE_CUSTOMER' | 'CREATE_TRANSACTION';
  customerId?: string; // Target customer for transactions
  tempCustomerId?: string; // Temp ID generated for offline-created customer
  payload: CreateCustomerData | CreateTransactionData;
  createdAt: string;
  status: 'pending' | 'syncing' | 'failed';
  attempts: number;
  lastError?: string;
}

let dbInstance: IDBDatabase | null = null;

export function openLocalDatabase(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Customers Store
      if (!db.objectStoreNames.contains('customers')) {
        const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
        customerStore.createIndex('name', 'name', { unique: false });
        customerStore.createIndex('phone', 'phone', { unique: false });
      }

      // 2. Transactions Store
      if (!db.objectStoreNames.contains('transactions')) {
        const txnStore = db.createObjectStore('transactions', { keyPath: 'id' });
        txnStore.createIndex('customer', 'customer', { unique: false });
        txnStore.createIndex('transaction_date', 'transaction_date', { unique: false });
      }

      // 3. Sync Outbox Queue
      if (!db.objectStoreNames.contains('sync_outbox')) {
        const outboxStore = db.createObjectStore('sync_outbox', { keyPath: 'queue_id', autoIncrement: true });
        outboxStore.createIndex('status', 'status', { unique: false });
        outboxStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// ----------------------------------------------------
// Customer Operations
// ----------------------------------------------------

export async function saveCustomersLocal(customers: (Customer | CustomerListItem)[]): Promise<void> {
  try {
    const db = await openLocalDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('customers', 'readwrite');
      const store = tx.objectStore('customers');
      customers.forEach((c) => store.put(c));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Gracefully handle environments without IndexedDB (e.g. SSR, test runners)
  }
}

export async function saveCustomerLocal(customer: Customer | CustomerListItem): Promise<void> {
  try {
    const db = await openLocalDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('customers', 'readwrite');
      const store = tx.objectStore('customers');
      store.put(customer);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Gracefully handle environments without IndexedDB
  }
}

export async function getCustomersLocal(): Promise<CustomerListItem[]> {
  const db = await openLocalDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('customers', 'readonly');
    const store = tx.objectStore('customers');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as CustomerListItem[]);
    request.onerror = () => reject(request.error);
  });
}

export async function getCustomerLocal(id: string): Promise<Customer | undefined> {
  const db = await openLocalDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('customers', 'readonly');
    const store = tx.objectStore('customers');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result as Customer | undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function removeCustomerLocal(id: string): Promise<void> {
  const db = await openLocalDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('customers', 'readwrite');
    const store = tx.objectStore('customers');
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ----------------------------------------------------
// Transaction Operations
// ----------------------------------------------------

export async function saveTransactionsLocal(transactions: Transaction[]): Promise<void> {
  const db = await openLocalDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    transactions.forEach((t) => store.put(t));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveTransactionLocal(transaction: Transaction): Promise<void> {
  const db = await openLocalDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    store.put(transaction);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeTransactionLocal(id: string): Promise<void> {
  const db = await openLocalDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getTransactionsLocal(customerId: string): Promise<Transaction[]> {
  const db = await openLocalDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readonly');
    const store = tx.objectStore('transactions');
    const index = store.index('customer');
    const request = index.getAll(customerId);
    request.onsuccess = () => {
      // Sort newest to oldest
      const results = (request.result as Transaction[]).sort(
        (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      );
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

// ----------------------------------------------------
// Sync Outbox Queue Operations
// ----------------------------------------------------

export async function enqueueSyncItem(
  item: Omit<SyncQueueItem, 'queue_id' | 'createdAt' | 'status' | 'attempts'>
): Promise<number> {
  const db = await openLocalDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_outbox', 'readwrite');
    const store = tx.objectStore('sync_outbox');
    const record: SyncQueueItem = {
      ...item,
      createdAt: new Date().toISOString(),
      status: 'pending',
      attempts: 0,
    };
    const request = store.add(record);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  const db = await openLocalDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_outbox', 'readonly');
    const store = tx.objectStore('sync_outbox');
    const request = store.getAll();
    request.onsuccess = () => {
      const items = (request.result as SyncQueueItem[])
        .filter((item) => item.status === 'pending' || item.status === 'failed')
        .sort((a, b) => (a.queue_id || 0) - (b.queue_id || 0));
      resolve(items);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingSyncCount(): Promise<number> {
  try {
    const items = await getPendingSyncItems();
    return items.length;
  } catch {
    return 0;
  }
}

export async function removeSyncItem(queueId: number): Promise<void> {
  const db = await openLocalDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_outbox', 'readwrite');
    const store = tx.objectStore('sync_outbox');
    store.delete(queueId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateSyncItemStatus(
  queueId: number,
  status: 'pending' | 'syncing' | 'failed',
  error?: string
): Promise<void> {
  const db = await openLocalDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_outbox', 'readwrite');
    const store = tx.objectStore('sync_outbox');
    const getReq = store.get(queueId);

    getReq.onsuccess = () => {
      const record = getReq.result as SyncQueueItem | undefined;
      if (!record) {
        resolve();
        return;
      }
      record.status = status;
      record.attempts = (record.attempts || 0) + (status === 'syncing' ? 1 : 0);
      if (error) record.lastError = error;
      store.put(record);
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function remapCustomerIdInOutbox(oldTempId: string, newRealId: string): Promise<void> {
  const db = await openLocalDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_outbox', 'readwrite');
    const store = tx.objectStore('sync_outbox');
    const request = store.getAll();

    request.onsuccess = () => {
      const items = request.result as SyncQueueItem[];
      items.forEach((item) => {
        let changed = false;
        if (item.customerId === oldTempId) {
          item.customerId = newRealId;
          changed = true;
        }
        if (item.tempCustomerId === oldTempId) {
          item.tempCustomerId = newRealId;
          changed = true;
        }
        if (changed) {
          store.put(item);
        }
      });
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
