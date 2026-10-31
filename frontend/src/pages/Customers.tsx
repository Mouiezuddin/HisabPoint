import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, Customer } from '../api/client';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { CustomerCard } from '../components/CustomerCard';
import { Search, Plus, AlertCircle } from 'lucide-react';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const data = await api.getCustomers();
        const customersList = Array.isArray(data) ? data : data.results || [];
        setCustomers(customersList);
        setFilteredCustomers(customersList);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching customers:', err);
        setError(err.message || 'Failed to load customers');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredCustomers(customers);
    } else {
      const lowerQuery = query.toLowerCase();
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(lowerQuery) ||
          customer.phone_number.includes(query)
      );
      setFilteredCustomers(filtered);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading customers..." />;

  return (
    <div className="container-main">
      <div className="content-section">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-500 mt-1">{filteredCustomers.length} customers found</p>
          </div>
          <Link to="/add-customer" className="btn-primary btn-lg flex items-center gap-2">
            <Plus size={20} />
            Add Customer
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="input pl-12 py-3 text-base"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="card bg-red-50 border border-red-200 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-red-800 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Customers Grid */}
        {filteredCustomers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} />
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-500 text-lg">
              {searchQuery ? 'No customers match your search' : 'No customers yet'}
            </p>
            {!searchQuery && (
              <Link to="/add-customer" className="btn-primary inline-flex gap-2 mt-4">
                <Plus size={18} />
                Add First Customer
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
