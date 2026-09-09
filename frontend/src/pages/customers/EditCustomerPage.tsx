import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../../services/customer.service';
import { LoadingState } from '../../components/ui/LedgerComponents';
import { ConfirmDialog } from '../../components/ui/Modal';
import { showToast } from '../../components/ui/Toast';
import { getErrorMessage } from '../../utils/format';

export function EditCustomerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const deleteMutation = useMutation({
    mutationFn: () => customerService.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      showToast(`${customer?.name || 'Customer'} deleted.`, 'success');
      navigate('/customers', { replace: true });
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

      {/* Danger Zone: Delete Customer */}
      <div className="bg-rose-50/80 rounded-2xl p-6 border-2 border-rose-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-rose-900 font-serif flex items-center gap-1.5">
              <span>⚠️</span>
              <span>Danger Zone</span>
            </h2>
            <p className="text-xs text-rose-700 mt-1">
              Permanently delete this customer and all their ledger transaction history.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="bg-rose-700 hover:bg-rose-800 text-white font-bold px-4 py-2.5 text-xs rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap self-start sm:self-auto"
            id="btn-delete-customer-danger"
          >
            🗑️ Delete Customer
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
        title="Delete customer permanently?"
        message={
          customer?.balance_status === 'due'
            ? `⚠️ WARNING: ${customer.name} has an outstanding due balance of ₹${customer.balance}. Deleting this customer will permanently erase this customer and all associated ledger transaction history. This action cannot be undone.`
            : `Are you sure you want to delete ${customer?.name || 'this customer'}? This will permanently remove the customer and all associated ledger transactions. This action cannot be undone.`
        }
        confirmLabel="Delete Permanently"
        confirmVariant="danger"
      />
    </div>
  );
}
