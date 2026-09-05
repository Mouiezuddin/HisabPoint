import React from 'react';
import type { Transaction } from '../../types';
import { formatDate, formatCurrency } from '../../utils/format';

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: () => void;
}

export function TransactionItem({ transaction, onClick }: TransactionItemProps) {
  const isCredit = transaction.type === 'credit';
  const isPayment = transaction.type === 'payment';
  const isReversal = transaction.type === 'reversal';
  const isReversed = transaction.is_reversed;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-start gap-3 p-4 hover:bg-parchment-100 transition-colors rounded-xl ${isReversed || isReversal ? 'opacity-60' : ''}`}
      aria-label={`${transaction.type} ${formatCurrency(transaction.amount)} on ${formatDate(transaction.transaction_date)}`}
    >
      <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5 ${
        isCredit ? 'bg-amber-100 text-amber-900 border border-amber-300' : isPayment ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-stone-200 text-stone-700'
      }`}>
        {isCredit && <span className="text-xs">📤</span>}
        {isPayment && <span className="text-xs">📥</span>}
        {isReversal && <span className="text-xs">↺</span>}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-bold text-sm text-stone-900 font-serif truncate">
              {transaction.description || (isCredit ? 'Credit' : isPayment ? 'Payment' : 'Reversal')}
            </div>
            <div className="text-xs text-stone-500 font-mono mt-0.5">
              {formatDate(transaction.transaction_date)}
              {isReversed && <span className="ml-2 text-rose-600 font-bold">• Reversed</span>}
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className={`font-black text-sm font-tabular ${
              isCredit ? 'text-stone-900' : isPayment ? 'text-emerald-800' : 'text-stone-400'
            }`}>
              {isCredit ? '+' : isPayment ? '-' : '~'}{formatCurrency(transaction.amount)}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="bg-parchment-50 rounded-2xl p-8 text-center border-2 border-parchment-300 shadow-md space-y-4 max-w-md mx-auto my-6 bg-paper-lines">
      {/* Book Stack Illustration matching Screen 21 */}
      {icon ? (
        <div className="mb-2 text-stone-400">{icon}</div>
      ) : (
        <div className="w-20 h-20 bg-parchment-200 rounded-2xl border-2 border-dashed border-stone-400 p-2 flex flex-col items-center justify-center text-center shadow-inner mx-auto">
          <span className="text-4xl">📚</span>
        </div>
      )}

      <div>
        <h3 className="text-xl font-black font-serif text-stone-900">{title}</h3>
        {description && <p className="text-xs text-stone-600 font-medium leading-relaxed mt-1">{description}</p>}
      </div>

      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export function LoadingState({ message = 'Opening Bahi Khata…' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3" aria-live="polite">
      <div className="w-10 h-10 border-4 border-parchment-300 border-t-forest-900 rounded-full animate-spin shadow-md" />
      <span className="text-xs font-bold font-serif text-stone-700">{message}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-parchment-50 rounded-2xl p-8 text-center border-2 border-parchment-300 shadow-md space-y-4 max-w-md mx-auto my-6 bg-paper-lines" role="alert">
      {/* Red X Badge matching Screen 22 */}
      <div className="w-16 h-16 rounded-2xl bg-rose-100 border-2 border-rose-300 text-rose-700 flex items-center justify-center text-3xl font-black mx-auto shadow-sm">
        ✕
      </div>

      <div>
        <h3 className="text-xl font-black font-serif text-stone-900">Oops! Something went wrong.</h3>
        <p className="text-xs text-stone-600 font-medium leading-relaxed mt-1">{message}</p>
      </div>

      {onRetry && (
        <div className="pt-2">
          <button
            onClick={onRetry}
            className="btn-forest text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
