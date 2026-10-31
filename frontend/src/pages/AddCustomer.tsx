import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { FormInput, FormTextArea } from '../components/FormInput';
import { ChevronLeft, AlertCircle } from 'lucide-react';

interface FormData {
  name: string;
  phone_number: string;
  email: string;
  address: string;
  opening_balance: string;
}

interface FormErrors {
  [key: string]: string;
}

export const AddCustomer: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone_number: '',
    email: '',
    address: '',
    opening_balance: '0',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    } else if (formData.phone_number.replace(/\D/g, '').length < 10) {
      newErrors.phone_number = 'Phone number must be at least 10 digits';
    }

    if (formData.email && !formData.email.includes('@')) {
      newErrors.email = 'Invalid email address';
    }

    const balance = parseFloat(formData.opening_balance);
    if (isNaN(balance) || balance < 0) {
      newErrors.opening_balance = 'Opening balance must be a valid positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
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
      setLoading(true);
      setApiError(null);

      const newCustomer = await api.addCustomer({
        name: formData.name,
        phone_number: formData.phone_number,
        email: formData.email || undefined,
        address: formData.address || undefined,
        opening_balance: parseFloat(formData.opening_balance),
      });

      // Success! Navigate to customer's ledger
      navigate(`/customer/${newCustomer.id}`);
    } catch (err: any) {
      console.error('Error adding customer:', err);
      setApiError(err.response?.data?.phone_number?.[0] || err.message || 'Failed to add customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-main">
      <div className="content-section max-w-2xl">
        {/* Header */}
        <Link to="/customers" className="btn-secondary mb-6 inline-flex items-center gap-2">
          <ChevronLeft size={18} />
          Back to Customers
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Customer</h1>
          <p className="text-gray-500 mt-1">Create a new customer account to get started</p>
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

          {/* Customer Name */}
          <FormInput
            label="Customer Name"
            name="name"
            type="text"
            placeholder="Enter customer name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
            autoFocus
          />

          {/* Phone Number */}
          <FormInput
            label="Phone Number"
            name="phone_number"
            type="tel"
            placeholder="Enter 10-digit phone number"
            value={formData.phone_number}
            onChange={handleChange}
            error={errors.phone_number}
            required
          />

          {/* Email (Optional) */}
          <FormInput
            label="Email Address"
            name="email"
            type="email"
            placeholder="Enter email (optional)"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
          />

          {/* Address (Optional) */}
          <FormTextArea
            label="Address"
            name="address"
            placeholder="Enter customer address (optional)"
            value={formData.address}
            onChange={handleChange}
            rows={3}
          />

          {/* Opening Balance */}
          <FormInput
            label="Opening Balance"
            name="opening_balance"
            type="number"
            placeholder="0.00"
            value={formData.opening_balance}
            onChange={handleChange}
            error={errors.opening_balance}
            step="0.01"
            min="0"
          />

          {/* Submit Button */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Creating...' : 'Create Customer'}
            </button>
            <Link to="/customers" className="btn-secondary flex-1 text-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
