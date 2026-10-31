import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, Customer, LedgerEntry, Payment } from '../api/client';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { TransactionItem } from '../components/TransactionItem';
import { formatCurrency, formatDate, getBalanceColor } from '../utils/format';
import { ChevronLeft, Phone, Mail, AlertCircle } from 'lucide-react';

export const CustomerLedger: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!customerId) return;

      try {
        setLoading(true);
        const [customerData, ledgerData, paymentData] = await Promise.all([
          api.getCustomer(customerId),
          api.getCustomerLedger(customerId),
          api.getCustomerPayments(customerId),
        ]);

        setCustomer(customerData);
        setEntries(ledgerData || []);
        setPayments(paymentData || []);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching customer data:', err);
        setError(err.message || 'Failed to load customer ledger');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [customerId]);

  if (loading) return <LoadingSpinner fullScreen message="Loading customer ledger..." />;

  if (error || !customer) {
    return (
      <div className="content-section">
        <Link to="/customers" className="btn-secondary mb-6 inline-flex items-center gap-2">
          <ChevronLeft size={18} />
          Back to Customers
        </Link>
        <div className="card bg-red-50 border border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-800 text-sm mt-1">{error || 'Customer not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalCredit = entries
    .filter((e) => e.entry_type === 'credit')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalDebit = entries
    .filter((e) => e.entry_type === 'debit')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const currentDue = customer.current_balance || totalCredit - totalDebit - totalPayments;

  // Combine and sort transactions
  const allTransactions = [
    ...entries.map((e) => ({ ...e, date: e.entry_date, type: 'entry' as const })),
    ...payments.map((p) => ({ ...p, date: p.payment_date, type: 'payment' as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="container-main">
      <div className="content-section">
        {/* Back Button */}
        <Link to="/customers" className="btn-secondary mb-6 inline-flex items-center gap-2">
          <ChevronLeft size={18} />
          Back to Customers
        </Link>

        {/* Customer Header */}
        <div className="card mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
              <div className="flex items-center gap-4 mt-3 text-gray-600">
                <div className="flex items-center gap-1">
                  <Phone size={16} />
                  {customer.phone_number}
                </div>
                {customer.email && (
                  <div className="flex items-center gap-1">
                    <Mail size={16} />
                    {customer.email}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-sm">Current Due</p>
              <p className={`text-3xl font-bold mt-1 ${currentDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(Math.abs(currentDue))}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {currentDue > 0 ? 'Outstanding' : 'Credit'}
              </p>
            </div>
          </div>

          {customer.address && (
            <p className="text-gray-600 text-sm">📍 {customer.address}</p>
          )}
        </div>

        {/* Balance Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="card text-center">
            <p className="text-gray-500 text-sm">Opening Balance</p>
            <p className="text-xl font-bold text-gray-900 mt-2">
              {formatCurrency(customer.opening_balance)}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-gray-500 text-sm">Total Sales</p>
            <p className="text-xl font-bold text-orange-600 mt-2">
              {formatCurrency(totalCredit)}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-gray-500 text-sm">Total Paid</p>
            <p className="text-xl font-bold text-green-600 mt-2">
              {formatCurrency(totalDebit + totalPayments)}
            </p>
          </div>
          <div className={`card text-center ${currentDue > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
            <p className="text-gray-500 text-sm">Current Balance</p>
            <p className={`text-xl font-bold mt-2 ${currentDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(Math.abs(currentDue))}
            </p>
          </div>
        </div>

        {/* Ledger Transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
              <p className="text-sm text-gray-500 mt-1">{allTransactions.length} transactions</p>
            </div>
            <div className="flex gap-2">
              <Link to={`/add-entry?customer=${customerId}`} className="btn-primary btn-sm">
                + Sale
              </Link>
              <Link to={`/record-payment?customer=${customerId}`} className="btn-success btn-sm">
                + Payment
              </Link>
            </div>
          </div>

          {allTransactions.length > 0 ? (
            <div className="space-y-1">
              {allTransactions.map((transaction, index) => {
                const item = transaction as any;
                if (transaction.type === 'entry') {
                  return (
                    <TransactionItem
                      key={`entry-${item.id}`}
                      transaction={item}
                      type="entry"
                    />
                  );
                } else {
                  return (
                    <TransactionItem
                      key={`payment-${item.id}`}
                      transaction={item}
                      type="payment"
                    />
                  );
                }
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
