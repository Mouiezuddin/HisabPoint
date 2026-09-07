import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ledgerService } from '../services/ledger.service';
import { formatCurrency } from '../utils/format';
import { LoadingState, ErrorState } from '../components/ui/LedgerComponents';

export function ReportsPage() {
  const {
    data: dashboard,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: ledgerService.getDashboard,
  });

  const {
    data: transactions,
    isLoading: isTxnsLoading,
    isError: isTxnsError,
    refetch: refetchTxns,
  } = useQuery({
    queryKey: ['all-transactions'],
    queryFn: ledgerService.getAllTransactions,
  });

  // Calculate real metrics from user's actual transactions
  const { totalGiven, totalReceived, totalTxns, barChartData } = useMemo(() => {
    // If backend provides precomputed report metrics, use them
    if (dashboard?.total_given && dashboard?.total_received && dashboard?.daily_summary) {
      const maxVal = Math.max(
        ...dashboard.daily_summary.map((d) => Math.max(d.given, d.received)),
        1
      );
      return {
        totalGiven: dashboard.total_given,
        totalReceived: dashboard.total_received,
        totalTxns: dashboard.total_transactions ?? 0,
        barChartData: dashboard.daily_summary.map((d) => ({
          date: d.date,
          given: d.given,
          received: d.received,
          givenPct: maxVal > 0 && d.given > 0 ? Math.max(Math.round((d.given / maxVal) * 100), 10) : 0,
          receivedPct: maxVal > 0 && d.received > 0 ? Math.max(Math.round((d.received / maxVal) * 100), 10) : 0,
        })),
      };
    }

    // Dynamic calculation from real transactions
    const txns = transactions ?? [];
    let givenSum = 0;
    let receivedSum = 0;
    let count = 0;

    const reversedIds = new Set<string>();
    txns.forEach((t) => {
      if (t.type === 'reversal' && t.reversal_of_id) {
        reversedIds.add(t.reversal_of_id);
      }
    });

    // Build map of last 7 calendar days
    const last7Days: { [key: string]: { label: string; given: number; received: number } } = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      last7Days[iso] = { label, given: 0, received: 0 };
    }

    txns.forEach((t) => {
      if (t.type === 'reversal' || t.is_reversed || reversedIds.has(t.id)) return;
      const amt = parseFloat(t.amount) || 0;
      count++;
      if (t.type === 'credit') {
        givenSum += amt;
        if (last7Days[t.transaction_date]) {
          last7Days[t.transaction_date].given += amt;
        }
      } else if (t.type === 'payment') {
        receivedSum += amt;
        if (last7Days[t.transaction_date]) {
          last7Days[t.transaction_date].received += amt;
        }
      }
    });

    const daysList = Object.values(last7Days);
    const maxVal = Math.max(...daysList.map((d) => Math.max(d.given, d.received)), 1);

    return {
      totalGiven: givenSum.toFixed(2),
      totalReceived: receivedSum.toFixed(2),
      totalTxns: count,
      barChartData: daysList.map((d) => ({
        date: d.label,
        given: d.given,
        received: d.received,
        givenPct: maxVal > 0 && d.given > 0 ? Math.max(Math.round((d.given / maxVal) * 100), 10) : 0,
        receivedPct: maxVal > 0 && d.received > 0 ? Math.max(Math.round((d.received / maxVal) * 100), 10) : 0,
      })),
    };
  }, [dashboard, transactions]);

  const isLoading = isDashboardLoading || isTxnsLoading;
  const isError = isDashboardError || isTxnsError;

  if (isLoading) return <LoadingState message="Calculating Khata metrics…" />;
  if (isError) {
    return (
      <ErrorState
        message="Couldn't load report. Check connection."
        onRetry={() => {
          refetchDashboard();
          refetchTxns();
        }}
      />
    );
  }

  const totalDue = dashboard?.total_due ?? '0.00';
  const hasTransactions = totalTxns > 0;

  return (
    <div className="space-y-6">
      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-black font-serif text-stone-900 tracking-tight">Reports</h1>

      {/* Top 4 Stat Boxes with 100% Real Live Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-parchment-50 rounded-2xl p-4 border-2 border-parchment-300 shadow-md space-y-1">
          <span className="text-[10px] font-bold text-rose-800 uppercase font-serif">Total Given</span>
          <p className="text-2xl sm:text-3xl font-black font-serif text-rose-800 font-tabular">
            {formatCurrency(totalGiven)}
          </p>
        </div>

        <div className="bg-parchment-50 rounded-2xl p-4 border-2 border-parchment-300 shadow-md space-y-1">
          <span className="text-[10px] font-bold text-emerald-800 uppercase font-serif">Total Received</span>
          <p className="text-2xl sm:text-3xl font-black font-serif text-emerald-800 font-tabular">
            {formatCurrency(totalReceived)}
          </p>
        </div>

        <div className="bg-parchment-50 rounded-2xl p-4 border-2 border-parchment-300 shadow-md space-y-1">
          <span className="text-[10px] font-bold text-stone-500 uppercase font-serif">Outstanding</span>
          <p className="text-2xl sm:text-3xl font-black font-serif text-rose-800 font-tabular">
            {formatCurrency(totalDue)}
          </p>
        </div>

        <div className="bg-parchment-50 rounded-2xl p-4 border-2 border-parchment-300 shadow-md space-y-1">
          <span className="text-[10px] font-bold text-stone-500 uppercase font-serif">Transactions</span>
          <p className="text-2xl sm:text-3xl font-black font-serif text-stone-900 font-tabular">{totalTxns}</p>
        </div>
      </div>

      {/* Daily Summary Bar Chart Card */}
      <div className="bg-parchment-50 rounded-2xl p-6 border-2 border-parchment-300 shadow-md space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-600 uppercase tracking-wider font-serif">
            Daily Summary (Last 7 Days)
          </h2>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-rose-700 rounded-xs inline-block" /> Given (Credit)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-emerald-700 rounded-xs inline-block" /> Received (Payment)
            </span>
          </div>
        </div>

        {/* Real Dynamic Bar Chart */}
        {hasTransactions ? (
          <div className="h-48 flex items-end justify-between gap-2 sm:gap-6 pt-4 border-b border-parchment-300 px-2">
            {barChartData.map((d, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full flex justify-center items-end gap-1.5 h-full">
                  {/* Given bar (Red) */}
                  <div
                    title={`Given: ₹${d.given}`}
                    className="w-3 sm:w-5 bg-rose-700 rounded-t-sm transition-all shadow-sm"
                    style={{ height: `${d.givenPct}%` }}
                  />
                  {/* Received bar (Green) */}
                  <div
                    title={`Received: ₹${d.received}`}
                    className="w-3 sm:w-5 bg-emerald-700 rounded-t-sm transition-all shadow-sm"
                    style={{ height: `${d.receivedPct}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-stone-600">{d.date}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center text-center border-b border-parchment-300 px-2">
            <span className="text-2xl mb-1">📊</span>
            <p className="text-xs font-bold text-stone-600 font-serif">No transaction activity yet</p>
            <p className="text-[11px] text-stone-600">
              When you add customer credits or payments, your daily analytics will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
