import React, { useState, useMemo } from 'react';
import { ResponsiveModal } from '../ui/ResponsiveModal';
import { formatCurrency, formatDate, formatDateFull, todayAsInputDate } from '../../utils/format';
import type { Customer, Transaction } from '../../types';

interface GenerateBillPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  transactions: Transaction[];
  onProceed: (fromDate: string, toDate: string, daysCount: number) => void;
  onProceedBlank: () => void;
}

type PeriodPreset = 'today' | '7days' | '15days' | '30days' | 'month' | 'custom';

function getNDaysAgoDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  return d.toISOString().split('T')[0];
}

function getStartOfMonthDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

export function GenerateBillPeriodModal({
  isOpen,
  onClose,
  customer,
  transactions,
  onProceed,
  onProceedBlank,
}: GenerateBillPeriodModalProps) {
  const today = todayAsInputDate();
  const [selectedPreset, setSelectedPreset] = useState<PeriodPreset>('7days');
  const [fromDate, setFromDate] = useState<string>(getNDaysAgoDate(7));
  const [toDate, setToDate] = useState<string>(today);

  // Handle Preset selection
  const handleSelectPreset = (preset: PeriodPreset) => {
    setSelectedPreset(preset);
    if (preset === 'today') {
      setFromDate(today);
      setToDate(today);
    } else if (preset === '7days') {
      setFromDate(getNDaysAgoDate(7));
      setToDate(today);
    } else if (preset === '15days') {
      setFromDate(getNDaysAgoDate(15));
      setToDate(today);
    } else if (preset === '30days') {
      setFromDate(getNDaysAgoDate(30));
      setToDate(today);
    } else if (preset === 'month') {
      setFromDate(getStartOfMonthDate());
      setToDate(today);
    }
  };

  // Calculate days count
  const daysCount = useMemo(() => {
    if (!fromDate || !toDate) return 1;
    const start = new Date(fromDate + 'T00:00:00').getTime();
    const end = new Date(toDate + 'T00:00:00').getTime();
    if (isNaN(start) || isNaN(end)) return 1;
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays);
  }, [fromDate, toDate]);

  // Filter transactions falling in selected date range
  const { matchingCredits, totalCredit, matchingPayments, totalPayment } = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return { matchingCredits: [], totalCredit: 0, matchingPayments: [], totalPayment: 0 };
    }

    const valid = transactions.filter((t) => !t.is_reversed && t.type !== 'reversal');
    const credits: Transaction[] = [];
    const payments: Transaction[] = [];
    let creditSum = 0;
    let paymentSum = 0;

    valid.forEach((t) => {
      const d = t.transaction_date;
      if (d >= fromDate && d <= toDate) {
        const amt = parseFloat(t.amount) || 0;
        if (t.type === 'credit') {
          credits.push(t);
          creditSum += amt;
        } else if (t.type === 'payment') {
          payments.push(t);
          paymentSum += amt;
        }
      }
    });

    return {
      matchingCredits: credits,
      totalCredit: creditSum,
      matchingPayments: payments,
      totalPayment: paymentSum,
    };
  }, [transactions, fromDate, toDate]);

  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose} title={`🧾 Generate Bill — ${customer.name}`}>
      <div className="space-y-4 text-stone-800">
        <p className="text-xs text-stone-600">
          Select how many days of Khata to include in this bill, or choose custom dates from the calendar.
        </p>

        {/* Period Preset Pills */}
        <div>
          <label className="block text-[11px] font-bold text-stone-600 uppercase font-serif mb-1.5">
            Quick Days Selection
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'today', label: '1 Day (Today)' },
              { id: '7days', label: 'Last 7 Days' },
              { id: '15days', label: 'Last 15 Days' },
              { id: '30days', label: 'Last 30 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'custom', label: '🗓️ Custom Calendar' },
            ].map((p) => {
              const active = selectedPreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p.id as PeriodPreset)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    active
                      ? 'bg-forest-900 text-gold-300 border-forest-950 shadow-sm'
                      : 'bg-parchment-100 hover:bg-parchment-200 text-stone-700 border-parchment-300'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Calendar Date Range Pickers */}
        <div className="bg-parchment-100/80 p-3.5 rounded-xl border border-parchment-300 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <span>📅</span>
              <span>Billing Date Range (Calendar)</span>
            </span>
            <span className="text-[11px] font-mono font-bold text-forest-900 bg-forest-100 px-2 py-0.5 rounded border border-forest-200">
              {daysCount} {daysCount === 1 ? 'Day' : 'Days'} Selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                From Date (Start)
              </label>
              <input
                type="date"
                value={fromDate}
                max={toDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setSelectedPreset('custom');
                }}
                className="w-full text-xs font-mono font-medium p-2 rounded-lg border border-parchment-400 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                To Date (End)
              </label>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setSelectedPreset('custom');
                }}
                className="w-full text-xs font-mono font-medium p-2 rounded-lg border border-parchment-400 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>
          </div>

          <p className="text-[11px] text-stone-600 font-mono">
            {formatDateFull(fromDate)} to {formatDateFull(toDate)} ({daysCount} {daysCount === 1 ? 'day' : 'days'})
          </p>
        </div>

        {/* Matching Entries Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-700">
              Khata Entries in these {daysCount} Days:
            </span>
            <span className="font-mono font-black text-rose-800">
              {matchingCredits.length} {matchingCredits.length === 1 ? 'Item' : 'Items'} • {formatCurrency(totalCredit)}
            </span>
          </div>

          {matchingCredits.length > 0 ? (
            <div className="max-h-40 overflow-y-auto space-y-1.5 border border-parchment-300 rounded-xl p-2 bg-white/70">
              {matchingCredits.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-stone-50 border border-stone-200"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-stone-500">{formatDate(txn.transaction_date)}</span>
                    <span className="font-medium text-stone-900">{txn.description || 'Credit Entry'}</span>
                  </div>
                  <span className="font-mono font-bold text-rose-800">{formatCurrency(txn.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-parchment-100 border border-parchment-300 text-center text-xs text-stone-600">
              No credit transactions recorded between these dates. You can still generate a bill for these dates and enter line items manually.
            </div>
          )}

          {totalPayment > 0 && (
            <p className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 font-medium">
              ℹ️ Customer made {matchingPayments.length} payment(s) totaling <b>{formatCurrency(totalPayment)}</b> during this period.
            </p>
          )}
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-parchment-300 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => onProceed(fromDate, toDate, daysCount)}
            className="flex-1 bg-forest-800 hover:bg-forest-900 text-white text-xs font-black py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <span>🧾</span>
            <span>
              Generate {daysCount} Days Bill {matchingCredits.length > 0 ? `(${formatCurrency(totalCredit)})` : ''}
            </span>
          </button>
          <button
            type="button"
            onClick={onProceedBlank}
            className="bg-parchment-200 hover:bg-parchment-300 text-stone-800 text-xs font-bold py-2.5 px-3 rounded-xl border border-parchment-300 cursor-pointer"
          >
            Blank Bill (Manual Items)
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
