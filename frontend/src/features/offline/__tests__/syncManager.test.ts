import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processSyncQueue, subscribeToSyncEvents, type SyncEvent } from '../syncManager';
import * as indexedDb from '../indexedDb';
import { customerService } from '../../../services/customer.service';
import { ledgerService } from '../../../services/ledger.service';

vi.mock('../indexedDb', () => ({
  getPendingSyncItems: vi.fn(),
  removeSyncItem: vi.fn(),
  updateSyncItemStatus: vi.fn(),
  removeCustomerLocal: vi.fn(),
  saveCustomerLocal: vi.fn(),
  saveTransactionLocal: vi.fn(),
  getCustomerLocal: vi.fn(),
  remapCustomerIdInOutbox: vi.fn(),
}));

vi.mock('../../../services/customer.service', () => ({
  customerService: {
    create: vi.fn(),
  },
}));

vi.mock('../../../services/ledger.service', () => ({
  ledgerService: {
    createTransaction: vi.fn(),
  },
}));

describe('Offline Sync Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Simulate online
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });

  it('does nothing if outbox is empty', async () => {
    vi.mocked(indexedDb.getPendingSyncItems).mockResolvedValueOnce([]);

    const result = await processSyncQueue();

    expect(result).toEqual({ success: 0, failed: 0 });
    expect(customerService.create).not.toHaveBeenCalled();
    expect(ledgerService.createTransaction).not.toHaveBeenCalled();
  });

  it('processes CREATE_CUSTOMER and remaps temp ID', async () => {
    const mockItem: indexedDb.SyncQueueItem = {
      queue_id: 1,
      type: 'CREATE_CUSTOMER',
      tempCustomerId: 'temp-cust-123',
      payload: { name: 'Ramesh Store', phone: '9876543210' },
      createdAt: new Date().toISOString(),
      status: 'pending',
      attempts: 0,
    };

    const serverCustomer = {
      id: 'server-uuid-999',
      name: 'Ramesh Store',
      phone: '9876543210',
      address: '',
      notes: '',
      status: 'active' as const,
      balance: '0.00',
      balance_status: 'settled' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(indexedDb.getPendingSyncItems).mockResolvedValueOnce([mockItem]);
    vi.mocked(customerService.create).mockResolvedValueOnce(serverCustomer);

    const events: SyncEvent[] = [];
    const unsubscribe = subscribeToSyncEvents((e) => events.push(e));

    const result = await processSyncQueue();
    unsubscribe();

    expect(result).toEqual({ success: 1, failed: 0 });
    expect(customerService.create).toHaveBeenCalledWith({ name: 'Ramesh Store', phone: '9876543210' });
    expect(indexedDb.removeCustomerLocal).toHaveBeenCalledWith('temp-cust-123');
    expect(indexedDb.saveCustomerLocal).toHaveBeenCalledWith(serverCustomer);
    expect(indexedDb.remapCustomerIdInOutbox).toHaveBeenCalledWith('temp-cust-123', 'server-uuid-999');
    expect(indexedDb.removeSyncItem).toHaveBeenCalledWith(1);
    expect(events.some((e) => e.type === 'sync_complete')).toBe(true);
  });

  it('processes CREATE_TRANSACTION and saves confirmed transaction', async () => {
    const mockItem: indexedDb.SyncQueueItem = {
      queue_id: 2,
      type: 'CREATE_TRANSACTION',
      customerId: 'cust-456',
      payload: {
        type: 'credit',
        amount: '500.00',
        description: 'Rice Bag',
        quantity: '',
        transaction_date: '2026-09-22',
      },
      createdAt: new Date().toISOString(),
      status: 'pending',
      attempts: 0,
    };

    const serverResponse = {
      transaction: {
        id: 'txn-789',
        customer: 'cust-456',
        customer_name: 'Suresh Kumar',
        type: 'credit' as const,
        amount: '500.00',
        description: 'Rice Bag',
        transaction_date: '2026-09-22',
        reversal_of_id: null,
        is_reversed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      balance: '500.00',
      message: 'Transaction recorded successfully.',
    };

    vi.mocked(indexedDb.getPendingSyncItems).mockResolvedValueOnce([mockItem]);
    vi.mocked(ledgerService.createTransaction).mockResolvedValueOnce(serverResponse);
    vi.mocked(indexedDb.getCustomerLocal).mockResolvedValueOnce({
      id: 'cust-456',
      name: 'Suresh Kumar',
      phone: '',
      address: '',
      notes: '',
      status: 'active',
      balance: '0.00',
      balance_status: 'settled',
      created_at: '',
      updated_at: '',
    });

    const result = await processSyncQueue();

    expect(result).toEqual({ success: 1, failed: 0 });
    expect(ledgerService.createTransaction).toHaveBeenCalledWith('cust-456', mockItem.payload);
    expect(indexedDb.saveTransactionLocal).toHaveBeenCalledWith(serverResponse.transaction);
    expect(indexedDb.removeSyncItem).toHaveBeenCalledWith(2);
  });

  it('handles item failure gracefully without halting', async () => {
    const mockItem: indexedDb.SyncQueueItem = {
      queue_id: 3,
      type: 'CREATE_CUSTOMER',
      payload: { name: 'Fail Store' },
      createdAt: new Date().toISOString(),
      status: 'pending',
      attempts: 0,
    };

    vi.mocked(indexedDb.getPendingSyncItems).mockResolvedValueOnce([mockItem]);
    vi.mocked(customerService.create).mockRejectedValueOnce(new Error('500 Server Error'));

    const result = await processSyncQueue();

    expect(result).toEqual({ success: 0, failed: 1 });
    expect(indexedDb.updateSyncItemStatus).toHaveBeenCalledWith(3, 'failed', '500 Server Error');
    expect(indexedDb.removeSyncItem).not.toHaveBeenCalledWith(3);
  });
});
