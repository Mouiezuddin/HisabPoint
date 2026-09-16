import React, { useRef } from 'react';
import type { Invoice } from '../../types/invoice';
import type { BusinessProfile } from '../../types';
import { formatCurrency } from '../../utils/format';

// Number to words for amount (Indian system)
function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
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

interface PrintInvoiceViewProps {
  invoice: Invoice;
  business?: BusinessProfile | null;
}

export function PrintInvoiceView({ invoice, business }: PrintInvoiceViewProps) {
  const totalNum = parseFloat(invoice.total_amount) || 0;
  const amountWords = numberToWords(totalNum);

  return (
    <div className="print-invoice bg-white" id="printable-invoice">
      {/* Shop Header */}
      <div className="text-center border-b-2 border-stone-800 pb-4 mb-4">
        {business?.logo && (
          <img
            src={business.logo}
            alt="Shop Logo"
            className="w-16 h-16 mx-auto mb-2 rounded-lg object-contain"
          />
        )}
        <h1 className="text-2xl font-black font-serif tracking-tight">
          {business?.shop_name || 'My Shop'}
        </h1>
        {business?.address && (
          <p className="text-xs text-stone-600 mt-0.5">{business.address}</p>
        )}
        <div className="flex items-center justify-center gap-4 text-xs text-stone-600 mt-1">
          {business?.phone && <span>📞 {business.phone}</span>}
          {business?.gstin && <span>GSTIN: {business.gstin}</span>}
        </div>
        <p className="text-sm font-bold mt-2 tracking-widest uppercase text-stone-800">
          {parseFloat(invoice.tax_amount) > 0 ? 'TAX INVOICE' : 'BILL / CASH MEMO'}
        </p>
      </div>

      {/* Invoice Meta + Customer Info */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
        <div className="space-y-1">
          <p><span className="font-bold">Bill To:</span></p>
          <p className="font-black text-sm">{invoice.customer_name}</p>
          {invoice.customer_phone && <p>📞 {invoice.customer_phone}</p>}
        </div>
        <div className="space-y-1 text-right">
          <p><span className="font-bold">Invoice #:</span> {invoice.invoice_number}</p>
          <p><span className="font-bold">Date:</span> {invoice.invoice_date}</p>
          {invoice.due_date && (
            <p><span className="font-bold">Due Date:</span> {invoice.due_date}</p>
          )}
          <p>
            <span className="font-bold">Status:</span>{' '}
            <span className={
              invoice.payment_status === 'paid' ? 'text-emerald-700 font-black' :
              invoice.payment_status === 'cancelled' ? 'text-stone-500 font-black' :
              'text-rose-700 font-black'
            }>
              {invoice.payment_status === 'paid' ? 'PAID' :
               invoice.payment_status === 'partially_paid' ? 'PARTIALLY PAID' :
               invoice.payment_status === 'cancelled' ? 'CANCELLED' : 'UNPAID'}
            </span>
          </p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-xs border-collapse mb-4">
        <thead>
          <tr className="border-y-2 border-stone-800 text-stone-700 font-bold uppercase">
            <th className="py-2 text-left w-8">#</th>
            <th className="py-2 text-left">Item</th>
            <th className="py-2 text-center">Qty</th>
            <th className="py-2 text-center">Unit</th>
            <th className="py-2 text-right">Rate</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, idx) => (
            <tr key={item.id} className="border-b border-stone-200">
              <td className="py-1.5">{idx + 1}</td>
              <td className="py-1.5 font-medium">{item.name}</td>
              <td className="py-1.5 text-center font-tabular">{item.quantity}</td>
              <td className="py-1.5 text-center">{item.unit}</td>
              <td className="py-1.5 text-right font-tabular">₹{item.unit_price}</td>
              <td className="py-1.5 text-right font-bold font-tabular">₹{item.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="border-t-2 border-stone-800 pt-3 space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-bold font-tabular">₹{invoice.subtotal}</span>
        </div>
        {parseFloat(invoice.discount_amount) > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span>
              Discount
              {invoice.discount_type === 'percentage' ? ` (${invoice.discount_value}%)` : ''}
            </span>
            <span className="font-bold font-tabular">- ₹{invoice.discount_amount}</span>
          </div>
        )}
        {parseFloat(invoice.tax_amount) > 0 && (
          <div className="flex justify-between">
            <span>GST ({invoice.tax_rate}%)</span>
            <span className="font-bold font-tabular">+ ₹{invoice.tax_amount}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-black border-t border-stone-300 pt-2 mt-2">
          <span>Grand Total</span>
          <span className="font-tabular">₹{invoice.total_amount}</span>
        </div>
        {parseFloat(invoice.paid_amount) > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span>Paid</span>
            <span className="font-bold font-tabular">₹{invoice.paid_amount}</span>
          </div>
        )}
        {parseFloat(invoice.balance_due) > 0 && (
          <div className="flex justify-between text-rose-700 font-black">
            <span>Balance Due</span>
            <span className="font-tabular">₹{invoice.balance_due}</span>
          </div>
        )}
      </div>

      {/* Amount in words */}
      <div className="mt-3 bg-stone-50 border border-stone-200 rounded px-3 py-2 text-[10px]">
        <span className="font-bold">Amount in words:</span> {amountWords}
      </div>

      {/* Terms & Notes */}
      {invoice.terms && (
        <div className="mt-4 text-[10px] text-stone-500">
          <p className="font-bold">Terms & Conditions:</p>
          <p>{invoice.terms}</p>
        </div>
      )}
      {invoice.notes && (
        <div className="mt-2 text-[10px] text-stone-500">
          <p className="font-bold">Notes:</p>
          <p>{invoice.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-stone-300 flex justify-between text-[10px] text-stone-400">
        <span>Generated by HisabPoint</span>
        <span>Thank you for your business!</span>
      </div>
    </div>
  );
}
