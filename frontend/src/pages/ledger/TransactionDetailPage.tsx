import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ledgerService } from '../../services/ledger.service';
import { LoadingState, ErrorState } from '../../components/ui/LedgerComponents';
import { ConfirmDialog } from '../../components/ui/Modal';
import { showToast } from '../../components/ui/Toast';
import { formatCurrency, formatDateFull, getErrorMessage } from '../../utils/format';

export function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showReverse, setShowReverse] = useState(false);

  const { data: txn, isLoading, isError, refetch } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => ledgerService.getTransaction(id!),
    enabled: !!id,
  });

  const reverseMutation = useMutation({
    mutationFn: () => ledgerService.reverseTransaction(id!),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', txn?.customer] });
      queryClient.invalidateQueries({ queryKey: ['customer', txn?.customer] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast(result.message, 'success');
      navigate(-1);
    },
    onError: (err) => {
      setShowReverse(false);
      showToast(getErrorMessage(err), 'error');
    },
  });

  if (isLoading) return <LoadingState message="Loading entry details…" />;
  if (isError || !txn) return <ErrorState message="Transaction not found." onRetry={refetch} />;

  const isCredit = txn.type === 'credit';
  const isPayment = txn.type === 'payment';
  const isReversal = txn.type === 'reversal';
  const canReverse = !txn.is_reversed && !isReversal;

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full bg-parchment-200 hover:bg-parchment-300 flex items-center justify-center font-bold text-stone-800 text-sm"
          aria-label="Back"
        >
          ←
        </button>
        <h1 className="text-2xl font-black font-serif text-stone-900">Transaction Details</h1>
      </div>

      {/* Main parchment card */}
      <div className="bg-parchment-50 rounded-2xl p-6 border-2 border-parchment-300 shadow-md bg-paper-lines space-y-4">
        {/* Type badge */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-black border shadow-sm ${
            isCredit ? 'bg-rose-100 text-rose-800 border-rose-300' :
            isPayment ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
            'bg-stone-200 text-stone-700 border-stone-300'
          }`}>
            {isCredit && <span>📤 Given (Credit)</span>}
            {isPayment && <span>📥 Received (Payment)</span>}
            {isReversal && <span>↺ Reversed</span>}
          </span>

          <span className="text-xs text-stone-500 font-mono">{txn.transaction_date}</span>
        </div>

        {/* Amount */}
        <div className={`text-4xl font-black font-serif font-tabular ${
          isCredit ? 'text-rose-800' : isPayment ? 'text-emerald-800' : 'text-stone-400'
        }`}>
          {isCredit ? '+' : isPayment ? '-' : ''}₹{txn.amount}
        </div>

        {txn.is_reversed && (
          <div className="inline-block text-xs font-bold text-rose-800 bg-rose-100 px-3 py-1 rounded-lg border border-rose-300">
            This transaction has been reversed
          </div>
        )}

        <div className="pt-3 border-t border-parchment-300 space-y-2.5 text-xs">
          <Row label="Customer" value={txn.customer_name} />
          <Row label="Date" value={formatDateFull(txn.transaction_date)} />
          {txn.description && <Row label="Description" value={txn.description} />}
          <Row label="Recorded At" value={new Date(txn.created_at).toLocaleString('en-IN')} />
        </div>
      </div>

      {/* Reverse action */}
      {canReverse && (
        <div className="bg-parchment-50 rounded-2xl p-5 border-2 border-parchment-300 shadow-md space-y-3">
          <p className="text-xs font-bold text-stone-600">
            Made a mistake? Reversing this transaction will create a correction record and adjust the customer balance.
          </p>
          <button
            onClick={() => setShowReverse(true)}
            className="w-full btn-parchment-bevel py-3 text-xs font-bold rounded-xl text-rose-800 flex items-center justify-center gap-2"
            id="reverse-btn"
          >
            <span>↺ Reverse Transaction</span>
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={showReverse}
        onClose={() => setShowReverse(false)}
        onConfirm={() => reverseMutation.mutate()}
        loading={reverseMutation.isPending}
        title="Reverse transaction?"
        message={`This will create a reversal record for ${formatCurrency(txn.amount)}. The original transaction remains in history for audit purposes.`}
        confirmLabel="Yes, Reverse"
        confirmVariant="danger"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-stone-500 font-bold font-serif">{label}</span>
      <span className="font-bold text-stone-900 text-right">{value}</span>
    </div>
  );
}
