import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Transaction } from '../../types';
import { customerService } from '../../services/customer.service';
import { ledgerService } from '../../services/ledger.service';
import { useAuth } from '../../features/auth/AuthContext';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/LedgerComponents';
import { ConfirmDialog } from '../../components/ui/Modal';
import { showToast } from '../../components/ui/Toast';
import { formatCurrency, formatDate, getErrorMessage } from '../../utils/format';
import { QuickTransactionModal } from '../../components/ui/QuickTransactionModal';
import { WhatsAppReminderModal } from '../../components/ui/WhatsAppReminderModal';
import { UpiQrModal } from '../../components/ui/UpiQrModal';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [filterType, setFilterType] = useState<'all' | 'credit' | 'payment'>('all');
  const [quickTxnModal, setQuickTxnModal] = useState<{ open: boolean; type?: 'credit' | 'payment' }>({ open: false });
  const [showArchive, setShowArchive] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);

  const {
    data: customer,
    isLoading: loadingCustomer,
    isError: customerError,
    refetch: refetchCustomer,
  } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerService.get(id!),
    enabled: !!id,
  });

  const {
    data: transactions,
    isLoading: loadingTxns,
    isError: txnsError,
  } = useQuery({
    queryKey: ['transactions', id],
    queryFn: () => ledgerService.getTransactions(id!),
    enabled: !!id,
  });

  const archiveMutation = useMutation({
    mutationFn: () => customerService.archive(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast(`${customer?.name} archived.`, 'success');
      navigate('/customers', { replace: true });
    },
    onError: (err) => showToast(getErrorMessage(err), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => customerService.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      showToast(`${customer?.name} deleted.`, 'success');
      navigate('/customers', { replace: true });
    },
    onError: (err) => showToast(getErrorMessage(err), 'error'),
  });

  if (loadingCustomer) return <LoadingState message="Opening customer ledger page…" />;
  if (customerError || !customer) return <ErrorState message="Customer not found." onRetry={refetchCustomer} />;

  const isDue = customer.balance_status === 'due';

  const filteredTxns = transactions?.filter((t: Transaction) => {
    if (filterType === 'credit') return t.type === 'credit';
    if (filterType === 'payment') return t.type === 'payment';
    return true;
  }) ?? [];

  return (
    <div className="space-y-6">
      {/* Navigation Header matching Screen 8 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/customers')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-900"
        >
          <span>←</span>
          <span>Back</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/customers/${id}/edit`)}
            className="text-xs font-bold text-stone-600 hover:underline"
          >
            Edit Customer
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="text-xs font-bold text-rose-700 hover:text-rose-900 hover:underline flex items-center gap-1"
            id="btn-delete-customer-top"
          >
            <span>🗑️</span>
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Customer Header Info & Balance Card */}
      <div className="bg-parchment-50 rounded-2xl p-6 border-2 border-parchment-300 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black font-serif text-stone-900 tracking-tight">{customer.name}</h1>
              <button
                onClick={() => navigate(`/customers/${id}/edit`)}
                className="bg-parchment-200 hover:bg-parchment-300 text-stone-800 text-xs font-bold px-3 py-1 rounded-xl border border-parchment-300 shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                title="Edit Customer Details"
                id="btn-edit-customer-header"
              >
                <span>✏️ Edit Details</span>
              </button>
            </div>
            <p className="text-xs font-mono text-stone-600 mt-0.5">📞 {customer.phone || 'No phone number'}</p>
            {customer.address && <p className="text-xs text-stone-500 mt-0.5">📍 {customer.address}</p>}
          </div>

          <div className="flex flex-col sm:items-end">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 font-serif">CURRENT BALANCE</span>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black font-serif text-rose-800 font-tabular">
                ₹{customer.balance}
              </span>
              <span className={isDue ? 'badge-due' : 'badge-settled'}>
                {isDue ? 'Due' : 'Settled'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Tools & Action Buttons Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-parchment-300">
          {/* Secondary Utilities */}
          <div className="flex flex-wrap items-center gap-2 order-2 sm:order-1">
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="flex-1 sm:flex-none bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-transform active:scale-95"
            >
              <span>💬 WhatsApp</span>
            </button>
            <button
              onClick={() => setShowUpiModal(true)}
              className="flex-1 sm:flex-none bg-parchment-200 hover:bg-parchment-300 text-stone-800 text-xs font-bold px-3.5 py-2 rounded-xl border border-parchment-300 shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95"
            >
              <span>💳 UPI QR</span>
            </button>
            <button
              onClick={() => navigate(`/customers/${id}/edit`)}
              className="bg-parchment-200 hover:bg-parchment-300 text-stone-800 text-xs font-bold px-3 py-2 rounded-xl border border-parchment-300 shadow-xs flex items-center justify-center gap-1"
              title="Edit Details"
            >
              <span>✏️</span>
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3 py-2 rounded-xl border border-rose-200 shadow-xs flex items-center justify-center gap-1 transition-colors"
              title="Delete Customer"
              id="btn-delete-customer-action"
            >
              <span>🗑️</span>
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>

          {/* Primary Transaction Actions (Touch-reachable) */}
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto order-1 sm:order-2">
            <button
              onClick={() => setQuickTxnModal({ open: true, type: 'credit' })}
              className="bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1 transition-transform active:scale-95"
              id="btn-add-given"
            >
              <span>+ Given</span>
            </button>
            <button
              onClick={() => setQuickTxnModal({ open: true, type: 'payment' })}
              className="btn-forest text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1 transition-transform active:scale-95"
              id="btn-add-payment"
            >
              <span>Payment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black font-serif text-stone-900">Transaction History</h2>

          {/* Type Filter Pills */}
          <div className="flex gap-1 bg-parchment-200 p-1 rounded-xl border border-parchment-300">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterType === 'all' ? 'bg-forest-900 text-gold-300 shadow-sm' : 'text-stone-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('credit')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterType === 'credit' ? 'bg-forest-900 text-gold-300 shadow-sm' : 'text-stone-700'
              }`}
            >
              Given
            </button>
            <button
              onClick={() => setFilterType('payment')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterType === 'payment' ? 'bg-forest-900 text-gold-300 shadow-sm' : 'text-stone-700'
              }`}
            >
              Payment
            </button>
          </div>
        </div>

        {loadingTxns && <LoadingState message="Loading transactions…" />}
        {txnsError && <ErrorState message="Couldn't load transaction history." />}

        {!loadingTxns && !txnsError && (
          filteredTxns.length === 0 ? (
            <EmptyState
              title="No entries found"
              description={`No transactions recorded for ${customer.name}.`}
            />
          ) : (
            <div className="bg-parchment-50 rounded-2xl border-2 border-parchment-300 shadow-md overflow-hidden bg-paper-lines">
              {/* Mobile Cards for Transactions (< md) */}
              <div className="block md:hidden divide-y divide-parchment-200">
                {filteredTxns.map((t: Transaction) => {
                  const isCredit = t.type === 'credit';
                  return (
                    <div
                      key={t.id}
                      onClick={() => navigate(`/ledger/transaction/${t.id}`)}
                      className="p-4 hover:bg-parchment-100 cursor-pointer transition-colors space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-stone-900 font-serif">
                            {t.description || (isCredit ? 'Credit Given' : 'Payment Received')}
                          </p>
                          <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                            📅 {t.transaction_date}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`font-black font-serif font-tabular text-base ${isCredit ? 'text-rose-800' : 'text-emerald-800'}`}>
                            {isCredit ? '+' : '-'}₹{t.amount}
                          </p>
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${isCredit ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {isCredit ? 'Given' : 'Received'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-parchment-300 text-stone-600 font-bold font-serif uppercase tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Details</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-parchment-200 font-medium">
                    {filteredTxns.map((t: Transaction) => {
                      const isCredit = t.type === 'credit';
                      return (
                        <tr
                          key={t.id}
                          onClick={() => navigate(`/ledger/transaction/${t.id}`)}
                          className="hover:bg-parchment-100 cursor-pointer transition-colors"
                        >
                          <td className="py-3.5 px-4 text-stone-600 font-mono text-[11px]">{t.transaction_date}</td>
                          <td className="py-3.5 px-4 font-bold text-stone-900 font-serif">{t.description || (isCredit ? 'Credit Entry' : 'Payment')}</td>
                          <td className={`py-3.5 px-4 font-bold ${isCredit ? 'text-rose-800' : 'text-emerald-800'}`}>
                            {isCredit ? 'Given' : 'Received'}
                          </td>
                          <td className={`py-3.5 px-4 text-right font-black font-serif font-tabular ${isCredit ? 'text-rose-800' : 'text-emerald-800'}`}>
                            {isCredit ? '+' : '-'}₹{t.amount}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black font-serif font-tabular text-rose-800">₹{customer.balance}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>

      {/* Quick Transaction Modal */}
      <QuickTransactionModal
        isOpen={quickTxnModal.open}
        onClose={() => setQuickTxnModal({ open: false })}
        defaultCustomerId={id}
        defaultType={quickTxnModal.type}
      />

      {/* WhatsApp Payment Reminder Modal */}
      <WhatsAppReminderModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        customerName={customer.name}
        customerPhone={customer.phone}
        dueAmount={customer.balance}
        shopName={user?.name || 'HisabPoint Ledger'}
      />

      {/* Dynamic UPI QR Code Modal */}
      <UpiQrModal
        isOpen={showUpiModal}
        onClose={() => setShowUpiModal(false)}
        customerName={customer.name}
        amount={customer.balance}
      />

      <ConfirmDialog
        isOpen={showArchive}
        onClose={() => setShowArchive(false)}
        onConfirm={() => archiveMutation.mutate()}
        loading={archiveMutation.isPending}
        title="Archive customer?"
        message={`Archive ${customer.name}? Financial records remain completely intact and auditable.`}
        confirmLabel="Archive"
        confirmVariant="danger"
      />

      {/* Delete Customer Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
        title="Delete customer permanently?"
        message={
          isDue
            ? `⚠️ WARNING: ${customer.name} has an outstanding due balance of ₹${customer.balance}. Deleting this customer will permanently erase this customer and all associated ledger transaction history. This action cannot be undone.`
            : `Are you sure you want to delete ${customer.name}? This will permanently remove the customer and all associated ledger transactions. This action cannot be undone.`
        }
        confirmLabel="Delete Permanently"
        confirmVariant="danger"
      />
    </div>
  );
}
