import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../../services/customer.service';
import { ledgerService } from '../../services/ledger.service';
import { ResponsiveModal } from './ResponsiveModal';
import { AmountInput } from './AmountInput';
import { showToast } from './Toast';
import { todayAsInputDate, getErrorMessage } from '../../utils/format';

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
  const queryClient = useQueryClient();
  const [selectedCustomerId, setSelectedCustomerId] = useState(defaultCustomerId || '');
  const [txnType, setTxnType] = useState<'credit' | 'payment'>(defaultType);
  const [amount, setAmount] = useState('');
  const [itemName, setItemName] = useState('');
  const [date, setDate] = useState(todayAsInputDate());
  const [notes, setNotes] = useState('');
  const [amountError, setAmountError] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  const { data: customers } = useQuery({
    queryKey: ['customers', customerSearch],
    queryFn: () => customerService.list(customerSearch || undefined),
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: (data: { type: 'credit' | 'payment'; amount: string; description: string; quantity: string; transaction_date: string }) =>
      ledgerService.createTransaction(selectedCustomerId, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['customer', selectedCustomerId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast(result.message, 'success');
      resetForm();
      onClose();
    },
    onError: (err) => showToast(getErrorMessage(err), 'error'),
  });

  function resetForm() {
    setAmount('');
    setItemName('');
    setNotes('');
    setAmountError('');
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
                  {c.name}
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

        {/* Date Input */}
        <div>
          <label className="block text-xs font-bold uppercase text-stone-600 mb-1">DATE</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input text-xs"
          />
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className={`w-full text-white font-bold py-3 rounded-xl shadow-md text-xs ${
              isCredit ? 'bg-rose-800 hover:bg-rose-900' : 'bg-emerald-800 hover:bg-emerald-900'
            }`}
          >
            {mutation.isPending ? 'Saving Entry…' : 'Save Transaction'}
          </button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
