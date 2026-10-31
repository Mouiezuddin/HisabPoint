import React from 'react';
import { LedgerEntry, Payment } from '../api/client';
import { formatCurrency, formatDate, getEntryTypeLabel, getPaymentMethodLabel } from '../utils/format';
import { ArrowDownRight, ArrowUpRight, DollarSign } from 'lucide-react';

interface TransactionItemProps {
  transaction: LedgerEntry | Payment;
  type: 'entry' | 'payment';
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, type }) => {
  if (type === 'entry') {
    const entry = transaction as LedgerEntry;
    const isCredit = entry.entry_type === 'credit';
    const isPayment = entry.entry_type === 'debit';

    return (
      <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
        <div className="flex items-start gap-3 flex-1">
          <div
            className={`p-2 rounded-lg ${
              isPayment ? 'bg-green-100' : 'bg-orange-100'
            }`}
          >
            {isPayment ? (
              <ArrowDownRight className={isPayment ? 'text-green-600' : 'text-orange-600'} size={18} />
            ) : (
              <ArrowUpRight className="text-orange-600" size={18} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900">
              {getEntryTypeLabel(entry.entry_type)}
            </p>
            {entry.description && (
              <p className="text-sm text-gray-500 truncate">{entry.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">{formatDate(entry.entry_date)}</p>
          </div>
        </div>
        <div className={`text-right whitespace-nowrap ml-3 ${isPayment ? 'text-green-600' : 'text-orange-600'}`}>
          <p className="font-bold">{isPayment ? '-' : '+'}{formatCurrency(entry.amount)}</p>
        </div>
      </div>
    );
  } else {
    const payment = transaction as Payment;

    return (
      <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 rounded-lg bg-green-100">
            <DollarSign className="text-green-600" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900">
              Payment - {getPaymentMethodLabel(payment.payment_method)}
            </p>
            {payment.description && (
              <p className="text-sm text-gray-500 truncate">{payment.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">{formatDate(payment.payment_date)}</p>
          </div>
        </div>
        <div className="text-right whitespace-nowrap ml-3 text-green-600">
          <p className="font-bold">-{formatCurrency(payment.amount)}</p>
        </div>
      </div>
    );
  }
};
