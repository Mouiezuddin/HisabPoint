import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supplierService } from '../../services/supplier.service';
import { ledgerService } from '../../services/ledger.service';
import { EmptyState, LoadingState, ErrorState } from '../../components/ui/LedgerComponents';
import { formatCurrency } from '../../utils/format';
import { useDebounce } from '../../hooks';
import { AddSupplierTransactionModal } from '../../components/ui/AddSupplierTransactionModal';
import type { SupplierListItem, SupplierSummary, DashboardData } from '../../types';

type FilterType = 'all' | 'due' | 'settled';

export function SupplierListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [activeModalSupplier, setActiveModalSupplier] = useState<{
    id: string;
    name: string;
    type: 'purchase' | 'payment';
  } | null>(null);

  const debounce = useDebounce((val: string) => setDebouncedSearch(val), 300);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    debounce(e.target.value);
  }, [debounce]);

  // Fetch Suppliers List
  const {
    data: suppliers,
    isLoading,
    isError,
    refetch,
  } = useQuery<SupplierListItem[]>({
    queryKey: ['suppliers', debouncedSearch, filter],
    queryFn: () => supplierService.list(debouncedSearch || undefined, filter),
  });

  // Fetch Supplier Summary & Dashboard for Dual-Mode Lena/Dena metrics
  const { data: summary } = useQuery<SupplierSummary>({
    queryKey: ['supplier-summary'],
    queryFn: () => supplierService.getSummary(),
  });

  const { data: dashboard } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => ledgerService.getDashboard(),
  });

  const totalLenaHai = parseFloat(dashboard?.total_due || '0');
  const totalDenaHai = parseFloat(summary?.total_payable || '0');
  const netPosition = totalLenaHai - totalDenaHai;

  const handleUpiPay = (e: React.MouseEvent, supplier: SupplierListItem) => {
    e.stopPropagation();
    const bal = Math.max(0, parseFloat(supplier.balance || '0'));
    if (!supplier.upi_id) {
      alert(`No UPI ID found for ${supplier.name}. You can add their UPI ID in supplier details.`);
      return;
    }
    const upiUri = `upi://pay?pa=${encodeURIComponent(supplier.upi_id)}&pn=${encodeURIComponent(supplier.company_name || supplier.name)}&am=${bal.toFixed(2)}&cu=INR&tn=Supplier-Payment`;
    window.location.href = upiUri;
  };

  return (
    <div className="space-y-5">
      {/* Top Dual-Mode Toggle: Grahak (Customers) vs Vyapari (Suppliers) */}
      <div className="p-1.5 bg-stone-200/80 rounded-2xl flex items-center justify-between border border-stone-300 max-w-lg mx-auto shadow-inner">
        <button
          onClick={() => navigate('/customers')}
          className="flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold text-stone-600 hover:text-stone-900 transition-all flex items-center justify-center gap-2"
        >
          <span>👤</span>
          <span>Grahak (Customers • लेना है)</span>
        </button>
        <button
          className="flex-1 py-2 rounded-xl text-xs sm:text-sm font-black bg-stone-900 text-gold-300 shadow-md flex items-center justify-center gap-2"
        >
          <span>📦</span>
          <span>Vyapari (Suppliers • देना है)</span>
        </button>
      </div>

      {/* Tri-Metric Cash Flow Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Lena Hai */}
        <div className="card p-4 bg-gradient-to-br from-emerald-50 to-white border border-emerald-200">
          <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
            Total Lena Hai (Receivable)
          </p>
          <p className="text-xl sm:text-2xl font-black text-emerald-950 font-serif mt-1">
            {formatCurrency(totalLenaHai)}
          </p>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
            From {dashboard?.total_customers ?? 0} customers
          </p>
        </div>

        {/* Total Dena Hai */}
        <div className="card p-4 bg-gradient-to-br from-red-50 to-white border border-red-200 shadow-sm">
          <p className="text-[11px] font-bold text-red-800 uppercase tracking-wider flex items-center justify-between">
            <span>Total Dena Hai (Payable)</span>
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          </p>
          <p className="text-xl sm:text-2xl font-black text-red-900 font-serif mt-1">
            {formatCurrency(totalDenaHai)}
          </p>
          <p className="text-[10px] text-red-600 font-medium mt-0.5">
            To {summary?.suppliers_due_count ?? 0} suppliers
          </p>
        </div>

        {/* Net Cash Position */}
        <div className="card p-4 bg-gradient-to-br from-amber-50 to-white border border-amber-200">
          <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
            Net Buffer (Lena — Dena)
          </p>
          <p
            className={`text-xl sm:text-2xl font-black font-serif mt-1 ${
              netPosition >= 0 ? 'text-forest-900' : 'text-red-800'
            }`}
          >
            {netPosition >= 0 ? '+' : ''}
            {formatCurrency(netPosition)}
          </p>
          <p className="text-[10px] text-amber-700 font-medium mt-0.5">
            {netPosition >= 0 ? 'Surplus cash position' : 'Net liability position'}
          </p>
        </div>
      </div>

      {/* Action Bar & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black font-serif text-stone-900 tracking-tight">
            Suppliers & Vendors
          </h1>
          <span className="text-xs bg-stone-200 text-stone-700 font-bold px-2.5 py-0.5 rounded-full">
            {suppliers?.length ?? 0}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              placeholder="Search vendor, mill, GSTIN…"
              value={search}
              onChange={handleSearch}
              className="input pl-10 py-2 text-xs"
            />
          </div>

          <button
            onClick={() => navigate('/suppliers/new')}
            className="btn-forest text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <span>+ Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-stone-900 text-gold-300 shadow-sm'
              : 'bg-parchment-200 text-stone-700 hover:bg-parchment-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('due')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            filter === 'due'
              ? 'bg-red-800 text-white shadow-sm'
              : 'bg-parchment-200 text-stone-700 hover:bg-parchment-300'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <span>Dena Hai (Due)</span>
        </button>
        <button
          onClick={() => setFilter('settled')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === 'settled'
              ? 'bg-forest-900 text-white shadow-sm'
              : 'bg-parchment-200 text-stone-700 hover:bg-parchment-300'
          }`}
        >
          Settled / Paid
        </button>
      </div>

      {/* Body: List or Empty */}
      {isLoading ? (
        <LoadingState message="Opening Vyapari Bahi Khata…" />
      ) : isError ? (
        <ErrorState message="Could not load suppliers." onRetry={() => refetch()} />
      ) : !suppliers || suppliers.length === 0 ? (
        <EmptyState
          title="No Suppliers Found"
          description={
            debouncedSearch
              ? `No suppliers matching "${debouncedSearch}".`
              : 'Add your first supplier, distributor, or wholesale vendor to track credit purchases (Dena Hai).'
          }
          action={
            <button
              onClick={() => navigate('/suppliers/new')}
              className="btn-forest text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md"
            >
              + Add First Supplier
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {suppliers.map((supplier) => {
            const bal = parseFloat(supplier.balance || '0');
            const isDue = bal > 0;
            const isAdvance = bal < 0;
            const displayName = supplier.company_name || supplier.name;

            return (
              <div
                key={supplier.id}
                onClick={() => navigate(`/suppliers/${supplier.id}`)}
                className="card p-4 hover:shadow-md transition-all cursor-pointer border border-stone-200 hover:border-gold-400 flex flex-col justify-between gap-3 bg-gradient-to-b from-white to-parchment-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Monogram Avatar */}
                    <div className="w-11 h-11 rounded-xl bg-stone-900 text-gold-300 font-bold font-serif text-sm flex items-center justify-center shrink-0 shadow-sm border border-gold-400/40">
                      {displayName.substring(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <h3 className="font-bold text-stone-900 text-sm leading-tight hover:text-forest-900">
                        {displayName}
                      </h3>
                      {supplier.company_name && supplier.name !== supplier.company_name && (
                        <p className="text-xs text-stone-500 font-medium">Contact: {supplier.name}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {supplier.phone && (
                          <a
                            href={`tel:${supplier.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] text-stone-600 hover:text-stone-900 flex items-center gap-1 font-mono font-medium"
                          >
                            <span>📞</span>
                            <span>{supplier.phone}</span>
                          </a>
                        )}
                        {supplier.gstin && (
                          <span className="text-[10px] bg-stone-100 text-stone-600 font-mono px-1.5 py-0.5 rounded border border-stone-200">
                            GST: {supplier.gstin}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Balance Display */}
                  <div className="text-right shrink-0">
                    <p
                      className={`text-base sm:text-lg font-black font-serif tracking-tight ${
                        isDue
                          ? 'text-red-700'
                          : isAdvance
                          ? 'text-forest-800'
                          : 'text-stone-500'
                      }`}
                    >
                      {formatCurrency(Math.abs(bal))}
                    </p>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
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
                </div>

                {/* Quick Action Footer */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {supplier.upi_id && isDue && (
                      <button
                        onClick={(e) => handleUpiPay(e, supplier)}
                        className="py-1 px-2.5 rounded-lg bg-forest-900 text-gold-300 text-[11px] font-bold hover:bg-forest-800 transition-all flex items-center gap-1 shadow-sm"
                        title={`Pay ${formatCurrency(bal)} to ${supplier.upi_id}`}
                      >
                        <span>⚡ Pay via UPI</span>
                      </button>
                    )}
                    {supplier.upi_id && (
                      <span className="text-[10px] text-stone-400 font-mono truncate max-w-[120px]">
                        {supplier.upi_id}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveModalSupplier({
                          id: supplier.id,
                          name: displayName,
                          type: 'purchase',
                        });
                      }}
                      className="py-1 px-2.5 rounded-lg bg-stone-100 text-stone-800 text-[11px] font-bold hover:bg-stone-200 transition-all"
                    >
                      + Mal Kharida
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveModalSupplier({
                          id: supplier.id,
                          name: displayName,
                          type: 'payment',
                        });
                      }}
                      className="py-1 px-2.5 rounded-lg bg-stone-100 text-forest-900 text-[11px] font-bold hover:bg-stone-200 transition-all"
                    >
                      — Rupaye Diye
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transaction Entry Modal */}
      {activeModalSupplier && (
        <AddSupplierTransactionModal
          isOpen={!!activeModalSupplier}
          onClose={() => setActiveModalSupplier(null)}
          supplierId={activeModalSupplier.id}
          supplierName={activeModalSupplier.name}
          defaultType={activeModalSupplier.type}
        />
      )}
    </div>
  );
}
