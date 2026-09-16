import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '../../services/invoice.service';
import { customerService } from '../../services/customer.service';
import { todayAsInputDate, formatCurrency, getErrorMessage } from '../../utils/format';
import { showToast } from '../../components/ui/Toast';
import { LoadingState } from '../../components/ui/LedgerComponents';
import type { InvoiceItemInput, PaymentMode, DiscountType } from '../../types/invoice';
import type { CustomerListItem } from '../../types';

interface ItemRow extends InvoiceItemInput {
  _key: string; // local key for React rendering
}

const UNITS = ['pcs', 'kg', 'g', 'ltr', 'ml', 'packet', 'box', 'meter', 'dozen', 'pair'];

function newItemRow(): ItemRow {
  return { _key: crypto.randomUUID(), name: '', quantity: 1, unit: 'pcs', unit_price: 0 };
}

export function CreateInvoicePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const preselectedCustomerId = searchParams.get('customer') || '';

  // Customer selection state
  const [customerMode, setCustomerMode] = useState<'existing' | 'walkin'>(
    preselectedCustomerId ? 'existing' : 'walkin'
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState(preselectedCustomerId);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');

  // Invoice metadata
  const [invoiceDate, setInvoiceDate] = useState(todayAsInputDate());
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [paidAmount, setPaidAmount] = useState('');

  // Items
  const [items, setItems] = useState<ItemRow[]>([newItemRow()]);

  // Discount & Tax
  const [discountType, setDiscountType] = useState<DiscountType>('flat');
  const [discountValue, setDiscountValue] = useState('');
  const [enableTax, setEnableTax] = useState(false);
  const [taxRate, setTaxRate] = useState('');

  // Notes
  const [notes, setNotes] = useState('');

  // Fetch customers for selection
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.list(),
    enabled: customerMode === 'existing',
  });

  // Fetch next invoice number
  const { data: nextNumber } = useQuery({
    queryKey: ['next-invoice-number'],
    queryFn: invoiceService.getNextInvoiceNumber,
  });

  // Find selected customer
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId || !customers) return null;
    return customers.find((c: CustomerListItem) => c.id === selectedCustomerId) || null;
  }, [selectedCustomerId, customers]);

  // Filtered customer search results
  const filteredCustomers = useMemo(() => {
    if (!customers || !customerSearch.trim()) return customers || [];
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c: CustomerListItem) =>
        c.name.toLowerCase().includes(q) || c.phone?.includes(q)
    );
  }, [customers, customerSearch]);

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = item.quantity || 0;
      const price = item.unit_price || 0;
      return sum + qty * price;
    }, 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    const val = parseFloat(discountValue) || 0;
    if (discountType === 'percentage') {
      return Math.min(Math.max((subtotal * val) / 100, 0), subtotal);
    }
    return Math.min(Math.max(val, 0), subtotal);
  }, [subtotal, discountType, discountValue]);

  const afterDiscount = subtotal - discountAmount;

  const taxAmount = useMemo(() => {
    if (!enableTax) return 0;
    const rate = parseFloat(taxRate) || 0;
    return (afterDiscount * rate) / 100;
  }, [afterDiscount, enableTax, taxRate]);

  const totalAmount = afterDiscount + taxAmount;
  const paidNum = parseFloat(paidAmount) || 0;
  const balanceDue = Math.max(totalAmount - paidNum, 0);

  // Item operations
  const updateItem = useCallback((key: string, field: keyof InvoiceItemInput, value: string | number) => {
    setItems((prev) =>
      prev.map((item) =>
        item._key === key ? { ...item, [field]: value } : item
      )
    );
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((item) => item._key !== key);
    });
  }, []);

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, newItemRow()]);
  }, []);

  // Submit
  const createMutation = useMutation({
    mutationFn: invoiceService.createInvoice,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['next-invoice-number'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (selectedCustomerId) {
        queryClient.invalidateQueries({ queryKey: ['customer', selectedCustomerId] });
        queryClient.invalidateQueries({ queryKey: ['transactions', selectedCustomerId] });
      }
      showToast(data.message || 'Invoice created!', 'success');
      navigate(`/invoices/${data.invoice.id}`);
    },
    onError: (err) => showToast(getErrorMessage(err), 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const validItems = items.filter((i) => i.name.trim() && i.quantity > 0 && i.unit_price > 0);
    if (validItems.length === 0) {
      showToast('Add at least one item with name, quantity, and price.', 'error');
      return;
    }

    const customerName =
      customerMode === 'existing'
        ? selectedCustomer?.name || ''
        : walkinName.trim();

    if (!customerName) {
      showToast('Please enter or select a customer name.', 'error');
      return;
    }

    createMutation.mutate({
      customer_id: customerMode === 'existing' && selectedCustomerId ? selectedCustomerId : null,
      customer_name: customerName,
      customer_phone:
        customerMode === 'existing'
          ? selectedCustomer?.phone || ''
          : walkinPhone,
      invoice_date: invoiceDate,
      payment_mode: paymentMode,
      discount_type: discountType,
      discount_value: parseFloat(discountValue) || 0,
      tax_rate: enableTax ? parseFloat(taxRate) || 0 : 0,
      paid_amount: paidNum,
      notes,
      items: validItems.map(({ name, quantity, unit, unit_price }) => ({
        name,
        quantity,
        unit,
        unit_price,
      })),
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/invoices')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-900 mb-1"
          >
            <span>←</span> <span>Bills</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-stone-900 tracking-tight">
            Create New Bill
          </h1>
        </div>
        {nextNumber && (
          <span className="text-xs font-mono font-bold text-forest-900 bg-forest-100 px-3 py-1.5 rounded-lg border border-forest-200">
            {nextNumber}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customer Selection Card */}
        <div className="bg-parchment-50 rounded-2xl p-5 border-2 border-parchment-300 shadow-md space-y-4">
          <h2 className="text-sm font-bold text-stone-600 uppercase tracking-wider font-serif">Customer</h2>

          {/* Toggle: Existing vs Walk-in */}
          <div className="flex gap-1 bg-parchment-200 p-1 rounded-xl border border-parchment-300 w-fit">
            <button
              type="button"
              onClick={() => setCustomerMode('existing')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                customerMode === 'existing'
                  ? 'bg-forest-900 text-gold-300 shadow-sm'
                  : 'text-stone-700'
              }`}
            >
              Select Customer
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomerMode('walkin');
                setSelectedCustomerId('');
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                customerMode === 'walkin'
                  ? 'bg-forest-900 text-gold-300 shadow-sm'
                  : 'text-stone-700'
              }`}
            >
              Walk-in / Cash
            </button>
          </div>

          {customerMode === 'existing' ? (
            <div className="relative">
              {selectedCustomer ? (
                <div className="flex items-center justify-between bg-forest-50 border-2 border-forest-200 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-black font-serif text-stone-900">{selectedCustomer.name}</p>
                    <p className="text-xs text-stone-600 font-mono">{selectedCustomer.phone || 'No phone'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-rose-800 font-tabular">
                      Balance: {formatCurrency(selectedCustomer.balance)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId('');
                        setCustomerSearch('');
                      }}
                      className="text-xs font-bold text-stone-500 hover:text-rose-700"
                    >
                      ✕ Change
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    placeholder="Search customer by name or phone…"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-parchment-300 bg-white text-sm font-medium focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200"
                    id="input-customer-search-invoice"
                  />
                  {showCustomerDropdown && filteredCustomers.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border-2 border-parchment-300 shadow-xl max-h-48 overflow-y-auto">
                      {filteredCustomers.slice(0, 8).map((c: CustomerListItem) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCustomerId(c.id);
                            setShowCustomerDropdown(false);
                            setCustomerSearch('');
                          }}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-parchment-100 text-left transition-colors"
                        >
                          <div>
                            <p className="text-sm font-bold text-stone-900">{c.name}</p>
                            <p className="text-[11px] text-stone-500 font-mono">{c.phone}</p>
                          </div>
                          <span className="text-xs font-bold text-rose-800 font-tabular">
                            ₹{c.balance}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">Customer Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Walk-in Buyer"
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-parchment-300 bg-white text-sm font-medium focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200"
                  required
                  id="input-walkin-name"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">Phone (optional)</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={walkinPhone}
                  onChange={(e) => setWalkinPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-parchment-300 bg-white text-sm font-medium focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200"
                />
              </div>
            </div>
          )}
        </div>

        {/* Invoice Date & Payment Mode */}
        <div className="bg-parchment-50 rounded-2xl p-5 border-2 border-parchment-300 shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1 font-serif uppercase">Bill Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-parchment-300 bg-white text-sm font-medium focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1 font-serif uppercase">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-parchment-300 bg-white text-sm font-bold focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200"
              >
                <option value="cash">💵 Cash</option>
                <option value="credit">📒 Udhar / Credit</option>
                <option value="upi">📱 UPI</option>
                <option value="card">💳 Card</option>
                <option value="other">📦 Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-parchment-50 rounded-2xl p-5 border-2 border-parchment-300 shadow-md space-y-4">
          <h2 className="text-sm font-bold text-stone-600 uppercase tracking-wider font-serif">Items</h2>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={item._key}
                className="bg-white rounded-xl border border-parchment-200 p-3 sm:p-4 space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-400 font-mono">#{idx + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item._key)}
                      className="text-xs text-rose-500 hover:text-rose-700 font-bold"
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>

                {/* Item name */}
                <input
                  type="text"
                  placeholder="Item name / description"
                  value={item.name}
                  onChange={(e) => updateItem(item._key, 'name', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-parchment-200 text-sm font-medium focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-200"
                />

                {/* Qty, Unit, Price, Total */}
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 mb-0.5">Qty</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity || ''}
                      onChange={(e) => updateItem(item._key, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-2 rounded-lg border border-parchment-200 text-sm font-bold text-center focus:outline-none focus:border-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 mb-0.5">Unit</label>
                    <select
                      value={item.unit}
                      onChange={(e) => updateItem(item._key, 'unit', e.target.value)}
                      className="w-full px-1 py-2 rounded-lg border border-parchment-200 text-sm font-medium focus:outline-none focus:border-gold-500"
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 mb-0.5">Rate (₹)</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.unit_price || ''}
                      onChange={(e) => updateItem(item._key, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-2 rounded-lg border border-parchment-200 text-sm font-bold text-right focus:outline-none focus:border-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 mb-0.5">Amount</label>
                    <div className="w-full px-2 py-2 rounded-lg bg-parchment-100 border border-parchment-200 text-sm font-black text-right text-stone-900 font-tabular">
                      ₹{((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-parchment-400 text-sm font-bold text-stone-600 hover:bg-parchment-100 hover:border-gold-400 transition-all"
            id="btn-add-item"
          >
            + Add Item
          </button>
        </div>

        {/* Calculations Card */}
        <div className="bg-parchment-50 rounded-2xl p-5 border-2 border-parchment-300 shadow-md space-y-4">
          <h2 className="text-sm font-bold text-stone-600 uppercase tracking-wider font-serif">Bill Summary</h2>

          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span className="text-stone-600 font-medium">Subtotal</span>
            <span className="font-black font-serif font-tabular">{formatCurrency(subtotal)}</span>
          </div>

          {/* Discount */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-stone-600 font-medium">Discount</span>
              <div className="flex gap-1 bg-parchment-200 p-0.5 rounded-lg border border-parchment-300">
                <button
                  type="button"
                  onClick={() => setDiscountType('flat')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                    discountType === 'flat' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'
                  }`}
                >
                  ₹ Flat
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('percentage')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                    discountType === 'percentage' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'
                  }`}
                >
                  % Percent
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="w-28 px-3 py-1.5 rounded-lg border border-parchment-200 text-sm font-bold text-right focus:outline-none focus:border-gold-500"
              />
              {discountAmount > 0 && (
                <span className="text-sm font-bold text-emerald-700">
                  - {formatCurrency(discountAmount)}
                </span>
              )}
            </div>
          </div>

          {/* Tax Toggle */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableTax}
                onChange={(e) => setEnableTax(e.target.checked)}
                className="w-4 h-4 rounded border-parchment-300 text-forest-900 focus:ring-gold-500"
              />
              <span className="text-sm text-stone-600 font-medium">Apply GST / Tax</span>
            </label>
            {enableTax && (
              <div className="flex items-center gap-3">
                <select
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-parchment-200 text-sm font-bold focus:outline-none focus:border-gold-500"
                >
                  <option value="">Select Rate</option>
                  <option value="5">5% GST</option>
                  <option value="12">12% GST</option>
                  <option value="18">18% GST</option>
                  <option value="28">28% GST</option>
                </select>
                {taxAmount > 0 && (
                  <span className="text-sm font-bold text-stone-600">
                    + {formatCurrency(taxAmount)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t-2 border-parchment-300 pt-3">
            <div className="flex justify-between text-lg">
              <span className="font-black font-serif text-stone-900">Total</span>
              <span className="font-black font-serif text-stone-900 font-tabular">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {/* Paid Amount */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-stone-600 font-serif uppercase">Amount Paid</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-parchment-300 bg-white text-sm font-bold focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200 font-tabular"
            />
          </div>

          {/* Balance Due */}
          {balanceDue > 0 && (
            <div className="flex justify-between bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              <span className="font-bold text-rose-800 text-sm">Balance Due</span>
              <span className="font-black font-serif text-rose-800 text-lg font-tabular">
                {formatCurrency(balanceDue)}
              </span>
            </div>
          )}

          {/* Credit notice */}
          {paymentMode === 'credit' && selectedCustomerId && balanceDue > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 font-medium">
              <span className="font-bold">📒 Udhar Note:</span> {formatCurrency(balanceDue)} will be automatically
              added to <strong>{selectedCustomer?.name}</strong>'s ledger as a credit entry.
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-parchment-50 rounded-2xl p-5 border-2 border-parchment-300 shadow-md">
          <label className="block text-[11px] font-bold text-stone-600 mb-2 font-serif uppercase">Notes (optional)</label>
          <textarea
            placeholder="Additional notes for this bill…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-parchment-300 bg-white text-sm font-medium focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200 resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 btn-forest text-white font-black py-3.5 px-6 rounded-2xl shadow-skeuo-forest transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            id="btn-save-invoice"
          >
            {createMutation.isPending ? (
              'Creating Bill…'
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 12l2 2 4-4M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                </svg>
                Save Bill
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="sm:w-auto px-6 py-3.5 rounded-2xl border-2 border-parchment-300 text-stone-700 font-bold text-sm hover:bg-parchment-100 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
