import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierService } from '../../services/supplier.service';
import { showToast } from '../../components/ui/Toast';
import { getErrorMessage } from '../../utils/format';
import type { CreateSupplierData } from '../../types';

export function AddSupplierPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateSupplierData>({
    name: '',
    company_name: '',
    phone: '',
    gstin: '',
    upi_id: '',
    address: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (data: CreateSupplierData) => supplierService.create(data),
    onSuccess: (newSupplier) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast(`Supplier '${newSupplier.company_name || newSupplier.name}' added successfully!`, 'success');
      navigate(`/suppliers/${newSupplier.id}`);
    },
    onError: (err) => {
      showToast(getErrorMessage(err, 'Failed to add supplier.'), 'error');
    },
  });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim() && !form.company_name?.trim()) {
      errs.name = 'Please provide either a Contact Name or Company Name.';
    }
    if (form.phone) {
      const digits = form.phone.replace(/\D/g, '');
      if (digits.length > 0 && digits.length < 7) {
        errs.phone = 'Enter a valid phone number.';
      }
    }
    if (form.gstin && form.gstin.trim().length > 15) {
      errs.gstin = 'GSTIN cannot exceed 15 characters.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    mutation.mutate({
      name: form.name.trim() || form.company_name?.trim() || '',
      company_name: form.company_name?.trim() || '',
      phone: form.phone?.trim() || '',
      gstin: form.gstin?.trim().toUpperCase() || '',
      upi_id: form.upi_id?.trim() || '',
      address: form.address?.trim() || '',
      notes: form.notes?.trim() || '',
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/suppliers')}
          className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-black font-serif text-stone-900 tracking-tight">
            Add New Supplier / Vendor
          </h1>
          <p className="text-xs text-stone-500">
            Log distributors, mills, and wholesale parties to track payables (देना है).
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="card p-5 sm:p-6 bg-gradient-to-b from-white to-parchment-50 border border-stone-300 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company / Business Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Supplier / Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.company_name}
              onChange={(e) => {
                setForm({ ...form, company_name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              placeholder="e.g. Ganesh Flour Mill, Amul Agency, Balaji Traders"
              className={`input text-xs ${errors.name ? 'border-red-500 ring-1 ring-red-500' : ''}`}
              autoFocus
            />
            {errors.name && <p className="text-[11px] text-red-600 font-medium mt-1">{errors.name}</p>}
          </div>

          {/* Contact Person Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Contact Person Name <span className="text-stone-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ramesh Bhai / Manager"
              className="input text-xs"
            />
          </div>

          {/* Phone & UPI ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Phone Number <span className="text-stone-400 font-normal">(Optional)</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => {
                  setForm({ ...form, phone: e.target.value });
                  if (errors.phone) setErrors({ ...errors, phone: '' });
                }}
                placeholder="+91 98765 43210"
                className={`input text-xs ${errors.phone ? 'border-red-500 ring-1 ring-red-500' : ''}`}
              />
              {errors.phone && <p className="text-[11px] text-red-600 font-medium mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                UPI ID (for 1-Tap Pay) <span className="text-stone-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={form.upi_id}
                onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
                placeholder="e.g. ganesh@okhdfcbank"
                className="input text-xs"
              />
            </div>
          </div>

          {/* GSTIN */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Supplier GSTIN <span className="text-stone-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={form.gstin}
              onChange={(e) => {
                setForm({ ...form, gstin: e.target.value.toUpperCase() });
                if (errors.gstin) setErrors({ ...errors, gstin: '' });
              }}
              placeholder="e.g. 27ABCDE1234F1Z5"
              className={`input text-xs font-mono uppercase ${
                errors.gstin ? 'border-red-500 ring-1 ring-red-500' : ''
              }`}
              maxLength={15}
            />
            {errors.gstin && <p className="text-[11px] text-red-600 font-medium mt-1">{errors.gstin}</p>}
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Godown / Office Address <span className="text-stone-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="e.g. Plot 42, APMC Grain Market, Navi Mumbai"
              rows={2}
              className="input text-xs"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Internal Remarks / Notes <span className="text-stone-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Delivers every Tuesday morning"
              className="input text-xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/suppliers')}
              className="flex-1 py-3 px-4 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 btn-forest text-white py-3 px-4 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              {mutation.isPending ? 'Saving…' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
