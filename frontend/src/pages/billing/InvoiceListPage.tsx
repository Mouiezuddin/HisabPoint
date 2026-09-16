import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { invoiceService } from '../../services/invoice.service';
import { formatCurrency, formatDate, todayAsInputDate } from '../../utils/format';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/LedgerComponents';
import type { InvoiceListItem, InvoiceStatus } from '../../types/invoice';

const STATUS_TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unpaid', label: 'Unpaid' },
  { key: 'partially_paid', label: 'Partial' },
  { key: 'paid', label: 'Paid' },
  { key: 'cancelled', label: 'Cancelled' },
];

function statusBadge(status: InvoiceStatus) {
  const map: Record<InvoiceStatus, { bg: string; text: string; label: string }> = {
    paid: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'PAID' },
    unpaid: { bg: 'bg-rose-100', text: 'text-rose-800', label: 'UNPAID' },
    partially_paid: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'PARTIAL' },
    cancelled: { bg: 'bg-stone-200', text: 'text-stone-600', label: 'CANCELLED' },
  };
  const s = map[status] || map.unpaid;
  return (
    <span className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-md ${s.bg} ${s.text} tracking-wider`}>
      {s.label}
    </span>
  );
}

export function InvoiceListPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const {
    data: invoices,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['invoices', activeTab],
    queryFn: () =>
      invoiceService.getInvoices(
        activeTab !== 'all' ? { status: activeTab } : undefined
      ),
  });

  const filtered = useMemo(() => {
    if (!invoices) return [];
    if (!search.trim()) return invoices;
    const q = search.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.customer_name.toLowerCase().includes(q) ||
        inv.invoice_number.toLowerCase().includes(q)
    );
  }, [invoices, search]);

  // Summary stats
  const stats = useMemo(() => {
    if (!invoices) return { billed: 0, collected: 0, due: 0 };
    let billed = 0, collected = 0, due = 0;
    for (const inv of invoices) {
      if (inv.payment_status === 'cancelled') continue;
      billed += parseFloat(inv.total_amount) || 0;
      collected += parseFloat(inv.paid_amount) || 0;
      due += parseFloat(inv.balance_due) || 0;
    }
    return { billed, collected, due };
  }, [invoices]);

  if (isLoading) return <LoadingState message="Loading bills…" />;
  if (isError) return <ErrorState message="Couldn't load invoices." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-black font-serif text-stone-900 tracking-tight">
          Bills & Invoices
        </h1>
        <button
          onClick={() => navigate('/invoices/new')}
          className="btn-forest text-white font-black py-2.5 px-5 rounded-2xl shadow-skeuo-forest transition-all flex items-center gap-2 text-sm"
          id="btn-create-invoice"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M12 5v14M5 12h14" />
          </svg>
          + New Bill
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-parchment-50 rounded-2xl p-4 border-2 border-parchment-300 shadow-md space-y-1">
          <span className="text-[10px] font-bold text-stone-500 uppercase font-serif">Total Billed</span>
          <p className="text-xl sm:text-2xl font-black font-serif text-stone-900 font-tabular">
            {formatCurrency(stats.billed)}
          </p>
        </div>
        <div className="bg-parchment-50 rounded-2xl p-4 border-2 border-parchment-300 shadow-md space-y-1">
          <span className="text-[10px] font-bold text-emerald-800 uppercase font-serif">Collected</span>
          <p className="text-xl sm:text-2xl font-black font-serif text-emerald-800 font-tabular">
            {formatCurrency(stats.collected)}
          </p>
        </div>
        <div className="bg-parchment-50 rounded-2xl p-4 border-2 border-parchment-300 shadow-md space-y-1">
          <span className="text-[10px] font-bold text-rose-800 uppercase font-serif">Bill Due</span>
          <p className="text-xl sm:text-2xl font-black font-serif text-rose-800 font-tabular">
            {formatCurrency(stats.due)}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search bills by number or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-parchment-300 bg-parchment-50 text-sm font-medium text-stone-900 placeholder-stone-400 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200 transition-all"
            id="input-invoice-search"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1 bg-parchment-200 p-1 rounded-xl border border-parchment-300 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-forest-900 text-gold-300 shadow-sm'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No bills found"
          description={
            activeTab === 'all' && !search
              ? "You haven't created any bills yet. Tap '+ New Bill' to get started."
              : 'No bills match your current filters.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((inv: InvoiceListItem) => (
            <div
              key={inv.id}
              onClick={() => navigate(`/invoices/${inv.id}`)}
              className="bg-parchment-50 rounded-2xl p-4 sm:p-5 border-2 border-parchment-300 shadow-md hover:shadow-lg hover:border-gold-400/60 cursor-pointer transition-all space-y-3 active:scale-[0.99]"
            >
              {/* Top Row: Invoice number + Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-forest-900 bg-forest-100 px-2 py-0.5 rounded">
                      {inv.invoice_number}
                    </span>
                    {statusBadge(inv.payment_status)}
                  </div>
                  <p className="text-base font-black font-serif text-stone-900 mt-1.5 truncate">
                    {inv.customer_name}
                  </p>
                  {inv.customer_phone && (
                    <p className="text-[11px] text-stone-500 font-mono">📞 {inv.customer_phone}</p>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-black font-serif text-stone-900 font-tabular">
                    {formatCurrency(inv.total_amount)}
                  </p>
                  <p className="text-[11px] font-mono text-stone-500 mt-0.5">
                    📅 {inv.invoice_date}
                  </p>
                </div>
              </div>

              {/* Bottom Row: Payment info */}
              {inv.payment_status !== 'cancelled' && (
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-parchment-200">
                  <span className="font-bold text-emerald-700">
                    Paid: {formatCurrency(inv.paid_amount)}
                  </span>
                  {parseFloat(inv.balance_due) > 0 && (
                    <span className="font-black text-rose-800">
                      Due: {formatCurrency(inv.balance_due)}
                    </span>
                  )}
                  <span className="text-stone-500 uppercase font-bold">
                    {inv.payment_mode === 'credit' ? 'Udhar' : inv.payment_mode}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
