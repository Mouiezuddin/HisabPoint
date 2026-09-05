import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { LoadingState } from '../components/ui/LedgerComponents';
import { showToast } from '../components/ui/Toast';
import { getErrorMessage } from '../utils/format';

export function BusinessProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    shop_name: '',
    owner_name: '',
    address: '',
    phone: '',
    gstin: '',
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['business-profile'],
    queryFn: authService.getBusinessProfile,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        shop_name: profile.shop_name || 'ABC General Store',
        owner_name: profile.owner_name || 'Mouleuddin Khilji',
        address: profile.address || 'M.G. Road, Vijaypur, Karnataka',
        phone: profile.phone || '9876543210',
        gstin: profile.gstin || '29ABCDE1234F1Z5',
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: (data: typeof form) => authService.updateBusinessProfile(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['business-profile'], updated);
      showToast('Business profile saved.', 'success');
      navigate('/settings', { replace: true });
    },
    onError: (err) => showToast(getErrorMessage(err), 'error'),
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(form);
  }

  if (isLoading) return <LoadingState message="Loading business profile…" />;

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
        <h1 className="text-2xl font-black font-serif text-stone-900">Business Profile</h1>
      </div>

      {/* Main Parchment Card matching Screen 17 */}
      <div className="bg-parchment-50 rounded-2xl p-6 border-2 border-parchment-300 shadow-md bg-paper-lines space-y-4">
        {/* Shop Photo / Illustration */}
        <div className="flex flex-col items-center justify-center gap-2 pb-3 border-b border-parchment-300">
          <div className="w-24 h-20 bg-parchment-200 rounded-xl border-2 border-dashed border-stone-400 p-2 flex flex-col items-center justify-center text-center shadow-inner">
            <span className="text-3xl">🏪</span>
            <span className="text-[9px] font-bold text-stone-700">Shop Front</span>
          </div>
          <button
            type="button"
            onClick={() => showToast('Logo upload active.', 'info')}
            className="text-xs font-bold text-forest-800 hover:underline"
          >
            Change Logo
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="biz-shop-name">
              Shop Name
            </label>
            <input
              id="biz-shop-name"
              type="text"
              value={form.shop_name}
              onChange={(e) => set('shop_name', e.target.value)}
              placeholder="e.g. ABC General Store"
              className="input text-xs font-serif font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="biz-owner-name">
              Owner Name
            </label>
            <input
              id="biz-owner-name"
              type="text"
              value={form.owner_name}
              onChange={(e) => set('owner_name', e.target.value)}
              placeholder="e.g. Mouleuddin Khilji"
              className="input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="biz-phone">
              Phone
            </label>
            <input
              id="biz-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="9876543210"
              className="input text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="biz-address">
              Address
            </label>
            <textarea
              id="biz-address"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              rows={2}
              placeholder="M.G. Road, Vijaypur, Karnataka"
              className="input text-xs resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="biz-gstin">
              GSTIN (optional)
            </label>
            <input
              id="biz-gstin"
              type="text"
              value={form.gstin}
              onChange={(e) => set('gstin', e.target.value)}
              placeholder="e.g. 29ABCDE1234F1Z5"
              className="input text-xs font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full btn-forest text-white font-bold py-3 text-xs rounded-xl shadow-md mt-2"
            id="save-biz-profile"
          >
            {mutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
