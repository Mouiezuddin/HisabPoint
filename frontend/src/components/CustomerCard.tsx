import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Phone, Wallet } from 'lucide-react';
import { Customer } from '../api/client';
import { formatCurrency, formatPhoneNumber, getBalanceColor } from '../utils/format';

interface CustomerCardProps {
  customer: Customer;
  onClick?: () => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onClick }) => {
  const balance = customer.current_balance || 0;
  const isDebtBalance = balance > 0;

  return (
    <Link
      to={`/customer/${customer.id}`}
      onClick={onClick}
      className="card-hover group"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">{customer.name}</h3>
          <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
            <Phone size={14} />
            {formatPhoneNumber(customer.phone_number)}
          </div>
        </div>
        <ChevronRight className="text-gray-400 group-hover:text-gray-600 transition" size={20} />
      </div>

      <div className={`p-3 rounded-lg ${isDebtBalance ? 'bg-red-50' : 'bg-green-50'} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Wallet size={16} className={isDebtBalance ? 'text-red-600' : 'text-green-600'} />
          <span className="text-sm text-gray-600">Current Due</span>
        </div>
        <div className={`text-lg font-bold ${isDebtBalance ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(Math.abs(balance))}
        </div>
      </div>

      <div className="mt-3 flex gap-2 text-xs text-gray-500">
        <span className="px-2 py-1 bg-gray-100 rounded">
          {customer.status === 'active' ? '✓ Active' : 'Inactive'}
        </span>
      </div>
    </Link>
  );
};
