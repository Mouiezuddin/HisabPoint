import React from 'react';
import type { BalanceStatus, CustomerListItem } from '../../types';
import { formatCurrency, getBalanceLabel } from '../../utils/format';

interface StatusBadgeProps {
  status: BalanceStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const cls = {
    due: 'badge-due',
    settled: 'badge-settled',
    advance: 'badge-advance',
  }[status];

  const icon = {
    due: '↑',
    settled: '✓',
    advance: '↓',
  }[status];

  return (
    <span className={`${cls} ${className}`}>
      <span aria-hidden>{icon}</span>
      {getBalanceLabel(status)}
    </span>
  );
}

interface BalanceDisplayProps {
  balance: string;
  status: BalanceStatus;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function BalanceDisplay({ balance, status, size = 'md' }: BalanceDisplayProps) {
  const colorClass = {
    due: 'text-due-600',
    settled: 'text-paid-600',
    advance: 'text-advance-600',
  }[status];

  const sizeClass = {
    sm: 'text-xl font-bold',
    md: 'text-2xl font-bold',
    lg: 'text-3xl font-extrabold',
    xl: 'text-4xl font-extrabold',
  }[size];

  const formattedBalance = formatCurrency(balance);

  return (
    <div className="text-center">
      <div className={`${colorClass} ${sizeClass} font-tabular`} aria-label={`Balance: ${formattedBalance}`}>
        {formattedBalance}
      </div>
      <StatusBadge status={status} className="mt-1" />
    </div>
  );
}

interface CustomerCardProps {
  customer: CustomerListItem;
  onClick: () => void;
}

export function CustomerCard({ customer, onClick }: CustomerCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left card p-4 flex items-center justify-between gap-3 hover:shadow-card-hover active:scale-[0.99] transition-all duration-150"
      aria-label={`${customer.name}, ${customer.balance_status === 'settled' ? 'settled' : `balance ${formatCurrency(customer.balance)}`}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar */}
        <div className="flex-shrink-0 w-11 h-11 rounded-full bg-brand-100 flex items-center justify-center">
          <span className="text-brand-700 font-bold text-base">
            {customer.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 text-sm truncate">{customer.name}</div>
          {customer.phone && (
            <div className="text-xs text-slate-500 truncate">{customer.phone}</div>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        {customer.balance_status === 'settled' ? (
          <StatusBadge status="settled" />
        ) : (
          <>
            <div className={`font-bold text-sm font-tabular ${customer.balance_status === 'due' ? 'text-due-600' : 'text-advance-600'}`}>
              {formatCurrency(customer.balance)}
            </div>
            <StatusBadge status={customer.balance_status} />
          </>
        )}
      </div>
    </button>
  );
}
