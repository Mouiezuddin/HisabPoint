import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../../services/customer.service';
import { LoadingState } from '../../components/ui/LedgerComponents';
import { showToast } from '../../components/ui/Toast';
import { getErrorMessage } from '../../utils/format';

export function EditCustomerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerService.get(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        notes: customer.notes,
      });
    }
  }, [customer]);

  const mutation = useMutation({
    mutationFn: (data: typeof form) => customerService.update(id!, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['customer', id], updated);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      showToast('Customer updated.', 'success');
      navigate(`/customers/${id}`, { replace: true });
    },
    onError: (err) => showToast(getErrorMessage(err), 'error'),
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: 'Customer name is required.' });
      return;
    }
    mutation.mutate(form);
  }

  if (isLoading) return <LoadingState message="Loading customer details…" />;

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
        <h1 className="text-2xl font-black font-serif text-stone-900">Edit Customer</h1>
      </div>

      {/* Form Parchment Card */}
      <div className="bg-parchment-50 rounded-2xl p-6 border-2 border-parchment-300 shadow-md bg-paper-lines space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="edit-name">
              Customer Name *
            </label>
            <input
              id="edit-name"
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="input text-xs"
              required
            />
            {errors.name && <p className="text-[10px] text-rose-700 font-bold mt-0.5">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="edit-phone">
              Phone Number
            </label>
            <input
              id="edit-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              className="input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="edit-address">
              Address
            </label>
            <input
              id="edit-address"
              type="text"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              className="input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="edit-notes">
              Notes
            </label>
            <textarea
              id="edit-notes"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              className="input text-xs resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full btn-forest text-white font-bold py-3 text-xs rounded-xl shadow-md mt-2"
            id="save-edit-customer"
          >
            {mutation.isPending ? 'Saving Changes…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
