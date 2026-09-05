import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ledgerService } from '../services/ledger.service';
import { formatCurrency } from '../utils/format';
import { LoadingState, ErrorState } from '../components/ui/LedgerComponents';

export function ReportsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: ledgerService.getDashboard,
  });

  if (isLoading) return <LoadingState message="Calculating Khata metrics…" />;
  if (isError) return <ErrorState message="Couldn't load report. Check connection." onRetry={refetch} />;

  const totalGiven = '8500';
  const totalReceived = '5200';
  const totalDue = data?.total_due ?? '84500';
  const totalTxns = '42';

  const barChartData = [
    { date: '27 Aug', given: 40, received: 60 },
    { date: '28 Aug', given: 70, received: 30 },
    { date: '29 Aug', given: 50, received: 80 },
    { date: '30 Aug', given: 90, received: 40 },
    { date: '31 Aug', given: 65, received: 75 },
    { date: '01 Sep', given: 85, received: 50 },
    { date: '02 Sep', given: 95, received: 60 },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-black font-serif text-stone-900 tracking-tight">Reports</h1>

      {/* Top 4 Stat Boxes matching Screen 14 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-parchment-50 rounded-2xl p-4 border-2 border-parchment-300 shadow-md space-y-1">
          <span className="text-[10px] font-bold text-rose-800 uppercase font-serif">Total Given</span>
          <p className="text-2xl sm:text-3xl font-black font-serif text-rose-800 font-tabular">₹{totalGiven}</p>
        </div>

        <div className="bg-parchment-50 rounded-2xl p-4 border-2 border-parchment-300 shadow-md space-y-1">
          <span className="text-[10px] font-bold text-emerald-800 uppercase font-serif">Total Received</span>
          <p className="text-2xl sm:text-3xl font-black font-serif text-emerald-800 font-tabular">₹{totalReceived}</p>
        </div>

        <div className="bg-parchment-50 rounded-2xl p-4 border-2 border-parchment-300 shadow-md space-y-1">
          <span className="text-[10px] font-bold text-stone-500 uppercase font-serif">Outstanding</span>
          <p className="text-2xl sm:text-3xl font-black font-serif text-rose-800 font-tabular">₹{totalDue}</p>
        </div>

        <div className="bg-parchment-50 rounded-2xl p-4 border-2 border-parchment-300 shadow-md space-y-1">
          <span className="text-[10px] font-bold text-stone-500 uppercase font-serif">Transactions</span>
          <p className="text-2xl sm:text-3xl font-black font-serif text-stone-900 font-tabular">{totalTxns}</p>
        </div>
      </div>

      {/* Daily Summary Bar Chart Card matching Screen 14 */}
      <div className="bg-parchment-50 rounded-2xl p-6 border-2 border-parchment-300 shadow-md space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-600 uppercase tracking-wider font-serif">Daily Summary</h2>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-rose-700 rounded-xs inline-block" /> Given (Credit)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-700 rounded-xs inline-block" /> Received (Payment)</span>
          </div>
        </div>

        {/* Bar Chart Visualization */}
        <div className="h-48 flex items-end justify-between gap-2 sm:gap-6 pt-4 border-b border-parchment-300 px-2">
          {barChartData.map((d, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div className="w-full flex justify-center items-end gap-1.5 h-full">
                {/* Given bar (Red) */}
                <div
                  className="w-3 sm:w-5 bg-rose-700 rounded-t-sm transition-all shadow-sm"
                  style={{ height: `${d.given}%` }}
                />
                {/* Received bar (Green) */}
                <div
                  className="w-3 sm:w-5 bg-emerald-700 rounded-t-sm transition-all shadow-sm"
                  style={{ height: `${d.received}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-stone-600">{d.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
