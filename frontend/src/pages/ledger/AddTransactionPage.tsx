import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../../services/customer.service';
import { ledgerService } from '../../services/ledger.service';
import { LoadingState } from '../../components/ui/LedgerComponents';
import { showToast } from '../../components/ui/Toast';
import { todayAsInputDate, getErrorMessage } from '../../utils/format';

type TxnType = 'credit' | 'payment';

export function AddTransactionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const initialType: TxnType = location.state?.type ?? 'credit';
  const [txnType, setTxnType] = useState<TxnType>(initialType);
  const [date, setDate] = useState(todayAsInputDate());
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [amountError, setAmountError] = useState('');

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerService.get(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: (data: { type: TxnType; amount: string; description: string; quantity: string; transaction_date: string }) =>
      ledgerService.createTransaction(id!, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', id] });
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast(result.message, 'success');
      navigate(`/customers/${id}`, { replace: true });
    },
    onError: (err) => showToast(getErrorMessage(err), 'error'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) {
      setAmountError('Enter an amount greater than ₹0.');
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

  if (isLoading) return <LoadingState message="Loading form…" />;

  const isCredit = txnType === 'credit';

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-xs font-bold text-stone-700 hover:text-stone-900"
        >
          <span>← Back</span>
        </button>
        <span className="font-bold text-xs font-serif text-stone-900">{customer?.name}</span>
      </div>

      {/* Main Parchment Form Card matching Screen 10 / 11 */}
      <div className="bg-parchment-50 rounded-2xl p-6 border-2 border-parchment-300 shadow-md bg-paper-lines space-y-4">
        <h1 className="text-2xl font-black font-serif text-stone-900">
          {isCredit ? 'Record Given' : 'Record Payment'}
        </h1>
        <p className="text-xs text-stone-500 font-medium">Customer: <strong className="text-stone-900 font-serif">{customer?.name}</strong></p>

        {/* Current Due indicator badge */}
        {customer && (
          <div className="bg-parchment-200/80 p-3 rounded-xl border border-parchment-300 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600">Current Due</span>
            <span className="text-base font-black font-serif text-rose-800 font-tabular">₹{customer.balance}</span>
          </div>
        )}

        {/* Toggle Credit (Red) vs Payment (Green) */}
        <div className="flex gap-2 bg-parchment-200 p-1 rounded-xl border border-parchment-300">
          <button
            type="button"
            onClick={() => setTxnType('credit')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              isCredit ? 'bg-rose-800 text-white shadow-sm' : 'text-stone-700'
            }`}
          >
            Record Given (Credit)
          </button>
          <button
            type="button"
            onClick={() => setTxnType('payment')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              !isCredit ? 'bg-emerald-800 text-white shadow-sm' : 'text-stone-700'
            }`}
          >
            Record Payment
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {isCredit ? 'Item / Description' : 'Payment Amount'}
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder={isCredit ? 'e.g. Rice + Oil' : 'Payment description'}
              className="input text-xs"
              required={isCredit}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-stone-500">₹</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  if (/^\d*\.?\d{0,2}$/.test(e.target.value)) setAmount(e.target.value);
                }}
                placeholder="1,200"
                className="input pl-9 text-lg font-black font-serif font-tabular"
                required
              />
            </div>
            {amountError && <p className="text-[10px] text-rose-700 font-bold mt-0.5">{amountError}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Note (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Advance payment"
              className="input text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className={`w-full text-white font-bold py-3 text-xs rounded-xl shadow-md mt-2 ${
              isCredit ? 'bg-rose-800 hover:bg-rose-900' : 'bg-emerald-800 hover:bg-emerald-900'
            }`}
            id="save-transaction"
          >
            {mutation.isPending ? 'Recording…' : isCredit ? 'Save Given' : 'Record Payment'}
          </button>
        </form>
      </div>
    </div>
  );
}
