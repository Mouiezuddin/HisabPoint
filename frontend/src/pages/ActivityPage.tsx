import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ledgerService } from '../services/ledger.service';
import { formatCurrency, formatDateFull } from '../utils/format';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/LedgerComponents';

export function ActivityPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'payment'>('all');

  const { data: transactions, isLoading, isError, refetch } = useQuery({
    queryKey: ['all-transactions'],
    queryFn: ledgerService.getAllTransactions,
  });

  if (isLoading) return <LoadingState message="Opening activity logbook…" />;
  if (isError) return <ErrorState message="Couldn't load activity history." onRetry={refetch} />;

  const filtered = transactions?.filter((t) => {
    const matchesSearch =
      t.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  }) ?? [];

  return (
    <div className="space-y-5">
      {/* Header & Controls matching Screen 13 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-black font-serif text-stone-900 tracking-tight">Activity</h1>

        <div className="flex items-center gap-3">
          {/* Tabs: All | Given | Payment */}
          <div className="flex gap-1 bg-parchment-200 p-1 rounded-xl border border-parchment-300">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'all' ? 'bg-forest-900 text-gold-300 shadow-sm' : 'text-stone-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('credit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'credit' ? 'bg-forest-900 text-gold-300 shadow-sm' : 'text-stone-700'
              }`}
            >
              Given
            </button>
            <button
              onClick={() => setFilterType('payment')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'payment' ? 'bg-forest-900 text-gold-300 shadow-sm' : 'text-stone-700'
              }`}
            >
              Payment
            </button>
          </div>

          <span className="bg-parchment-200 border border-parchment-300 text-stone-700 font-mono text-xs px-3 py-1.5 rounded-xl font-bold">
            📅 {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="search"
          placeholder="Search activity by customer or item..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10 py-2.5 text-xs"
        />
      </div>

      {/* Content Area */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No activity recorded"
          description={search ? `No entries matching "${search}"` : 'Activity logbook is clean.'}
        />
      ) : (
        <div className="bg-parchment-50 rounded-2xl border-2 border-parchment-300 shadow-md overflow-hidden bg-paper-lines">
          {/* Mobile Card View (< md) */}
          <div className="block md:hidden divide-y divide-parchment-200">
            {filtered.map((t) => {
              const isPayment = t.type === 'payment';
              return (
                <div
                  key={t.id}
                  onClick={() => navigate(`/customers/${t.customer}`)}
                  className="p-4 hover:bg-parchment-100 cursor-pointer transition-colors space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-stone-900 font-serif truncate">
                        {t.customer_name || 'Customer'}
                      </p>
                      <p className="text-xs text-stone-600 truncate mt-0.5">
                        {t.description || (isPayment ? 'Payment Received' : 'Credit Purchase')}
                      </p>
                      <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                        📅 {t.transaction_date}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={`font-black font-serif font-tabular text-base ${isPayment ? 'text-emerald-800' : 'text-rose-800'}`}>
                        {isPayment ? '-' : '+'}₹{t.amount}
                      </p>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${isPayment ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {isPayment ? 'Payment' : 'Given'}
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
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment-200 font-medium">
                {filtered.map((t) => {
                  const isPayment = t.type === 'payment';
                  return (
                    <tr
                      key={t.id}
                      onClick={() => navigate(`/customers/${t.customer}`)}
                      className="hover:bg-parchment-100 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 text-stone-600 font-mono text-[11px]">{t.transaction_date}</td>
                      <td className="py-3.5 px-4 font-bold text-stone-900 font-serif">{t.customer_name || 'Customer'}</td>
                      <td className="py-3.5 px-4 text-stone-800">{t.description || (isPayment ? 'Payment Received' : 'Credit Purchase')}</td>
                      <td className={`py-3.5 px-4 font-bold ${isPayment ? 'text-emerald-800' : 'text-rose-800'}`}>
                        {isPayment ? 'Received' : 'Given'}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-black font-tabular text-sm ${isPayment ? 'text-emerald-800' : 'text-rose-800'}`}>
                        {isPayment ? '-' : '+'}₹{t.amount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
