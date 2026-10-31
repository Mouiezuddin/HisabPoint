import React, { useEffect, useState } from 'react';
import { api, DashboardStats, Customer } from '../api/client';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/format';
import { TrendingUp, Users, CreditCard, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const dashboardData = await api.getDashboard();
        setStats(dashboardData);

        // Fetch recent customers
        const customersData = await api.getCustomers();
        setRecentCustomers(customersData.results?.slice(0, 5) || []);
        setError(null);
      } catch (err: any) {
        console.error('Dashboard error:', err);
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner fullScreen message="Loading dashboard..." />;

  if (error) {
    return (
      <div className="content-section">
        <div className="card bg-red-50 border border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-800 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const todayCredit = stats.ledger_stats.today.credit || 0;
  const todayPayment = stats.payment_stats.today.total || 0;
  const totalOutstanding = stats.top_debtors.reduce((sum, customer) => sum + customer.balance, 0);

  return (
    <div className="container-main">
      <div className="content-section">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's your business summary.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Today's Sales */}
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Today's Sales</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(todayCredit)}
                </h3>
                <p className="text-xs text-gray-400 mt-2">
                  {stats.ledger_stats.today.entries} transactions
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          {/* Today's Collections */}
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Today's Collections</p>
                <h3 className="text-2xl font-bold text-green-600 mt-2">
                  {formatCurrency(todayPayment)}
                </h3>
                <p className="text-xs text-gray-400 mt-2">
                  {stats.payment_stats.today.count} payments
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CreditCard className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          {/* Total Outstanding */}
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Outstanding</p>
                <h3 className="text-2xl font-bold text-orange-600 mt-2">
                  {formatCurrency(totalOutstanding)}
                </h3>
                <p className="text-xs text-gray-400 mt-2">
                  {stats.customer_stats.total_customers} customers
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertCircle className="text-orange-600" size={24} />
              </div>
            </div>
          </div>

          {/* Total Customers */}
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Customers</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.customer_stats.total_customers}
                </h3>
                <p className="text-xs text-gray-400 mt-2">
                  {stats.customer_stats.active_customers} active
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Debtors */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Top Debtors</h2>
                <Link to="/customers" className="text-blue-600 text-sm hover:text-blue-700 font-medium">
                  View All →
                </Link>
              </div>

              <div className="space-y-3">
                {stats.top_debtors.length > 0 ? (
                  stats.top_debtors.slice(0, 5).map((customer) => (
                    <Link
                      key={customer.id}
                      to={`/customer/${customer.id}`}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.phone}</p>
                      </div>
                      <div className="text-right whitespace-nowrap ml-2">
                        <p className="font-bold text-orange-600">{formatCurrency(customer.balance)}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-6">No debtors</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/add-customer"
                className="btn-primary w-full text-center block"
              >
                + Add Customer
              </Link>
              <Link
                to="/add-entry"
                className="btn-primary w-full text-center block"
              >
                + Add Entry
              </Link>
              <Link
                to="/record-payment"
                className="btn-primary w-full text-center block"
              >
                + Record Payment
              </Link>
              <Link
                to="/customers"
                className="btn-secondary w-full text-center block"
              >
                View Customers
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Customers */}
        {recentCustomers.length > 0 && (
          <div className="mt-6 card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Customers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentCustomers.map((customer) => (
                <Link
                  key={customer.id}
                  to={`/customer/${customer.id}`}
                  className="p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition"
                >
                  <p className="font-medium text-gray-900">{customer.name}</p>
                  <p className="text-sm text-gray-500">{customer.phone_number}</p>
                  <p className="text-sm font-semibold text-orange-600 mt-1">
                    {formatCurrency(customer.current_balance)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
