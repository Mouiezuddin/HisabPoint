import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api, Customer } from '../api/client';
import { FormInput, FormSelect, FormTextArea } from '../components/FormInput';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { getTodayDate, formatCurrency } from '../utils/format';
import { ChevronLeft, AlertCircle } from 'lucide-react';

interface FormData {
  customer: string;
  payment_date: string;
  payment_method: 'cash' | 'bank_transfer' | 'check' | 'card' | 'digital';
  amount: string;
  description: string;
  reference_number: string;
}

interface FormErrors {
  [key: string]: string;
}

export const RecordPayment: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedCustomer = searchParams.get('customer');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<FormData>({
    customer: preSelectedCustomer || '',
    payment_date: getTodayDate(),
    payment_method: 'cash',
    amount: '',
    description: '',
    reference_number: '',
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

        // Pre-select customer if provided
        if (preSelectedCustomer) {
          const customer = customersList.find((c) => c.id === preSelectedCustomer);
          if (customer) {
            setSelectedCustomer(customer);
          }
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [preSelectedCustomer]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.customer) {
      newErrors.customer = 'Customer is required';
    }

    if (!formData.payment_date) {
      newErrors.payment_date = 'Date is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (formData.payment_method === 'bank_transfer' && !formData.reference_number) {
      newErrors.reference_number = 'Bank transfer reference is required';
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

    // Update selected customer when changed
    if (name === 'customer') {
      const customer = customers.find((c) => c.id === value);
      setSelectedCustomer(customer || null);
    }

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

      await api.recordPayment({
        customer: formData.customer,
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        amount: parseFloat(formData.amount),
        description: formData.description || undefined,
        reference_number: formData.reference_number || undefined,
      });

      // Success! Navigate to customer ledger
      navigate(`/customer/${formData.customer}`);
    } catch (err: any) {
      console.error('Error recording payment:', err);
      setApiError(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'check', label: 'Check' },
    { value: 'card', label: 'Card' },
    { value: 'digital', label: 'Digital Payment (UPI/Mobile)' },
  ];

  const maxPaymentAmount = selectedCustomer?.current_balance || 0;

  return (
    <div className="container-main">
      <div className="content-section max-w-2xl">
        {/* Header */}
        <Link to="/" className="btn-secondary mb-6 inline-flex items-center gap-2">
          <ChevronLeft size={18} />
          Back
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Record Payment</h1>
          <p className="text-gray-500 mt-1">Record a payment received from a customer</p>
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

          {/* Current Balance Display */}
          {selectedCustomer && (
            <div className={`mb-4 p-4 rounded-lg ${selectedCustomer.current_balance > 0 ? 'bg-orange-50' : 'bg-green-50'}`}>
              <p className="text-sm text-gray-600">Current Due</p>
              <p className={`text-2xl font-bold mt-1 ${selectedCustomer.current_balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {formatCurrency(Math.abs(selectedCustomer.current_balance))}
              </p>
            </div>
          )}

          {/* Payment Date */}
          <FormInput
            label="Payment Date"
            name="payment_date"
            type="date"
            value={formData.payment_date}
            onChange={handleChange}
            error={errors.payment_date}
            required
          />

          {/* Payment Method */}
          <FormSelect
            label="Payment Method"
            name="payment_method"
            value={formData.payment_method}
            onChange={handleChange}
            options={paymentMethodOptions}
            required
          />

          {/* Amount */}
          <FormInput
            label="Payment Amount"
            name="amount"
            type="number"
            placeholder="0.00"
            value={formData.amount}
            onChange={handleChange}
            error={errors.amount}
            step="0.01"
            min="0.01"
            required
            helperText={selectedCustomer ? `Customer owes: ${formatCurrency(Math.abs(selectedCustomer.current_balance))}` : undefined}
          />

          {/* Reference Number (for bank transfer, check, etc.) */}
          <FormInput
            label="Reference Number"
            name="reference_number"
            placeholder="Transaction ID, Check #, UPI ID, etc."
            value={formData.reference_number}
            onChange={handleChange}
            error={errors.reference_number}
            helperText={formData.payment_method === 'bank_transfer' ? 'Bank transfer reference is required' : 'Optional for other payment methods'}
          />

          {/* Description */}
          <FormTextArea
            label="Notes"
            name="description"
            placeholder="Add any additional notes..."
            value={formData.description}
            onChange={handleChange}
            rows={3}
            helperText="Optional: Bank name, time of transaction, or any other details"
          />

          {/* Submit Button */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={submitting}
              className="btn-success flex-1"
            >
              {submitting ? 'Recording...' : 'Record Payment'}
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
