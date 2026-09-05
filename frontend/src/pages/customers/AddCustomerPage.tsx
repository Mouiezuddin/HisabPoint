import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../../services/customer.service';
import { showToast } from '../../components/ui/Toast';
import { getErrorMessage } from '../../utils/format';

export function AddCustomerPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: customerService.create,
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast(`${customer.name} added successfully.`, 'success');
      navigate(`/customers/${customer.id}`, { replace: true });
    },
    onError: (err: unknown) => {
      if (err && typeof err === 'object' && 'response' in err) {
        const resp = (err as { response?: { data?: { errors?: Record<string, string[]> } } }).response;
        const apiErrors = resp?.data?.errors;
        if (apiErrors) {
          const mapped: Record<string, string> = {};
          Object.entries(apiErrors).forEach(([k, v]) => {
            mapped[k] = v[0];
          });
          setErrors(mapped);
          return;
        }
      }
      showToast(getErrorMessage(err), 'error');
    },
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Customer name is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full bg-parchment-200 hover:bg-parchment-300 flex items-center justify-center font-bold text-stone-800 text-sm"
        >
          ←
        </button>
        <h1 className="text-2xl font-black font-serif text-stone-900">Add Customer</h1>
      </div>

      {/* Form Parchment Card */}
      <div className="bg-parchment-50 rounded-2xl p-6 border-2 border-parchment-300 shadow-md bg-paper-lines space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="customer-name">
              Customer Name *
            </label>
            <input
              id="customer-name"
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Enter name"
              className="input text-xs"
              required
              autoFocus
            />
            {errors.name && <p className="text-[10px] text-rose-700 font-bold mt-0.5">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="customer-phone">
              Phone
            </label>
            <input
              id="customer-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="Enter phone number"
              className="input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="customer-address">
              Address
            </label>
            <input
              id="customer-address"
              type="text"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="Enter address (optional)"
              className="input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="customer-notes">
              Notes
            </label>
            <textarea
              id="customer-notes"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Any notes about this customer"
              rows={3}
              className="input text-xs resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full btn-forest text-white font-bold py-3 text-xs rounded-xl shadow-md mt-2"
            id="save-customer"
          >
            {mutation.isPending ? 'Saving…' : 'Save Customer'}
          </button>
        </form>
      </div>
    </div>
  );
}
