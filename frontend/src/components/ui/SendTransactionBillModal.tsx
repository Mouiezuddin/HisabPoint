import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ResponsiveModal } from './ResponsiveModal';
import { showToast } from './Toast';
import { formatCurrency, formatDate } from '../../utils/format';
import { printKhataStatementDirect } from '../../utils/printStatement';
import type { Customer, Transaction, BusinessProfile } from '../../types';

// Number to words for Indian numbering system
function numberToWords(num: number): string {
  if (num <= 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = convert(rupees) + ' Rupees';
  if (paise > 0) result += ' and ' + convert(paise) + ' Paise';
  return result + ' Only';
}

type RangeOption = 'all' | 'last5' | 'last10' | 'month';

interface SendTransactionBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  transactions: Transaction[];
  shopName?: string;
  business?: BusinessProfile | null;
}

export function SendTransactionBillModal({
  isOpen,
  onClose,
  customer,
  transactions,
  shopName = 'HisabPoint Ledger',
  business,
}: SendTransactionBillModalProps) {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'print'>('whatsapp');
  const [range, setRange] = useState<RangeOption>('all');
  const [customMessage, setCustomMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Filter transactions according to selected range
  const filteredTxns = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    // Ignore reversed transactions
    const valid = transactions.filter((t) => !t.is_reversed && t.type !== 'reversal');

    if (range === 'last5') return valid.slice(0, 5);
    if (range === 'last10') return valid.slice(0, 10);
    if (range === 'month') {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return valid.filter((t) => t.transaction_date.startsWith(currentMonth));
    }
    return valid;
  }, [transactions, range]);

  // Calculate totals
  const { totalGiven, totalPaid } = useMemo(() => {
    let given = 0;
    let paid = 0;
    filteredTxns.forEach((t) => {
      const amt = parseFloat(t.amount) || 0;
      if (t.type === 'credit') given += amt;
      else if (t.type === 'payment') paid += amt;
    });
    return { totalGiven: given, totalPaid: paid };
  }, [filteredTxns]);

  const displayShopName = business?.shop_name || shopName;
  const balanceNum = parseFloat(customer.balance) || 0;
  const isDue = customer.balance_status === 'due' && balanceNum > 0;

  // Generate default WhatsApp message
  const generatedMessage = useMemo(() => {
    const today = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    let msg = `🧾 *KHATA BILL & STATEMENT*\n`;
    msg += `🏪 *${displayShopName}*\n`;
    if (business?.phone) msg += `📞 Contact: ${business.phone}\n`;
    if (business?.address) msg += `📍 ${business.address}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👤 Customer: *${customer.name}*\n`;
    if (customer.phone) msg += `📱 Phone: ${customer.phone}\n`;
    msg += `📅 Date: ${today}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `*TRANSACTION HISTORY (${filteredTxns.length} entries):*\n`;

    if (filteredTxns.length === 0) {
      msg += `_(No transactions recorded in this period)_\n`;
    } else {
      filteredTxns.forEach((t) => {
        const symbol = t.type === 'credit' ? '➕ Credit' : '➖ Paid';
        const formattedAmt = `₹${parseFloat(t.amount).toLocaleString('en-IN')}`;
        const desc = t.description ? ` (${t.description})` : '';
        msg += `• ${t.transaction_date} | *${symbol}: ${formattedAmt}*${desc}\n`;
      });
    }

    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📈 Total Credit Given: ₹${totalGiven.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
    msg += `📉 Total Payment Received: ₹${totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
    if (isDue) {
      msg += `🔴 *NET BALANCE DUE: ₹${parseFloat(customer.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}*\n`;
    } else {
      msg += `🟢 *ACCOUNT STATUS: SETTLED (₹0.00)*\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `Kindly check your statement. Settle via UPI / Cash.\n`;
    msg += `Thank you for your business! 🙏`;

    return msg;
  }, [displayShopName, business, customer, filteredTxns, totalGiven, totalPaid, isDue]);

  // Sync generated message to textarea when parameters change unless user is manually editing
  useEffect(() => {
    if (!isEditing) {
      setCustomMessage(generatedMessage);
    }
  }, [generatedMessage, isEditing]);

  const cleanPhone = (customer.phone || '').replace(/\D/g, '');
  const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const whatsappUrl = phoneWithCountry
    ? `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(customMessage)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(customMessage)}`;

  function handleSendWhatsApp() {
    if (!cleanPhone) {
      showToast('No phone number saved. Opening WhatsApp chat window…', 'info');
    } else {
      showToast('Opening WhatsApp…', 'info');
    }
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  function handleCopyText() {
    navigator.clipboard.writeText(customMessage);
    showToast('Transaction bill copied to clipboard!', 'success');
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Khata Bill - ${customer.name}`,
          text: customMessage,
        });
        showToast('Shared successfully!', 'success');
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyText();
    }
  }

  function handlePrint() {
    printKhataStatementDirect(customer, filteredTxns, business, range, displayShopName);
  }

  if (!isOpen) return null;

  return (
    <>
      <ResponsiveModal
        isOpen={isOpen}
        onClose={onClose}
        title="Send Transaction History as Bill"
        maxWidthClass="max-w-2xl"
      >
        <div className="space-y-4">
          {/* Top Customer Summary Card */}
          <div className="bg-parchment-200/90 rounded-2xl p-4 border border-parchment-300 flex items-center justify-between">
            <div>
              <p className="font-serif font-black text-stone-900 text-base">{customer.name}</p>
              <p className="text-xs font-mono text-stone-600">📞 {customer.phone || 'No phone number'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-stone-500 font-serif">Current Balance</p>
              <p className="text-xl font-serif font-black text-rose-800 font-tabular">
                ₹{customer.balance}
              </p>
              <span className={isDue ? 'badge-due' : 'badge-settled'}>
                {isDue ? 'Due' : 'Settled'}
              </span>
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex bg-parchment-300/60 p-1 rounded-xl border border-parchment-300 text-xs font-bold">
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'whatsapp'
                  ? 'bg-emerald-700 text-white shadow-sm font-black'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              <span>💬 Send via WhatsApp</span>
            </button>
            <button
              onClick={() => setActiveTab('print')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'print'
                  ? 'bg-forest-900 text-gold-300 shadow-sm font-black'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              <span>🖨️ Printable Khata Bill (PDF)</span>
            </button>
          </div>

          {/* Range Selection Filter */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-xs font-bold text-stone-600 font-serif">Include Transactions:</span>
            <div className="flex flex-wrap gap-1.5 text-xs font-bold">
              {[
                { key: 'all', label: `All (${transactions.length})` },
                { key: 'last10', label: 'Last 10' },
                { key: 'last5', label: 'Last 5' },
                { key: 'month', label: 'This Month' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setRange(opt.key as RangeOption);
                    setIsEditing(false);
                  }}
                  className={`px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                    range === opt.key
                      ? 'bg-stone-800 text-parchment-100 border-stone-800'
                      : 'bg-parchment-100 text-stone-700 border-parchment-300 hover:bg-parchment-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: WhatsApp Bill */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700 font-serif">
                  WhatsApp Bill Preview (Editable)
                </label>
                {isEditing && (
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setCustomMessage(generatedMessage);
                    }}
                    className="text-[11px] font-bold text-forest-800 hover:underline cursor-pointer"
                  >
                    ↺ Reset to Default
                  </button>
                )}
              </div>

              <div className="relative">
                <textarea
                  rows={10}
                  value={customMessage}
                  onChange={(e) => {
                    setCustomMessage(e.target.value);
                    setIsEditing(true);
                  }}
                  className="w-full p-3.5 bg-parchment-50 border-2 border-parchment-300 rounded-xl text-xs font-mono leading-relaxed text-stone-900 focus:border-forest-600 focus:outline-none shadow-inner"
                  placeholder="WhatsApp message..."
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="py-2.5 bg-parchment-200 hover:bg-parchment-300 text-stone-800 font-bold text-xs rounded-xl border border-parchment-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>📋 Copy Text</span>
                </button>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="py-2.5 bg-parchment-200 hover:bg-parchment-300 text-stone-800 font-bold text-xs rounded-xl border border-parchment-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>📤 Share…</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-98"
                  id="btn-send-wa-bill"
                >
                  <span>💬 Open in WhatsApp</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Printable Khata Bill (PDF) */}
          {activeTab === 'print' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600 font-medium">
                  Official statement preview. Click Print to export as PDF or print receipt.
                </span>
                <button
                  onClick={handlePrint}
                  className="bg-forest-800 hover:bg-forest-900 text-white font-black px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                  id="btn-print-khata-bill-modal"
                >
                  <span>🖨️ Print / Save PDF</span>
                </button>
              </div>

              {/* Bill Paper Preview Box */}
              <div
                ref={printRef}
                className="bg-white border-2 border-stone-300 rounded-2xl p-6 shadow-md text-stone-900 text-xs space-y-4 max-h-[50vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="text-center border-b pb-3">
                  <h3 className="text-lg font-black font-serif tracking-tight">{displayShopName}</h3>
                  {business?.address && <p className="text-[11px] text-stone-500 mt-0.5">{business.address}</p>}
                  <p className="text-[10px] text-stone-500">
                    {business?.phone && `Phone: ${business.phone} `}
                    {business?.gstin && `| GSTIN: ${business.gstin}`}
                  </p>
                  <p className="mt-2 text-xs font-black uppercase tracking-widest text-stone-800 bg-stone-100 inline-block px-3 py-0.5 rounded border border-stone-200">
                    KHATA ACCOUNT STATEMENT & BILL
                  </p>
                </div>

                {/* Info row */}
                <div className="grid grid-cols-2 gap-4 text-[11px] border-b pb-3">
                  <div>
                    <span className="text-stone-500 font-bold block uppercase text-[9px]">CUSTOMER DETAILS</span>
                    <p className="font-bold font-serif text-sm text-stone-900">{customer.name}</p>
                    <p className="font-mono text-stone-600">{customer.phone || 'No phone'}</p>
                    {customer.address && <p className="text-stone-500">{customer.address}</p>}
                  </div>
                  <div className="text-right">
                    <span className="text-stone-500 font-bold block uppercase text-[9px]">STATEMENT DETAILS</span>
                    <p className="font-bold">
                      Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-stone-600">Total Entries: {filteredTxns.length}</p>
                  </div>
                </div>

                {/* Table */}
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b text-stone-600 font-bold uppercase text-[9px]">
                      <th className="py-2 px-1">Date</th>
                      <th className="py-2 px-2">Description</th>
                      <th className="py-2 px-1 text-right">Credit (Given)</th>
                      <th className="py-2 px-1 text-right">Payment (Paid)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredTxns.map((t) => {
                      const isCredit = t.type === 'credit';
                      return (
                        <tr key={t.id}>
                          <td className="py-2 px-1 font-mono text-stone-600">{t.transaction_date}</td>
                          <td className="py-2 px-2 font-medium">{t.description || (isCredit ? 'Credit Entry' : 'Payment Received')}</td>
                          <td className="py-2 px-1 text-right font-mono font-bold text-rose-700">
                            {isCredit ? `₹${parseFloat(t.amount).toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td className="py-2 px-1 text-right font-mono font-bold text-emerald-700">
                            {!isCredit ? `₹${parseFloat(t.amount).toLocaleString('en-IN')}` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Totals Summary */}
                <div className="border-t-2 border-stone-800 pt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between font-medium text-stone-600">
                    <span>Total Credit Given:</span>
                    <span className="font-mono font-bold text-rose-800">
                      ₹{totalGiven.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium text-stone-600">
                    <span>Total Payments Received:</span>
                    <span className="font-mono font-bold text-emerald-800">
                      ₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black border-t pt-2 text-stone-900 font-serif">
                    <span>Outstanding Balance Due:</span>
                    <span className="font-mono text-rose-800">
                      ₹{parseFloat(customer.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 italic pt-1">
                    Amount in words: {numberToWords(balanceNum)}
                  </p>
                </div>

                {/* Footer Signatory */}
                <div className="border-t pt-6 flex justify-between items-end text-[10px] text-stone-500">
                  <p>Computer generated statement from HisabPoint Bahi Khata.</p>
                  <div className="text-center">
                    <div className="w-32 border-b border-stone-400 mb-1"></div>
                    <span className="font-bold">Authorized Signatory</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ResponsiveModal>

      {/* Hidden print-only view for actual browser printing */}
      <div className="print-only" id="printable-khata-statement">
        <div className="print-invoice bg-white text-stone-900 p-8 space-y-6">
          <div className="text-center border-b-2 border-stone-800 pb-4">
            <h1 className="text-2xl font-black font-serif tracking-tight">{displayShopName}</h1>
            {business?.address && <p className="text-xs text-stone-600 mt-0.5">{business.address}</p>}
            <p className="text-xs text-stone-600">
              {business?.phone && `Phone: ${business.phone} `}
              {business?.gstin && `| GSTIN: ${business.gstin}`}
            </p>
            <h2 className="mt-3 text-sm font-black tracking-widest uppercase text-stone-800">
              CUSTOMER KHATA STATEMENT & BILL
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-6 text-xs border-b pb-4">
            <div>
              <span className="text-stone-500 font-bold block uppercase text-[10px]">BILLED TO</span>
              <p className="font-black text-sm text-stone-900">{customer.name}</p>
              <p className="font-mono text-stone-600">Phone: {customer.phone || 'N/A'}</p>
              {customer.address && <p className="text-stone-500">{customer.address}</p>}
            </div>
            <div className="text-right">
              <span className="text-stone-500 font-bold block uppercase text-[10px]">STATEMENT DETAILS</span>
              <p className="font-bold">
                Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-stone-600">Entries: {filteredTxns.length}</p>
            </div>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-stone-800 text-stone-700 font-bold uppercase text-[10px]">
                <th className="py-2 px-2">Date</th>
                <th className="py-2 px-2">Transaction Description</th>
                <th className="py-2 px-2 text-right">Given (+₹)</th>
                <th className="py-2 px-2 text-right">Received (-₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredTxns.map((t) => {
                const isCredit = t.type === 'credit';
                return (
                  <tr key={t.id}>
                    <td className="py-2 px-2 font-mono">{t.transaction_date}</td>
                    <td className="py-2 px-2 font-medium">{t.description || (isCredit ? 'Credit Entry' : 'Payment Received')}</td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-rose-800">
                      {isCredit ? `₹${parseFloat(t.amount).toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-emerald-800">
                      {!isCredit ? `₹${parseFloat(t.amount).toLocaleString('en-IN')}` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="border-t-2 border-stone-800 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-stone-700">
              <span>Total Credit Given:</span>
              <span className="font-mono font-bold">
                ₹{totalGiven.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-stone-700">
              <span>Total Payment Received:</span>
              <span className="font-mono font-bold">
                ₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-base font-black border-t-2 pt-2 text-stone-900">
              <span>Total Outstanding Balance Due:</span>
              <span className="font-mono text-rose-800">
                ₹{parseFloat(customer.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-stone-600 italic pt-1">
              Amount in words: {numberToWords(balanceNum)}
            </p>
          </div>

          <div className="border-t pt-12 flex justify-between items-end text-xs text-stone-500">
            <p>Thank you for your business!</p>
            <div className="text-center">
              <div className="w-40 border-b border-stone-400 mb-2"></div>
              <span className="font-bold">Authorized Signatory</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
