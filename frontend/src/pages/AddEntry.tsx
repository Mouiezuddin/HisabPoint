import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api, Customer } from '../api/client';
import { FormInput, FormSelect, FormTextArea } from '../components/FormInput';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { getTodayDate } from '../utils/format';
import { ChevronLeft, AlertCircle } from 'lucide-react';

interface FormData {
  customer: string;
  entry_date: string;
  entry_type: 'credit' | 'debit';
  amount: string;
  description: string;
  transaction_type: string;
}

interface FormErrors {
  [key: string]: string;
}

export const AddEntry: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedCustomer = searchParams.get('customer');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState<FormData>({
    customer: preSelectedCustomer || '',
    entry_date: getTodayDate(),
    entry_type: 'credit',
    amount: '',
    description: '',
    transaction_type: 'sale',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await api.getCustomers();
        const customersList = Array.isArray(data) ? data : data.results || [];
        setCustomers(customersList);
      } catch (err) {
        console.error('Error fetching customers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.customer) {
      newErrors.customer = 'Customer is required';
    }

    if (!formData.entry_date) {
      newErrors.entry_date = 'Date is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setApiError(null);

      await api.addEntry({
        customer: formData.customer,
        entry_date: formData.entry_date,
        entry_type: formData.entry_type,
        amount: parseFloat(formData.amount),
        description: formData.description || undefined,
        transaction_type: formData.transaction_type,
      });

      // Success! Navigate back or to customer ledger
      navigate(`/customer/${formData.customer}`);
    } catch (err: any) {
      console.error('Error adding entry:', err);
      setApiError(err.message || 'Failed to add entry');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const transactionOptions = [
    { value: 'sale', label: 'Sale' },
    { value: 'purchase', label: 'Purchase' },
    { value: 'return', label: 'Return' },
    { value: 'adjustment', label: 'Adjustment' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="container-main">
      <div className="content-section max-w-2xl">
        {/* Header */}
        <Link to="/" className="btn-secondary mb-6 inline-flex items-center gap-2">
          <ChevronLeft size={18} />
          Back
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add Ledger Entry</h1>
          <p className="text-gray-500 mt-1">Record a sale or payment for a customer</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card">
          {/* API Error */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-red-800 text-sm">{apiError}</p>
            </div>
          )}

          {/* Customer Select */}
          <FormSelect
            label="Customer"
            name="customer"
            value={formData.customer}
            onChange={handleChange}
            options={customers.map((c) => ({
              value: c.id,
              label: `${c.name} (${c.phone_number})`,
            }))}
            error={errors.customer}
            required
          />

          {/* Entry Type */}
          <FormSelect
            label="Entry Type"
            name="entry_type"
            value={formData.entry_type}
            onChange={handleChange}
            options={[
              { value: 'credit', label: 'Sale (Amount owed to you)' },
              { value: 'debit', label: 'Payment (Amount paid by customer)' },
            ]}
            required
          />

          {/* Transaction Type */}
          <FormSelect
            label="Transaction Type"
            name="transaction_type"
            value={formData.transaction_type}
            onChange={handleChange}
            options={transactionOptions}
          />

          {/* Date */}
          <FormInput
            label="Date"
            name="entry_date"
            type="date"
            value={formData.entry_date}
            onChange={handleChange}
            error={errors.entry_date}
            required
          />

          {/* Amount */}
          <FormInput
            label="Amount"
            name="amount"
            type="number"
            placeholder="0.00"
            value={formData.amount}
            onChange={handleChange}
            error={errors.amount}
            step="0.01"
            min="0.01"
            required
          />

          {/* Description */}
          <FormTextArea
            label="Description"
            name="description"
            placeholder="Add notes or reference number..."
            value={formData.description}
            onChange={handleChange}
            rows={3}
            helperText="Optional: Item details, invoice number, reference, etc."
          />

          {/* Submit Button */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1"
            >
              {submitting ? 'Adding...' : 'Add Entry'}
            </button>
            <Link to="/" className="btn-secondary flex-1 text-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
