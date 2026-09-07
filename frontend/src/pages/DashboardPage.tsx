import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../features/auth/AuthContext';
import { authService } from '../services/auth.service';
import { ledgerService } from '../services/ledger.service';
import { formatCurrency, getGreeting } from '../utils/format';
import { LoadingState, ErrorState } from '../components/ui/LedgerComponents';
import { QuickTransactionModal } from '../components/ui/QuickTransactionModal';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [quickTxnModal, setQuickTxnModal] = useState<{ open: boolean; customerId?: string; type?: 'credit' | 'payment' }>({ open: false });

  const { data: dashboard, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: ledgerService.getDashboard,
    refetchInterval: 60_000,
  });

  const { data: recentTxns } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: ledgerService.getAllTransactions,
  });

  const { data: business } = useQuery({
    queryKey: ['business-profile'],
    queryFn: authService.getBusinessProfile,
  });

  const greeting = getGreeting();
  const ownerName = user?.name ? `${user.name.split(' ')[0]}` : 'Shopkeeper';

  if (isLoading) return <LoadingState message="Opening Bahi Khata…" />;
  if (isError) return <ErrorState message="Couldn't load Hisab dashboard. Check connection." onRetry={refetch} />;

  const filteredCustomers = dashboard?.customers_with_due.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  ) ?? [];

  return (
    <div className="space-y-6">
      {/* ── TOP STAT CARDS ROW ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* TOTAL DUE Card */}
        <div className="bg-parchment-50 rounded-2xl p-5 border-2 border-parchment-300 shadow-md space-y-1 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-widest font-serif">TOTAL DUE</span>
            <span className="text-xs">📖</span>
          </div>
          <p className="text-3xl font-black font-serif text-rose-800 font-tabular">
            {formatCurrency(dashboard?.total_due ?? '0.00')}
          </p>
          <p className="text-xs text-stone-600 font-medium">
            Across {dashboard?.customers_with_due?.length ?? 0} customers
          </p>
        </div>

        {/* GIVEN TODAY Card (Red) */}
        <div className="bg-parchment-50 rounded-2xl p-5 border-2 border-parchment-300 shadow-md space-y-1 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-widest font-serif">GIVEN TODAY</span>
            <span className="text-xs">📤</span>
          </div>
          <p className="text-3xl font-black font-serif text-rose-800 font-tabular">
            {formatCurrency(dashboard?.today_given ?? '0.00')}
          </p>
          <p className="text-xs text-rose-700 font-medium">Credit given today</p>
        </div>

        {/* RECEIVED TODAY Card (Green) */}
        <div className="bg-parchment-50 rounded-2xl p-5 border-2 border-parchment-300 shadow-md space-y-1 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest font-serif">RECEIVED TODAY</span>
            <span className="text-xs">📥</span>
          </div>
          <p className="text-3xl font-black font-serif text-emerald-800 font-tabular">
            {formatCurrency(dashboard?.today_received ?? '0.00')}
          </p>
          <p className="text-xs text-emerald-700 font-medium">Payment received today</p>
        </div>
      </div>

      {/* ── SEARCH INPUT FIELD ────────────────────────────────────────────── */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="search"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-11 text-xs"
          id="dashboard-search"
        />
      </div>

      {/* ── MAIN CONTENT GRID: CUSTOMERS WITH DUE & RECENT ACTIVITY ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7/12): Customers with Due List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black font-serif text-stone-900">Customers with Due</h2>
            <button onClick={() => navigate('/customers')} className="text-xs font-bold text-forest-800 hover:underline">
              View All
            </button>
          </div>

          <div className="bg-parchment-50 rounded-2xl border-2 border-parchment-300 shadow-md divide-y divide-parchment-200 overflow-hidden">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.slice(0, 8).map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 hover:bg-parchment-100 transition-colors flex items-center justify-between cursor-pointer"
                  onClick={() => navigate(`/customers/${c.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-forest-900 text-gold-300 font-serif font-black text-xs flex items-center justify-center border border-gold-500/50 shadow-sm">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-stone-900 text-sm font-serif">{c.name}</p>
                      <p className="text-[11px] text-stone-500 font-mono">{c.phone || 'No phone'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="font-black text-rose-800 font-tabular text-sm">₹{c.balance}</p>
                      <span className="badge-due">Due</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickTxnModal({ open: true, customerId: c.id, type: 'credit' });
                      }}
                      className="bg-rose-800 hover:bg-rose-900 px-3 py-1.5 text-[11px] font-bold rounded-lg text-white shadow-sm"
                    >
                      + Given
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-stone-600 font-bold">
                {search ? `No customer matching "${search}"` : 'No customers with pending dues'}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5/12): Recent Activity Feed */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black font-serif text-stone-900">Recent Activity</h2>
            <button onClick={() => navigate('/activity')} className="text-xs font-bold text-forest-800 hover:underline">
              View All
            </button>
          </div>

          <div className="bg-parchment-50 rounded-2xl border-2 border-parchment-300 p-3 shadow-md space-y-2">
            {recentTxns && recentTxns.length > 0 ? (
              recentTxns.slice(0, 6).map((txn) => {
                const isPayment = txn.type === 'payment';
                return (
                  <div
                    key={txn.id}
                    onClick={() => navigate(`/customers/${txn.customer}`)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isPayment
                        ? 'bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-rose-50/80 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-bold text-xs text-stone-900 font-serif truncate">{txn.customer_name || 'Customer'}</p>
                      <p className="text-[10px] text-stone-500 truncate">
                        {txn.description || (isPayment ? 'Payment Received' : 'Credit Given')}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={`font-black text-xs font-tabular ${isPayment ? 'text-emerald-800' : 'text-rose-800'}`}>
                        {isPayment ? '-' : '+'}{formatCurrency(txn.amount)}
                      </p>
                      <span className="text-[9px] text-stone-500 font-semibold">{txn.transaction_date}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-stone-500 font-medium">
                No recent activity recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

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
