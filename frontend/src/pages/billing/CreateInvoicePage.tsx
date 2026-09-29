import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '../../services/invoice.service';
import { customerService } from '../../services/customer.service';
import { ledgerService } from '../../services/ledger.service';
import { authService } from '../../services/auth.service';
import { todayAsInputDate, formatCurrency, formatDate, formatDateFull, getErrorMessage } from '../../utils/format';
import { showToast } from '../../components/ui/Toast';
import { ResponsiveModal } from '../../components/ui/ResponsiveModal';
import { PrintInvoiceView } from '../../components/billing/PrintInvoiceView';
import { CustomCalendarPicker } from '../../components/ui/CustomCalendarPicker';
import type { InvoiceItemInput, PaymentMode, DiscountType, Invoice } from '../../types/invoice';
import type { CustomerListItem, Transaction } from '../../types';

interface ItemRow extends InvoiceItemInput {
  _key: string; // local key for React rendering
}

const UNITS = ['pcs', 'kg', 'g', 'ltr', 'ml', 'packet', 'box', 'meter', 'dozen', 'pair'];

function newItemRow(): ItemRow {
  return { _key: crypto.randomUUID(), name: '', quantity: 1, unit: 'pcs', unit_price: 0 };
}

function getNDaysAgoDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  return d.toISOString().split('T')[0];
}

function getStartOfMonthDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

export function CreateInvoicePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const preselectedCustomerId = searchParams.get('customer') || '';
  const preselectedTxnId = searchParams.get('transaction') || '';
  const urlFromDate = searchParams.get('from') || '';
  const urlToDate = searchParams.get('to') || '';

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

  // Preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Billing Period & Days state
  const [billingPeriodEnabled, setBillingPeriodEnabled] = useState(Boolean(urlFromDate && urlToDate));
  const [billingPeriodPreset, setBillingPeriodPreset] = useState<'today' | '7days' | '15days' | '30days' | 'month' | 'custom'>(
    urlFromDate && urlToDate ? 'custom' : '7days'
  );
  const [billingPeriodStart, setBillingPeriodStart] = useState<string>(urlFromDate || getNDaysAgoDate(7));
  const [billingPeriodEnd, setBillingPeriodEnd] = useState<string>(urlToDate || todayAsInputDate());
  const [selectedPeriodTxnIds, setSelectedPeriodTxnIds] = useState<Record<string, boolean>>({});
  const [hasAutoLoadedPeriod, setHasAutoLoadedPeriod] = useState(false);

  const periodDaysCount = useMemo(() => {
    if (!billingPeriodStart || !billingPeriodEnd) return 1;
    const start = new Date(billingPeriodStart + 'T00:00:00').getTime();
    const end = new Date(billingPeriodEnd + 'T00:00:00').getTime();
    if (isNaN(start) || isNaN(end)) return 1;
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays);
  }, [billingPeriodStart, billingPeriodEnd]);

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

  // Fetch business profile for preview
  const { data: business } = useQuery({
    queryKey: ['business-profile'],
    queryFn: authService.getBusinessProfile,
  });

  // Fetch preselected transaction if generating bill from an existing ledger entry
  const { data: prefilledTxn } = useQuery({
    queryKey: ['transaction', preselectedTxnId],
    queryFn: () => ledgerService.getTransaction(preselectedTxnId),
    enabled: !!preselectedTxnId,
  });

  const [hasPrefilledTxn, setHasPrefilledTxn] = useState(false);
  useEffect(() => {
    if (prefilledTxn && !hasPrefilledTxn) {
      if (prefilledTxn.customer) {
        setSelectedCustomerId(prefilledTxn.customer);
        setCustomerMode('existing');
      }
      if (prefilledTxn.transaction_date) {
        setInvoiceDate(prefilledTxn.transaction_date);
      }
      setPaymentMode('credit');
      const amt = parseFloat(prefilledTxn.amount) || 0;
      setItems([
        {
          _key: crypto.randomUUID(),
          name: prefilledTxn.description || 'Credit Entry',
          quantity: null,
          unit: '',
          unit_price: null,
          amount: amt,
        },
      ]);
      setHasPrefilledTxn(true);
    }
  }, [prefilledTxn, hasPrefilledTxn]);

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

  // Fetch transactions of selected customer for billing period import
  const { data: customerTxns } = useQuery({
    queryKey: ['transactions', selectedCustomerId],
    queryFn: () => ledgerService.getTransactions(selectedCustomerId),
    enabled: customerMode === 'existing' && !!selectedCustomerId,
  });

  const matchingCredits = useMemo(() => {
    if (!customerTxns || !selectedCustomerId || !billingPeriodStart || !billingPeriodEnd) return [];
    return customerTxns.filter(
      (t: Transaction) =>
        !t.is_reversed &&
        t.type === 'credit' &&
        t.transaction_date >= billingPeriodStart &&
        t.transaction_date <= billingPeriodEnd
    );
  }, [customerTxns, selectedCustomerId, billingPeriodStart, billingPeriodEnd]);

  const matchingPayments = useMemo(() => {
    if (!customerTxns || !selectedCustomerId || !billingPeriodStart || !billingPeriodEnd) return [];
    return customerTxns.filter(
      (t: Transaction) =>
        !t.is_reversed &&
        t.type === 'payment' &&
        t.transaction_date >= billingPeriodStart &&
        t.transaction_date <= billingPeriodEnd
    );
  }, [customerTxns, selectedCustomerId, billingPeriodStart, billingPeriodEnd]);

  const totalPaymentsInPeriod = useMemo(() => {
    return matchingPayments.reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
  }, [matchingPayments]);

  const totalPeriodCredit = useMemo(() => {
    return matchingCredits.reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
  }, [matchingCredits]);

  // Keep selectedPeriodTxnIds populated with all matching entries by default
  useEffect(() => {
    if (matchingCredits.length > 0) {
      setSelectedPeriodTxnIds((prev) => {
        const next = { ...prev };
        matchingCredits.forEach((t) => {
          if (next[t.id] === undefined) {
            next[t.id] = true;
          }
        });
        return next;
      });
    }
  }, [matchingCredits]);

  // Auto-load period items if navigated with urlFromDate and urlToDate
  useEffect(() => {
    if (urlFromDate && urlToDate && customerTxns && !hasAutoLoadedPeriod && matchingCredits.length > 0) {
      const newItems: ItemRow[] = matchingCredits.map((txn) => ({
        _key: crypto.randomUUID(),
        name: txn.description || 'Credit Entry',
        quantity: null,
        unit: '',
        unit_price: null,
        amount: parseFloat(txn.amount) || 0,
      }));
      setItems(newItems);
      setPaymentMode('credit');
      setBillingPeriodEnabled(true);
      setNotes((prev) => prev || `Bill for ${periodDaysCount} days (${formatDate(urlFromDate)} to ${formatDate(urlToDate)})`);
      setHasAutoLoadedPeriod(true);
    }
  }, [urlFromDate, urlToDate, customerTxns, hasAutoLoadedPeriod, matchingCredits, periodDaysCount]);

  const handleSelectPeriodPreset = (preset: 'today' | '7days' | '15days' | '30days' | 'month' | 'custom') => {
    setBillingPeriodPreset(preset);
    setBillingPeriodEnabled(true);
    const today = todayAsInputDate();
    if (preset === 'today') {
      setBillingPeriodStart(today);
      setBillingPeriodEnd(today);
    } else if (preset === '7days') {
      setBillingPeriodStart(getNDaysAgoDate(7));
      setBillingPeriodEnd(today);
    } else if (preset === '15days') {
      setBillingPeriodStart(getNDaysAgoDate(15));
      setBillingPeriodEnd(today);
    } else if (preset === '30days') {
      setBillingPeriodStart(getNDaysAgoDate(30));
      setBillingPeriodEnd(today);
    } else if (preset === 'month') {
      setBillingPeriodStart(getStartOfMonthDate());
      setBillingPeriodEnd(today);
    }
  };

  const handleLoadSelectedEntries = () => {
    const chosen = matchingCredits.filter((t) => selectedPeriodTxnIds[t.id] !== false);
    if (chosen.length === 0) {
      showToast('Please select at least one entry to load.', 'error');
      return;
    }
    const newItems: ItemRow[] = chosen.map((txn) => ({
      _key: crypto.randomUUID(),
      name: txn.description || 'Credit Entry',
      quantity: null,
      unit: '',
      unit_price: null,
      amount: parseFloat(txn.amount) || 0,
    }));
    setItems(newItems);
    setPaymentMode('credit');
    setNotes((prev) => prev || `Bill for ${periodDaysCount} days (${formatDate(billingPeriodStart)} to ${formatDate(billingPeriodEnd)})`);
    showToast(`Loaded ${chosen.length} Khata entries into bill!`, 'success');
  };

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const q = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity || ''));
      const p = typeof item.unit_price === 'number' ? item.unit_price : parseFloat(String(item.unit_price || ''));
      if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) {
        return sum + q * p;
      }
      const a = typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount || ''));
      if (!isNaN(a) && a > 0) {
        return sum + a;
      }
      return sum;
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
  const updateItem = useCallback((key: string, field: keyof ItemRow, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item._key !== key) return item;
        const updated = { ...item, [field]: value };
        const q = typeof updated.quantity === 'number' ? updated.quantity : parseFloat(String(updated.quantity || ''));
        const p = typeof updated.unit_price === 'number' ? updated.unit_price : parseFloat(String(updated.unit_price || ''));
        if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) {
          updated.amount = q * p;
        }
        return updated;
      })
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

  const getValidItems = () => {
    return items.filter((i) => {
      const nameValid = Boolean(i.name && i.name.trim());
      const hasQtyPrice = Boolean(i.quantity && i.unit_price && i.quantity > 0 && i.unit_price > 0);
      const hasAmt = Boolean(i.amount && i.amount > 0);
      return nameValid && (hasQtyPrice || hasAmt);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validItems = getValidItems();
    if (validItems.length === 0) {
      showToast('Add at least one item with a name and price or amount.', 'error');
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
      transaction_id: preselectedTxnId || null,
      customer_name: customerName,
      customer_phone:
        customerMode === 'existing'
          ? selectedCustomer?.phone || ''
          : walkinPhone,
      invoice_date: invoiceDate,
      due_date: null,
      billing_period_start: billingPeriodEnabled && billingPeriodStart ? billingPeriodStart : null,
      billing_period_end: billingPeriodEnabled && billingPeriodEnd ? billingPeriodEnd : null,
      payment_mode: paymentMode,
      discount_type: discountType,
      discount_value: parseFloat(discountValue) || 0,
      tax_rate: enableTax ? parseFloat(taxRate) || 0 : 0,
      paid_amount: paidNum,
      notes,
      items: validItems.map((item) => ({
        name: item.name.trim(),
        quantity: item.quantity && item.quantity > 0 ? item.quantity : null,
        unit: item.quantity && item.quantity > 0 ? (item.unit || 'pcs') : '',
        unit_price: item.unit_price && item.unit_price > 0 ? item.unit_price : null,
        amount: item.amount || (item.quantity && item.unit_price ? item.quantity * item.unit_price : undefined),
      })),
    });
  };

  // Build draft invoice object for preview
  const draftInvoice: Invoice = useMemo(() => {
    const validItems = getValidItems();
    const customerName =
      customerMode === 'existing'
        ? selectedCustomer?.name || 'Customer'
        : walkinName.trim() || 'Walk-in Customer';

    const customerPhone =
      customerMode === 'existing'
        ? selectedCustomer?.phone || ''
        : walkinPhone;

    const status = paidNum >= totalAmount ? 'paid' : paidNum > 0 ? 'partially_paid' : 'unpaid';

    return {
      id: 'draft',
      customer_id: selectedCustomerId || null,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_address: selectedCustomer?.address || '',
      invoice_number: nextNumber || 'RP-000001',
      invoice_date: invoiceDate,
      due_date: null,
      billing_period_start: billingPeriodEnabled && billingPeriodStart ? billingPeriodStart : null,
      billing_period_end: billingPeriodEnabled && billingPeriodEnd ? billingPeriodEnd : null,
      billing_period_days: billingPeriodEnabled && billingPeriodStart && billingPeriodEnd ? periodDaysCount : null,
      payment_status: status,
      payment_mode: paymentMode,
      subtotal: subtotal.toFixed(2),
      discount_type: discountType,
      discount_value: discountValue || '0',
      discount_amount: discountAmount.toFixed(2),
      tax_rate: enableTax ? (taxRate || '0') : '0',
      tax_amount: taxAmount.toFixed(2),
      total_amount: totalAmount.toFixed(2),
      paid_amount: paidNum.toFixed(2),
      balance_due: balanceDue.toFixed(2),
      notes,
      terms: 'Goods once sold will not be taken back.',
      ledger_transaction_id: preselectedTxnId || null,
      items: validItems.map((item, idx) => ({
        id: item._key,
        name: item.name || 'Item',
        quantity: item.quantity ? String(item.quantity) : null,
        unit: item.quantity ? (item.unit || 'pcs') : '',
        unit_price: item.unit_price ? String(item.unit_price) : null,
        amount: String(item.amount || (item.quantity && item.unit_price ? item.quantity * item.unit_price : '0')),
        order: idx,
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }, [
    items, customerMode, selectedCustomer, walkinName, walkinPhone,
    paidNum, totalAmount, nextNumber, invoiceDate, paymentMode,
    subtotal, discountType, discountValue, discountAmount,
    enableTax, taxRate, taxAmount, balanceDue, notes, preselectedTxnId,
    selectedCustomerId, billingPeriodEnabled, billingPeriodStart, billingPeriodEnd,
    periodDaysCount,
  ]);

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
          {preselectedTxnId && (
            <p className="text-xs text-forest-800 font-semibold mt-0.5">
              🔗 Linked to credit entry ({formatCurrency(prefilledTxn?.amount || '0')})
            </p>
          )}
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

        {/* Billing Period & Days (Import Khata Entries) */}
        <div className="bg-parchment-50 rounded-2xl p-5 border-2 border-parchment-300 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wider font-serif flex items-center gap-2">
                <span>📅</span>
                <span>Billing Period & Days</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Choose how many days this bill covers and optionally import Khata entries.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer bg-parchment-200 hover:bg-parchment-300 px-3 py-1.5 rounded-xl border border-parchment-300 text-xs font-bold text-stone-800 self-start sm:self-auto transition-colors">
              <input
                type="checkbox"
                checked={billingPeriodEnabled}
                onChange={(e) => setBillingPeriodEnabled(e.target.checked)}
                className="rounded text-forest-800 focus:ring-forest-700"
              />
              <span>Include Bill Period</span>
            </label>
          </div>

          {billingPeriodEnabled && (
            <div className="space-y-4 pt-2 border-t border-parchment-200">
              {/* Custom Interactive Calendar Picker (Visual Month Grid, Days Stepper & Quick Opinion Presets) */}
              <CustomCalendarPicker
                startDate={billingPeriodStart}
                endDate={billingPeriodEnd}
                onChange={(start, end) => {
                  setBillingPeriodStart(start);
                  setBillingPeriodEnd(end);
                }}
              />

              {/* Customer Khata Entries in this Period */}
              {customerMode === 'existing' && selectedCustomerId && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-700">
                      Khata Entries in these {periodDaysCount} Days:
                    </span>
                    <span className="font-mono font-black text-rose-800">
                      {matchingCredits.length} {matchingCredits.length === 1 ? 'Entry' : 'Entries'} • {formatCurrency(totalPeriodCredit)}
                    </span>
                  </div>

                  {matchingCredits.length > 0 ? (
                    <div className="space-y-2">
                      <div className="max-h-44 overflow-y-auto space-y-1 border border-parchment-300 rounded-xl p-2 bg-white">
                        {matchingCredits.map((txn) => {
                          const isChecked = selectedPeriodTxnIds[txn.id] !== false;
                          return (
                            <label
                              key={txn.id}
                              className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg hover:bg-stone-50 cursor-pointer border border-transparent hover:border-stone-200"
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) =>
                                    setSelectedPeriodTxnIds((prev) => ({
                                      ...prev,
                                      [txn.id]: e.target.checked,
                                    }))
                                  }
                                  className="rounded text-forest-800 focus:ring-forest-700"
                                />
                                <span className="text-[10px] font-mono text-stone-500">
                                  {formatDate(txn.transaction_date)}
                                </span>
                                <span className="font-medium text-stone-900">
                                  {txn.description || 'Credit Entry'}
                                </span>
                              </div>
                              <span className="font-mono font-bold text-rose-800">
                                {formatCurrency(txn.amount)}
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={handleLoadSelectedEntries}
                          className="bg-forest-800 hover:bg-forest-900 text-white text-xs font-black py-2 px-3.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
                        >
                          <span>📥</span>
                          <span>Populate Selected Entries into Bill Table</span>
                        </button>
                        {totalPaymentsInPeriod > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setPaidAmount(String(totalPaymentsInPeriod));
                              showToast(`Set Paid Amount to ₹${totalPaymentsInPeriod}`, 'info');
                            }}
                            className="text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                          >
                            💰 Apply {formatCurrency(totalPaymentsInPeriod)} Paid in Period
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-parchment-100/60 border border-parchment-300 text-center text-xs text-stone-500">
                      No credit transactions in Khata between these dates. You can enter items manually below.
                    </div>
                  )}
                </div>
              )}
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
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-600 uppercase tracking-wider font-serif">Items</h2>
            <span className="text-[11px] text-stone-500">
              Enter Qty × Rate or directly enter Amount for simple items
            </span>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => {
              const hasQtyRate = Boolean(item.quantity && item.unit_price && item.quantity > 0 && item.unit_price > 0);
              const computedLineTotal = hasQtyRate ? (item.quantity! * item.unit_price!).toFixed(2) : (item.amount || 0).toFixed(2);

              return (
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
                    required
                  />

                  {/* Qty, Unit, Price, Total */}
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 mb-0.5">Qty (opt)</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="-"
                        value={item.quantity !== null && item.quantity !== undefined ? item.quantity : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : parseFloat(e.target.value);
                          updateItem(item._key, 'quantity', val);
                        }}
                        className="w-full px-2 py-2 rounded-lg border border-parchment-200 text-sm font-bold text-center focus:outline-none focus:border-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 mb-0.5">Unit</label>
                      <select
                        value={item.unit || ''}
                        onChange={(e) => updateItem(item._key, 'unit', e.target.value)}
                        className="w-full px-1 py-2 rounded-lg border border-parchment-200 text-sm font-medium focus:outline-none focus:border-gold-500"
                      >
                        <option value="">-</option>
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
                        placeholder="-"
                        value={item.unit_price !== null && item.unit_price !== undefined ? item.unit_price : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : parseFloat(e.target.value);
                          updateItem(item._key, 'unit_price', val);
                        }}
                        className="w-full px-2 py-2 rounded-lg border border-parchment-200 text-sm font-bold text-right focus:outline-none focus:border-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 mb-0.5">Amount (₹)</label>
                      {hasQtyRate ? (
                        <div className="w-full px-2 py-2 rounded-lg bg-parchment-100 border border-parchment-200 text-sm font-black text-right text-stone-900 font-tabular">
                          ₹{computedLineTotal}
                        </div>
                      ) : (
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="0.00"
                          value={item.amount !== null && item.amount !== undefined ? item.amount : ''}
                          onChange={(e) => updateItem(item._key, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-2 rounded-lg border border-parchment-200 text-sm font-black text-right focus:outline-none focus:border-gold-500 font-tabular text-stone-900"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-parchment-400 text-sm font-bold text-stone-600 hover:bg-parchment-100 hover:border-gold-400 transition-all cursor-pointer"
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
              <span className="font-black font-serif text-stone-900">Grand Total</span>
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
              reflected in <strong>{selectedCustomer?.name}</strong>'s ledger balance.
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
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="sm:w-auto px-6 py-3.5 rounded-2xl border-2 border-forest-800 bg-forest-50 text-forest-900 font-black text-sm hover:bg-forest-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
            id="btn-preview-invoice"
          >
            <span>👁️</span>
            <span>Preview Bill</span>
          </button>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 btn-forest text-white font-black py-3.5 px-6 rounded-2xl shadow-skeuo-forest transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
            className="sm:w-auto px-6 py-3.5 rounded-2xl border-2 border-parchment-300 text-stone-700 font-bold text-sm hover:bg-parchment-100 transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Bill Preview Modal before Save */}
      <ResponsiveModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Official Bill Preview"
        maxWidthClass="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="bg-stone-100 p-2 sm:p-4 rounded-xl border border-stone-300 overflow-x-auto max-h-[70vh]">
            <PrintInvoiceView invoice={draftInvoice} business={business} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowPreviewModal(false)}
              className="px-5 py-2.5 rounded-xl border border-stone-300 font-bold text-xs text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              Back to Edit
            </button>
            <button
              type="button"
              onClick={(e) => {
                setShowPreviewModal(false);
                handleSubmit(e);
              }}
              disabled={createMutation.isPending}
              className="btn-forest text-white font-black px-6 py-2.5 rounded-xl text-xs shadow-md cursor-pointer"
            >
              Looks Good, Save Bill
            </button>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
}
