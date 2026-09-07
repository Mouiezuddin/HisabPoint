import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customerService } from '../../services/customer.service';
import { EmptyState, LoadingState, ErrorState } from '../../components/ui/LedgerComponents';
import { formatCurrency } from '../../utils/format';
import { useDebounce } from '../../hooks';
import { QuickTransactionModal } from '../../components/ui/QuickTransactionModal';

type FilterType = 'all' | 'due' | 'paid';

export function CustomerListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [quickTxnModal, setQuickTxnModal] = useState<{ open: boolean; customerId?: string; type?: 'credit' | 'payment' }>({ open: false });

  const debounce = useDebounce((val: string) => setDebouncedSearch(val), 300);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    debounce(e.target.value);
  }, [debounce]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['customers', debouncedSearch],
    queryFn: () => customerService.list(debouncedSearch || undefined),
  });

  const filteredCustomers = data?.filter((c) => {
    const isDue = c.balance_status === 'due';
    if (filter === 'due') return isDue;
    if (filter === 'paid') return !isDue;
    return true;
  }) ?? [];

  return (
    <div className="space-y-5">
      {/* Header Bar matching Screen 5 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-black font-serif text-stone-900 tracking-tight">Customers</h1>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              placeholder="Search customers..."
              value={search}
              onChange={handleSearch}
              className="input pl-10 py-2 text-xs"
              id="customer-list-search"
            />
          </div>

          <button
            onClick={() => navigate('/customers/new')}
            className="btn-forest text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 whitespace-nowrap"
            id="btn-add-customer-top"
          >
            <span>+ Add Customer</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-forest-900 text-gold-300 shadow-sm'
              : 'bg-parchment-200 text-stone-700 hover:bg-parchment-300'
          }`}
        >
          All ({data?.length || 0})
        </button>
        <button
          onClick={() => setFilter('due')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === 'due'
              ? 'bg-forest-900 text-gold-300 shadow-sm'
              : 'bg-parchment-200 text-stone-700 hover:bg-parchment-300'
          }`}
        >
          Due ({data?.filter((c) => c.balance_status === 'due').length || 0})
        </button>
        <button
          onClick={() => setFilter('paid')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === 'paid'
              ? 'bg-forest-900 text-gold-300 shadow-sm'
              : 'bg-parchment-200 text-stone-700 hover:bg-parchment-300'
          }`}
        >
          Paid ({data?.filter((c) => c.balance_status !== 'due').length || 0})
        </button>
      </div>

      {/* Content Area */}
      {isLoading && <LoadingState message="Loading customer directory…" />}
      {isError && <ErrorState message="Couldn't load customer directory." onRetry={refetch} />}

      {!isLoading && !isError && (
        filteredCustomers.length === 0 ? (
          <EmptyState
            title="No customers found"
            description={debouncedSearch ? `No match for "${debouncedSearch}"` : 'No customers under this category.'}
            action={
              <button
                onClick={() => navigate('/customers/new')}
                className="btn-forest text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md"
              >
                + Add Customer
              </button>
            }
          />
        ) : (
          <div className="bg-parchment-50 rounded-2xl border-2 border-parchment-300 shadow-md overflow-hidden bg-paper-lines">
            {/* Mobile Card View (< md) */}
            <div className="block md:hidden divide-y divide-parchment-200">
              {filteredCustomers.map((c) => {
                const isDue = c.balance_status === 'due';
                return (
                  <div
                    key={c.id}
                    className="p-4 hover:bg-parchment-100 transition-colors space-y-3"
                  >
                    {/* Top Row: Avatar, Name, Phone & Balance */}
                    <div
                      className="flex items-start justify-between gap-3 cursor-pointer"
                      onClick={() => navigate(`/customers/${c.id}`)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-forest-900 text-gold-300 font-serif font-black text-sm flex items-center justify-center border border-gold-500/40 flex-shrink-0 shadow-xs">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-stone-900 text-sm sm:text-base font-serif truncate">
                            {c.name}
                          </h3>
                          <p className="text-xs text-stone-600 font-mono">
                            {c.phone ? `📞 ${c.phone}` : 'No phone'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className={`font-black font-serif font-tabular text-base ${isDue ? 'text-rose-800' : 'text-emerald-800'}`}>
                          ₹{c.balance}
                        </p>
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${isDue ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {isDue ? 'Due' : 'Settled'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Buttons (Touch Friendly) */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setQuickTxnModal({ open: true, customerId: c.id, type: 'credit' })}
                        className="flex-1 bg-rose-800 hover:bg-rose-900 text-white font-bold text-xs py-2 rounded-xl shadow-xs transition-transform active:scale-95 flex items-center justify-center gap-1"
                        id={`btn-card-given-${c.id}`}
                      >
                        <span>+ Given</span>
                      </button>
                      <button
                        onClick={() => setQuickTxnModal({ open: true, customerId: c.id, type: 'payment' })}
                        className="flex-1 bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs py-2 rounded-xl shadow-xs transition-transform active:scale-95 flex items-center justify-center gap-1"
                        id={`btn-card-payment-${c.id}`}
                      >
                        <span>Payment</span>
                      </button>
                      <button
                        onClick={() => navigate(`/customers/${c.id}`)}
                        className="px-3 py-2 bg-parchment-200 hover:bg-parchment-300 text-stone-800 rounded-xl text-xs font-bold border border-parchment-300 flex items-center justify-center"
                        title="View Ledger"
                      >
                        <span>👁️</span>
                      </button>
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
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4 text-right">Balance</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-parchment-200 font-medium">
                  {filteredCustomers.map((c) => {
                    const isDue = c.balance_status === 'due';
                    return (
                      <tr key={c.id} className="hover:bg-parchment-100 transition-colors">
                        <td className="py-3.5 px-4 cursor-pointer" onClick={() => navigate(`/customers/${c.id}`)}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-forest-900 text-gold-300 font-serif font-black text-xs flex items-center justify-center border border-gold-500/40">
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-stone-900 text-sm font-serif">{c.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-stone-600 font-mono">{c.phone || '—'}</td>
                        <td className={`py-3.5 px-4 text-right font-black font-serif font-tabular text-sm ${isDue ? 'text-rose-800' : 'text-emerald-800'}`}>
                          ₹{c.balance}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={isDue ? 'badge-due' : 'badge-settled'}>
                            {isDue ? 'Due' : 'Settled'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setQuickTxnModal({ open: true, customerId: c.id, type: 'credit' })}
                              className="bg-rose-800 hover:bg-rose-900 text-white font-bold text-[10px] px-2 py-1 rounded shadow-xs"
                              title="Record Given"
                            >
                              + Given
                            </button>
                            <button
                              onClick={() => setQuickTxnModal({ open: true, customerId: c.id, type: 'payment' })}
                              className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-[10px] px-2 py-1 rounded shadow-xs"
                              title="Record Payment"
                            >
                              Payment
                            </button>
                            <button
                              onClick={() => navigate(`/customers/${c.id}`)}
                              className="p-1 text-stone-700 hover:text-stone-900 text-xs font-bold"
                              title="View Ledger"
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => navigate(`/customers/${c.id}/edit`)}
                              className="p-1 text-stone-700 hover:text-stone-900 text-xs font-bold"
                              title="Edit Customer"
                            >
                              ✏️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-3 bg-parchment-100 border-t border-parchment-300 flex items-center justify-between text-xs text-stone-600 font-medium">
              <span>Showing {filteredCustomers.length} Customer{filteredCustomers.length === 1 ? '' : 's'}</span>
              <button
                onClick={() => navigate('/customers/new')}
                className="text-xs font-bold text-forest-800 hover:underline"
              >
                + Add New Customer
              </button>
            </div>
          </div>
        )
      )}

      {/* Quick Transaction Modal */}
      <QuickTransactionModal
        isOpen={quickTxnModal.open}
        onClose={() => setQuickTxnModal({ open: false })}
        defaultCustomerId={quickTxnModal.customerId}
        defaultType={quickTxnModal.type}
      />
    </div>
  );
}
