import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Transaction } from '../../types';
import { customerService } from '../../services/customer.service';
import { ledgerService } from '../../services/ledger.service';
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

  const [filterType, setFilterType] = useState<'all' | 'credit' | 'payment'>('all');
  const [quickTxnModal, setQuickTxnModal] = useState<{ open: boolean; type?: 'credit' | 'payment' }>({ open: false });
  const [showArchive, setShowArchive] = useState(false);
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
        <button
          onClick={() => navigate(`/customers/${id}/edit`)}
          className="text-xs font-bold text-stone-600 hover:underline"
        >
          Edit Customer
        </button>
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
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-parchment-300">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/customers/${id}/edit`)}
              className="bg-parchment-200 hover:bg-parchment-300 text-stone-800 text-xs font-bold px-3.5 py-2 rounded-xl border border-parchment-300 shadow-xs flex items-center gap-1.5"
            >
              <span>✏️ Edit Info</span>
            </button>
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm flex items-center gap-1.5"
            >
              <span>💬 WhatsApp Reminder</span>
            </button>
            <button
              onClick={() => setShowUpiModal(true)}
              className="bg-parchment-200 hover:bg-parchment-300 text-stone-800 text-xs font-bold px-3.5 py-2 rounded-xl border border-parchment-300 shadow-xs flex items-center gap-1.5"
            >
              <span>💳 UPI QR</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuickTxnModal({ open: true, type: 'credit' })}
              className="bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-md flex items-center gap-1"
              id="btn-add-given"
            >
              <span>+ Given</span>
            </button>
            <button
              onClick={() => setQuickTxnModal({ open: true, type: 'payment' })}
              className="btn-forest text-white text-xs font-bold px-5 py-2 rounded-xl shadow-md flex items-center gap-1"
              id="btn-add-payment"
            >
              <span>Payment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History Table matching Screen 8 */}
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
              <div className="overflow-x-auto">
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
    </div>
  );
}
