import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierService } from '../../services/supplier.service';
import { ResponsiveModal } from './ResponsiveModal';
import { AmountInput } from './AmountInput';
import { showToast } from './Toast';
import { todayAsInputDate, todayAsInputTime, getErrorMessage } from '../../utils/format';
import type { SupplierTransactionType } from '../../types';

interface AddSupplierTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: string;
  supplierName: string;
  defaultType?: 'purchase' | 'payment';
}

export function AddSupplierTransactionModal({
  isOpen,
  onClose,
  supplierId,
  supplierName,
  defaultType = 'purchase',
}: AddSupplierTransactionModalProps) {
  const queryClient = useQueryClient();
  const [txnType, setTxnType] = useState<'purchase' | 'payment'>(defaultType);
  const [amount, setAmount] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayAsInputDate());
  const [time, setTime] = useState(todayAsInputTime());
  const [amountError, setAmountError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTxnType(defaultType);
      setAmount('');
      setBillNumber('');
      setDescription('');
      setDate(todayAsInputDate());
      setTime(todayAsInputTime());
      setAmountError('');
    }
  }, [isOpen, defaultType]);

  const mutation = useMutation({
    mutationFn: (data: {
      type: 'purchase' | 'payment';
      amount: string;
      bill_number?: string;
      description?: string;
      transaction_date: string;
      transaction_time?: string;
    }) => supplierService.createTransaction(supplierId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', supplierId] });
      queryClient.invalidateQueries({ queryKey: ['supplier-transactions', supplierId] });
      queryClient.invalidateQueries({ queryKey: ['supplier-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      showToast(
        txnType === 'purchase'
          ? `₹${amount} kharida recorded for ${supplierName}`
          : `₹${amount} payment recorded for ${supplierName}`,
        'success'
      );
      onClose();
    },
    onError: (err) => {
      showToast(getErrorMessage(err, 'Failed to record entry.'), 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError('Enter a valid amount greater than ₹0');
      return;
    }
    setAmountError('');

    mutation.mutate({
      type: txnType,
      amount: parsedAmount.toString(),
      bill_number: billNumber.trim(),
      description: description.trim(),
      transaction_date: date,
      transaction_time: time,
    });
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bahi Khata Entry • ${supplierName}`}
      maxWidthClass="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Type Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl border border-stone-200">
          <button
            type="button"
            onClick={() => {
              setTxnType('purchase');
              setAmountError('');
            }}
            className={`py-2.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              txnType === 'purchase'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>+</span>
            <span>Mal Kharida (Purchase)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTxnType('payment');
              setAmountError('');
            }}
            className={`py-2.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              txnType === 'payment'
                ? 'bg-forest-900 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>—</span>
            <span>Rupaye Diye (Payment)</span>
          </button>
        </div>

        {/* Direction Explainer Hint */}
        <p className="text-[11px] text-stone-500 text-center font-medium">
          {txnType === 'purchase' ? (
            <span className="text-red-700 font-semibold">
              🔴 Bought stock on credit: Balance increases (Dena Hai)
            </span>
          ) : (
            <span className="text-forest-800 font-semibold">
              🟢 Paid money to supplier: Balance decreases (Dena Hai reduces)
            </span>
          )}
        </p>

        {/* Amount */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">
            Amount (रुपये) <span className="text-red-500">*</span>
          </label>
          <AmountInput
            value={amount}
            onChange={(val) => {
              setAmount(val);
              if (amountError) setAmountError('');
            }}
            error={amountError}
            autoFocus
          />
        </div>

        {/* Bill / Challan No. */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">
            Supplier Bill / Challan No. <span className="text-stone-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={billNumber}
            onChange={(e) => setBillNumber(e.target.value)}
            placeholder="e.g. INV-2023-891 or Challan #12"
            className="input text-xs"
          />
        </div>

        {/* Description / Items */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">
            Description / Items <span className="text-stone-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              txnType === 'purchase'
                ? 'e.g. 50 Bags Wheat Flour, 20 Tins Oil'
                : 'e.g. Paid via PhonePe UPI / Cash'
            }
            className="input text-xs"
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input text-xs py-2"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="input text-xs py-2"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 ${
              txnType === 'purchase'
                ? 'bg-red-700 hover:bg-red-800'
                : 'btn-forest'
            }`}
          >
            {mutation.isPending ? 'Saving…' : txnType === 'purchase' ? 'Record Purchase' : 'Record Payment'}
          </button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
