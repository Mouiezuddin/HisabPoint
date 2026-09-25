import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../../services/customer.service';
import { ledgerService } from '../../services/ledger.service';
import { ResponsiveModal } from './ResponsiveModal';
import { AmountInput } from './AmountInput';
import { showToast } from './Toast';
import { todayAsInputDate, todayAsInputTime, getErrorMessage } from '../../utils/format';
import {
  saveCustomersLocal,
  getCustomersLocal,
  saveTransactionLocal,
  saveCustomerLocal,
  enqueueSyncItem,
} from '../../features/offline/indexedDb';
import type { CustomerListItem, Transaction, BalanceStatus } from '../../types';

interface QuickTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCustomerId?: string;
  defaultType?: 'credit' | 'payment';
}

export function QuickTransactionModal({
  isOpen,
  onClose,
  defaultCustomerId,
  defaultType = 'credit',
}: QuickTransactionModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCustomerId, setSelectedCustomerId] = useState(defaultCustomerId || '');
  const [txnType, setTxnType] = useState<'credit' | 'payment'>(defaultType);
  const [amount, setAmount] = useState('');
  const [itemName, setItemName] = useState('');
  const [date, setDate] = useState(todayAsInputDate());
  const [time, setTime] = useState(todayAsInputTime());
  const [notes, setNotes] = useState('');
  const [amountError, setAmountError] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  const { data: customers } = useQuery<CustomerListItem[]>({
    queryKey: ['customers', customerSearch],
    queryFn: async () => {
      try {
        const res = await customerService.list(customerSearch || undefined);
        saveCustomersLocal(res);
        return res;
      } catch (err) {
        const local = await getCustomersLocal();
        if (local && local.length > 0) {
          if (customerSearch) {
            const q = customerSearch.toLowerCase();
            return local.filter(
              (c) => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
            );
          }
          return local;
        }
        throw err;
      }
    },
    enabled: isOpen,
  });

  const handleOfflineRecord = async (data: {
    type: 'credit' | 'payment';
    amount: string;
    description: string;
    quantity: string;
    transaction_date: string;
    transaction_time?: string;
  }) => {
    const customer = customers?.find((c) => c.id === selectedCustomerId);
    const currentBal = customer ? parseFloat(customer.balance || '0') : 0;
    const delta = data.type === 'credit' ? parseFloat(data.amount) : -parseFloat(data.amount);
    const newBal = (currentBal + delta).toFixed(2);
    const tempId = `temp-txn-${Date.now()}`;

    let offlineCreatedAt = new Date().toISOString();
    if (data.transaction_date && data.transaction_time) {
      try {
        const parsed = new Date(`${data.transaction_date}T${data.transaction_time}:00`);
        if (!isNaN(parsed.getTime())) {
          offlineCreatedAt = parsed.toISOString();
        }
      } catch {
        // fallback to now
      }
    }

    const tempTxn: Transaction = {
      id: tempId,
      customer: selectedCustomerId,
      customer_name: customer?.name || 'Customer',
      type: data.type,
      amount: data.amount,
      description: data.description,
      quantity: data.quantity,
      transaction_date: data.transaction_date,
      reversal_of_id: null,
      is_reversed: false,
      created_at: offlineCreatedAt,
      updated_at: offlineCreatedAt,
    };

    await saveTransactionLocal(tempTxn);

    if (customer) {
      const updatedCust: CustomerListItem = {
        ...customer,
        balance: newBal,
        balance_status: parseFloat(newBal) > 0 ? ('due' as BalanceStatus) : ('settled' as BalanceStatus),
      };
      await saveCustomerLocal(updatedCust);
    }

    await enqueueSyncItem({
      type: 'CREATE_TRANSACTION',
      customerId: selectedCustomerId,
      payload: data,
    });

    queryClient.setQueryData<Transaction[]>(['transactions', selectedCustomerId], (old) => {
      return old ? [tempTxn, ...old] : [tempTxn];
    });

    queryClient.setQueryData<CustomerListItem[]>(['customers', ''], (old) => {
      if (!old) return old;
      return old.map((c) =>
        c.id === selectedCustomerId
          ? {
              ...c,
              balance: newBal,
              balance_status: parseFloat(newBal) > 0 ? ('due' as BalanceStatus) : ('settled' as BalanceStatus),
            }
          : c
      );
    });

    queryClient.invalidateQueries({ queryKey: ['customer', selectedCustomerId] });
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });

    showToast('Transaction saved offline. Will sync automatically.', 'success');
    resetForm();
    onClose();
  };

  const mutation = useMutation({
    mutationFn: async (data: {
      type: 'credit' | 'payment';
      amount: string;
      description: string;
      quantity: string;
      transaction_date: string;
      transaction_time?: string;
    }) => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('OFFLINE_RECORD');
      }
      try {
        const res = await ledgerService.createTransaction(selectedCustomerId, data);
        if (res?.transaction) {
          saveTransactionLocal(res.transaction);
        }
        return res;
      } catch (err: unknown) {
        if (!navigator.onLine) {
          throw new Error('OFFLINE_RECORD');
        }
        throw err;
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['customer', selectedCustomerId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast(result.message, 'success');
      resetForm();
      onClose();
    },
    onError: async (err: unknown, variables) => {
      if (err instanceof Error && err.message === 'OFFLINE_RECORD') {
        await handleOfflineRecord(variables);
        return;
      }
      showToast(getErrorMessage(err), 'error');
    },
  });

  function resetForm() {
    setAmount('');
    setItemName('');
    setNotes('');
    setAmountError('');
    setTime(todayAsInputTime());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomerId) {
      showToast('Please select a customer first.', 'error');
      return;
    }
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) {
      setAmountError('Enter a valid amount greater than ₹0.');
      return;
    }
    setAmountError('');
    const fullDesc = itemName.trim() || notes.trim() || (txnType === 'credit' ? 'Credit Purchase' : 'Payment Received');
    mutation.mutate({
      type: txnType,
      amount,
      description: fullDesc,
      quantity: '',
      transaction_date: date,
      transaction_time: time,
    });
  }

  const isCredit = txnType === 'credit';

  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose} title={isCredit ? 'New Credit Entry (+ Given)' : 'Record Payment (- Received)'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Select */}
        <div>
          <label className="block text-xs font-bold uppercase text-stone-600 mb-1">SELECT CUSTOMER *</label>
          {defaultCustomerId && customers ? (
            <div className="p-3 bg-parchment-200 rounded-xl font-bold font-serif text-stone-900 text-sm border border-parchment-300">
              {customers.find((c) => c.id === defaultCustomerId)?.name || 'Selected Customer'}
            </div>
          ) : (
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="input text-xs font-bold"
              required
            >
              <option value="">-- Choose Customer --</option>
              {customers?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.id.startsWith('temp-') ? '(Offline)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Transaction Type Segment Switch (Given Red / Payment Green) */}
        <div className="bg-parchment-200 p-1 rounded-xl flex gap-1 border border-parchment-300">
          <button
            type="button"
            onClick={() => setTxnType('credit')}
            className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${
              isCredit ? 'bg-rose-800 text-white shadow-sm' : 'text-stone-700'
            }`}
          >
            Credit (+ Given)
          </button>
          <button
            type="button"
            onClick={() => setTxnType('payment')}
            className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${
              !isCredit ? 'bg-emerald-800 text-white shadow-sm' : 'text-stone-700'
            }`}
          >
            Payment (- Received)
          </button>
        </div>

        {/* Amount Input */}
        <AmountInput value={amount} onChange={setAmount} error={amountError} />

        {/* Item / Note Input */}
        <div>
          <label className="block text-xs font-bold uppercase text-stone-600 mb-1">
            {isCredit ? 'ITEM NAME / REASON' : 'PAYMENT NOTE'}
          </label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder={isCredit ? 'e.g. Rice, Sugar' : 'e.g. Cash payment'}
            className="input text-xs"
          />
        </div>

        {/* Date & Time Input */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase text-stone-600 mb-1">DATE</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-stone-600 mb-1">TIME</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="input text-xs font-mono"
            />
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className={`w-full text-white font-bold py-3 rounded-xl shadow-md text-xs cursor-pointer ${
              isCredit ? 'bg-rose-800 hover:bg-rose-900' : 'bg-emerald-800 hover:bg-emerald-900'
            }`}
          >
            {mutation.isPending ? 'Saving Entry…' : 'Save Transaction'}
          </button>
        </div>

        {/* Shortcut to full bill generator */}
        <div className="pt-1 text-center border-t border-parchment-300">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (selectedCustomerId) {
                navigate(`/invoices/new?customer=${selectedCustomerId}`);
              } else {
                navigate('/invoices/new');
              }
            }}
            className="text-[11px] font-bold text-amber-900 hover:text-amber-950 flex items-center justify-center gap-1.5 w-full py-1 hover:underline cursor-pointer"
          >
            <span>🧾 Need to generate an itemized bill with GST & print?</span>
            <span className="text-forest-800 font-black">Create Bill →</span>
          </button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
