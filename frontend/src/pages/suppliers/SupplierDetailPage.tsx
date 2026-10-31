import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierService } from '../../services/supplier.service';
import { LoadingState, ErrorState } from '../../components/ui/LedgerComponents';
import { formatCurrency, formatDate } from '../../utils/format';
import { showToast } from '../../components/ui/Toast';
import { AddSupplierTransactionModal } from '../../components/ui/AddSupplierTransactionModal';
import type { Supplier, SupplierTransaction } from '../../types';

export function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [modalType, setModalType] = useState<'purchase' | 'payment' | null>(null);
  const [reversingTxnId, setReversingTxnId] = useState<string | null>(null);

  // Fetch Supplier Detail
  const {
    data: supplier,
    isLoading: supplierLoading,
    isError: supplierError,
    refetch: refetchSupplier,
  } = useQuery<Supplier>({
    queryKey: ['supplier', id],
    queryFn: () => supplierService.get(id!),
    enabled: !!id,
  });

  // Fetch Transactions History
  const {
    data: transactions,
    isLoading: txLoading,
    refetch: refetchTxns,
  } = useQuery<SupplierTransaction[]>({
    queryKey: ['supplier-transactions', id],
    queryFn: () => supplierService.getTransactions(id!),
    enabled: !!id,
  });

  // Reversal Mutation
  const reverseMutation = useMutation({
    mutationFn: (txnId: string) => supplierService.reverseTransaction(txnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', id] });
      queryClient.invalidateQueries({ queryKey: ['supplier-transactions', id] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Transaction reversal recorded successfully.', 'success');
      setReversingTxnId(null);
    },
    onError: () => {
      showToast('Failed to reverse transaction.', 'error');
      setReversingTxnId(null);
    },
  });

  // Delete Supplier Mutation
  const deleteMutation = useMutation({
    mutationFn: () => supplierService.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast(`Supplier '${supplier?.company_name || supplier?.name}' deleted.`, 'success');
      navigate('/suppliers');
    },
    onError: () => {
      showToast('Could not delete supplier.', 'error');
    },
  });

  if (supplierLoading) return <LoadingState message="Opening Supplier Bahi Khata…" />;
  if (supplierError || !supplier) {
    return (
      <ErrorState
        message="Could not load supplier details."
        onRetry={() => {
          refetchSupplier();
          refetchTxns();
        }}
      />
    );
  }

  const bal = parseFloat(supplier.balance || '0');
  const isDue = bal > 0;
  const isAdvance = bal < 0;
  const displayName = supplier.company_name || supplier.name;

  // Compute running balance in chronological order
  const chronological = [...(transactions || [])].reverse();
  let currentRunning = 0;
  const runningMap = new Map<string, number>();

  chronological.forEach((t) => {
    const amt = parseFloat(t.amount);
    if (t.type === 'purchase') {
      currentRunning += amt;
    } else if (t.type === 'payment') {
      currentRunning -= amt;
    } else if (t.type === 'reversal') {
      // Reversal cancels previous direction
      // If description contains purchase, subtract; if payment, add
      if (t.description?.toLowerCase().includes('purchase')) {
        currentRunning -= amt;
      } else {
        currentRunning += amt;
      }
    }
    runningMap.set(t.id, currentRunning);
  });

  const handleUpiPay = () => {
    if (!supplier.upi_id) {
      alert(`No UPI ID configured for ${displayName}.`);
      return;
    }
    const payAmount = Math.max(0, bal).toFixed(2);
    const upiUri = `upi://pay?pa=${encodeURIComponent(supplier.upi_id)}&pn=${encodeURIComponent(displayName)}&am=${payAmount}&cu=INR&tn=Khata-Settlement`;
    window.location.href = upiUri;
  };

  const handleConfirmReverse = (txnId: string) => {
    if (window.confirm('Create an audit-safe reversal entry for this record?')) {
      setReversingTxnId(txnId);
      reverseMutation.mutate(txnId);
    }
  };

  const handleDelete = () => {
    if (
      window.confirm(
        `Are you sure you want to delete supplier '${displayName}' and all associated transactions? This cannot be undone.`
      )
    ) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="card p-5 sm:p-6 bg-gradient-to-b from-white to-parchment-50 border border-stone-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/suppliers')}
            className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-all shrink-0 mt-0.5"
            title="Back to Suppliers"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black font-serif text-stone-900 tracking-tight">
                {displayName}
              </h1>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  isDue
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : isAdvance
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                {isDue ? 'Dena Hai' : isAdvance ? 'Advance Diya' : 'Chukta (Settled)'}
              </span>
            </div>

            {supplier.company_name && supplier.name !== supplier.company_name && (
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                Contact: {supplier.name}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-stone-600">
              {supplier.phone && (
                <a
                  href={`tel:${supplier.phone}`}
                  className="flex items-center gap-1 font-mono font-bold hover:text-stone-900"
                >
                  <span>📞</span>
                  <span>{supplier.phone}</span>
                </a>
              )}
              {supplier.gstin && (
                <span className="font-mono bg-stone-100 px-2 py-0.5 rounded border border-stone-200 text-[11px]">
                  GST: {supplier.gstin}
                </span>
              )}
              {supplier.upi_id && (
                <span className="font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 text-[11px] flex items-center gap-1">
                  <span>⚡ UPI:</span>
                  <span>{supplier.upi_id}</span>
                </span>
              )}
            </div>

            {supplier.address && (
              <p className="text-[11px] text-stone-500 mt-1.5 flex items-center gap-1">
                <span>📍</span>
                <span>{supplier.address}</span>
              </p>
            )}
          </div>
        </div>

        {/* Balance Card */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm shrink-0 flex flex-col items-start md:items-end justify-center min-w-[200px]">
          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            {isDue ? 'Total Dena Hai (You Owe)' : isAdvance ? 'Advance Paid' : 'Account Balance'}
          </p>
          <p
            className={`text-2xl sm:text-3xl font-black font-serif tracking-tight mt-0.5 ${
              isDue ? 'text-red-700' : isAdvance ? 'text-forest-900' : 'text-stone-500'
            }`}
          >
            {formatCurrency(Math.abs(bal))}
          </p>
          {supplier.upi_id && isDue && (
            <button
              onClick={handleUpiPay}
              className="mt-2 py-1.5 px-3 rounded-lg bg-forest-900 text-gold-300 text-xs font-bold hover:bg-forest-800 transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>⚡ 1-Click UPI Pay</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Dual CTAs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => setModalType('purchase')}
          className="py-3.5 px-4 rounded-xl bg-red-700 hover:bg-red-800 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-red-900"
        >
          <span className="text-lg">+</span>
          <span>Mal Kharida (Record Purchase / Dr)</span>
        </button>

        <button
          onClick={() => setModalType('payment')}
          className="btn-forest text-white py-3.5 px-4 rounded-xl font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="text-lg">—</span>
          <span>Rupaye Diye (Record Payment / Cr)</span>
        </button>
      </div>

      {/* Bahi Khata Statement Table */}
      <div className="card overflow-hidden bg-white border border-stone-300 shadow-sm">
        <div className="p-4 bg-parchment-100 border-b border-stone-200 flex items-center justify-between">
          <h2 className="text-sm font-black font-serif text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <span>📜</span>
            <span>Bahi Khata Statement Passbook</span>
          </h2>
          <span className="text-xs text-stone-500 font-medium">
            {transactions?.length ?? 0} entries
          </span>
        </div>

        {txLoading ? (
          <div className="p-8 text-center text-xs text-stone-500">Loading ledger statement…</div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-bold text-stone-700">No transactions recorded yet</p>
            <p className="text-xs text-stone-500">
              Record your first credit purchase (+ Mal Kharida) or payment (- Rupaye Diye).
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date & Bill No.</th>
                  <th className="py-3 px-4">Description / Items</th>
                  <th className="py-3 px-4 text-right text-red-800">Purchased / Mal Aaya (Dr)</th>
                  <th className="py-3 px-4 text-right text-forest-800">Paid / Diya (Cr)</th>
                  <th className="py-3 px-4 text-right">Running Balance</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {transactions.map((txn) => {
                  const amt = parseFloat(txn.amount);
                  const isPurchase = txn.type === 'purchase';
                  const isPayment = txn.type === 'payment';
                  const isRev = txn.type === 'reversal';
                  const running = runningMap.get(txn.id) ?? 0;

                  return (
                    <tr
                      key={txn.id}
                      className={`hover:bg-stone-50/70 transition-colors ${
                        isRev ? 'bg-stone-50/50 opacity-60 line-through' : ''
                      }`}
                    >
                      {/* Date & Bill */}
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-stone-900">{formatDate(txn.transaction_date)}</div>
                        {txn.bill_number && (
                          <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono border border-stone-200 inline-block mt-0.5">
                            Bill #{txn.bill_number}
                          </span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 text-stone-700 max-w-xs truncate">
                        {txn.description || '—'}
                      </td>

                      {/* Purchased (Dr) */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-red-700">
                        {isPurchase ? `₹${amt.toFixed(2)}` : '—'}
                      </td>

                      {/* Paid (Cr) */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-forest-900">
                        {isPayment ? `₹${amt.toFixed(2)}` : '—'}
                      </td>

                      {/* Running Balance */}
                      <td className="py-3 px-4 text-right font-mono font-black text-stone-900">
                        ₹{running.toFixed(2)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        {!isRev && !txn.is_reversed ? (
                          <button
                            onClick={() => handleConfirmReverse(txn.id)}
                            disabled={reversingTxnId === txn.id}
                            className="text-[11px] text-stone-400 hover:text-red-700 font-bold transition-colors"
                            title="Create audit reversal entry"
                          >
                            {reversingTxnId === txn.id ? '…' : 'Reverse'}
                          </button>
                        ) : (
                          <span className="text-[10px] text-stone-400 font-medium">Reversed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Danger Zone */}
      <div className="pt-4 flex justify-between items-center text-xs text-stone-500">
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="text-red-600 hover:text-red-800 font-bold flex items-center gap-1 transition-colors"
        >
          <span>🗑️</span>
          <span>Delete Supplier Profile</span>
        </button>
        <span>Immutable double-entry ledger security active</span>
      </div>

      {/* Entry Modal */}
      {modalType && (
        <AddSupplierTransactionModal
          isOpen={!!modalType}
          onClose={() => setModalType(null)}
          supplierId={supplier.id}
          supplierName={displayName}
          defaultType={modalType}
        />
      )}
    </div>
  );
}
