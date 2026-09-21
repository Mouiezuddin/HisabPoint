import React from 'react';
import type { Invoice } from '../../types/invoice';
import type { BusinessProfile } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';

// Number to words for amount in Indian numbering system
function numberToWords(num: number): string {
  if (num <= 0) return 'Zero Rupees Only';
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
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
  const taxNum = parseFloat(invoice.tax_amount) || 0;
  const taxRate = parseFloat(invoice.tax_rate) || 0;
  const discountNum = parseFloat(invoice.discount_amount) || 0;
  const subtotalNum = parseFloat(invoice.subtotal) || 0;
  const paidNum = parseFloat(invoice.paid_amount) || 0;
  const dueNum = parseFloat(invoice.balance_due) || 0;
  const amountWords = numberToWords(totalNum);

  const isTaxInvoice = taxNum > 0 || (business?.gstin && business.gstin.trim().length > 0);
  const docTitle = isTaxInvoice ? 'TAX INVOICE' : 'RETAIL INVOICE / CASH MEMO';
  const shopName = business?.shop_name?.trim() || 'HisabPoint Merchant';

  // Calculate half rates for CGST + SGST (intra-state default for retail)
  const halfTaxRate = taxRate > 0 ? (taxRate / 2).toFixed(2).replace(/\.00$/, '') : '0';
  const halfTaxAmount = taxNum > 0 ? (taxNum / 2).toFixed(2) : '0.00';

  // Minimum rows to fill the A4 table for authentic computer-generated aesthetic
  const minRows = 6;
  const fillerCount = Math.max(0, minRows - (invoice.items?.length || 0));

  return (
    <div
      className="a4-bill-sheet bg-white text-stone-900 border-2 border-stone-800 p-6 sm:p-8 font-sans mx-auto text-xs leading-relaxed select-text"
      id="printable-invoice"
      style={{ minHeight: '265mm' }}
    >
      {/* Top Banner: Copy marker & Document Type */}
      <div className="border-b-2 border-stone-800 pb-3 mb-3">
        <div className="flex justify-between items-center text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-1">
          <span>HisabPoint Smart Billing System</span>
          <span className="border border-stone-400 px-2 py-0.5 rounded text-stone-700 bg-stone-50">
            Original For Recipient
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
          {/* Shop Branding */}
          <div className="flex items-center gap-3 text-left">
            {business?.logo ? (
              <img
                src={business.logo}
                alt={shopName}
                className="w-16 h-16 object-contain rounded border border-stone-300 p-1"
              />
            ) : (
              <div className="w-14 h-14 rounded bg-stone-900 text-white flex items-center justify-center font-serif font-black text-2xl tracking-tighter">
                {shopName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-black font-serif tracking-tight text-stone-950 uppercase">
                {shopName}
              </h1>
              {business?.owner_name && (
                <p className="text-[11px] font-semibold text-stone-700">Prop: {business.owner_name}</p>
              )}
              {business?.address && (
                <p className="text-[11px] text-stone-600 max-w-md">{business.address}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-stone-700 mt-0.5 font-mono">
                {business?.phone && <span>📞 +91 {business.phone}</span>}
                {business?.gstin && (
                  <span className="font-bold text-stone-900 bg-stone-100 px-1.5 py-0.5 border border-stone-300 rounded text-[10px]">
                    GSTIN: {business.gstin}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Title Badge */}
          <div className="text-center sm:text-right">
            <h2 className="text-lg sm:text-xl font-black tracking-wider uppercase text-stone-900 border-b-2 border-stone-900 pb-1 inline-block">
              {docTitle}
            </h2>
            <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-1">Computer Generated</p>
          </div>
        </div>
      </div>

      {/* 2-Column Framed Grid: Buyer (Customer) & Invoice Details */}
      <div className="grid grid-cols-2 border border-stone-800 mb-4 divide-x divide-stone-800">
        {/* Left Box: Buyer / Billed To */}
        <div className="p-3 space-y-1 bg-stone-50/40">
          <div className="text-[10px] font-black uppercase text-stone-500 tracking-wider">
            Billed To / Buyer Details
          </div>
          <p className="font-bold text-sm text-stone-950">{invoice.customer_name}</p>
          {invoice.customer_address ? (
            <p className="text-[11px] text-stone-600 leading-snug">{invoice.customer_address}</p>
          ) : (
            <p className="text-[11px] text-stone-400 italic">Walk-in Customer / Counter Sale</p>
          )}
          {invoice.customer_phone && (
            <p className="text-[11px] font-mono text-stone-700">📞 {invoice.customer_phone}</p>
          )}
          <p className="text-[10px] text-stone-500 pt-1">
            Place of Supply: <span className="font-semibold text-stone-700">Local (Within State)</span>
          </p>
        </div>

        {/* Right Box: Invoice Meta */}
        <div className="p-3 space-y-1 bg-stone-50/40">
          <div className="text-[10px] font-black uppercase text-stone-500 tracking-wider">
            Invoice Particulars
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-semibold text-stone-600">Invoice No:</span>
            <span className="font-mono font-black text-stone-950 text-xs">{invoice.invoice_number}</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-semibold text-stone-600">Invoice Date:</span>
            <span className="font-semibold text-stone-900">{formatDate(invoice.invoice_date)}</span>
          </div>
          {invoice.due_date && (
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-semibold text-stone-600">Due Date:</span>
              <span className="font-semibold text-stone-900">{formatDate(invoice.due_date)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-semibold text-stone-600">Payment Mode:</span>
            <span className="font-bold uppercase text-stone-800">
              {invoice.payment_mode === 'credit' ? 'Credit (Udhar)' : invoice.payment_mode}
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px] pt-1">
            <span className="font-semibold text-stone-600">Payment Status:</span>
            <span
              className={`font-black text-[10px] px-2 py-0.5 rounded border ${
                invoice.payment_status === 'paid'
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                  : invoice.payment_status === 'partially_paid'
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : invoice.payment_status === 'cancelled'
                  ? 'bg-stone-200 border-stone-400 text-stone-700'
                  : 'bg-rose-100 border-rose-300 text-rose-900'
              }`}
            >
              {invoice.payment_status === 'paid'
                ? 'PAID'
                : invoice.payment_status === 'partially_paid'
                ? 'PARTIALLY PAID'
                : invoice.payment_status === 'cancelled'
                ? 'CANCELLED'
                : 'UNPAID'}
            </span>
          </div>
        </div>
      </div>

      {/* Items Table with Full Borders */}
      <table className="w-full text-xs border-collapse border border-stone-800 mb-4">
        <thead>
          <tr className="bg-stone-100 border-b border-stone-800 text-stone-800 font-bold uppercase text-[10px] tracking-wider">
            <th className="py-2 px-2 border-r border-stone-800 text-center w-8">#</th>
            <th className="py-2 px-3 border-r border-stone-800 text-left">Description of Goods / Services</th>
            <th className="py-2 px-2 border-r border-stone-800 text-center w-16">HSN/SAC</th>
            <th className="py-2 px-2 border-r border-stone-800 text-center w-14">Qty</th>
            <th className="py-2 px-2 border-r border-stone-800 text-center w-14">Unit</th>
            <th className="py-2 px-2 border-r border-stone-800 text-right w-20">Rate (₹)</th>
            <th className="py-2 px-3 border-stone-800 text-right w-24">Amount (₹)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-300">
          {invoice.items.map((item, idx) => (
            <tr key={item.id} className="hover:bg-stone-50/50">
              <td className="py-2 px-2 border-r border-stone-800 text-center font-mono text-stone-500">
                {idx + 1}
              </td>
              <td className="py-2 px-3 border-r border-stone-800 font-medium text-stone-900">
                {item.name}
              </td>
              <td className="py-2 px-2 border-r border-stone-800 text-center font-mono text-stone-500 text-[10px]">
                -
              </td>
              <td className="py-2 px-2 border-r border-stone-800 text-center font-bold font-mono">
                {item.quantity}
              </td>
              <td className="py-2 px-2 border-r border-stone-800 text-center text-stone-600 text-[11px]">
                {item.unit || 'pcs'}
              </td>
              <td className="py-2 px-2 border-r border-stone-800 text-right font-mono">
                {formatCurrency(item.unit_price)}
              </td>
              <td className="py-2 px-3 border-stone-800 text-right font-bold font-mono text-stone-950">
                {formatCurrency(item.amount)}
              </td>
            </tr>
          ))}

          {/* Spacer rows for classical pre-printed computer invoice proportion */}
          {Array.from({ length: fillerCount }).map((_, i) => (
            <tr key={`filler-${i}`} className="h-7">
              <td className="border-r border-stone-800"></td>
              <td className="border-r border-stone-800"></td>
              <td className="border-r border-stone-800"></td>
              <td className="border-r border-stone-800"></td>
              <td className="border-r border-stone-800"></td>
              <td className="border-r border-stone-800"></td>
              <td className="border-stone-800"></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary, Totals, Amount In Words & Terms */}
      <div className="grid grid-cols-12 border border-stone-800 mb-4 divide-x divide-stone-800">
        {/* Left Column (7 cols): Words, Terms, Bank/UPI, Notes */}
        <div className="col-span-7 p-3 flex flex-col justify-between space-y-3 bg-stone-50/20">
          {/* Amount In Words */}
          <div className="border border-stone-300 rounded p-2 bg-stone-50/80">
            <span className="text-[10px] font-black uppercase text-stone-500 block mb-0.5">
              Amount Chargeable (in words):
            </span>
            <p className="font-bold text-[11px] text-stone-900 leading-snug">{amountWords}</p>
          </div>

          {/* Tax Breakdown Table if tax > 0 */}
          {taxNum > 0 && (
            <div className="border border-stone-300 rounded overflow-hidden">
              <div className="bg-stone-100 px-2 py-1 text-[10px] font-bold text-stone-700 border-b border-stone-300">
                Tax Breakdown (Intra-State GST)
              </div>
              <div className="grid grid-cols-3 text-[10px] p-1.5 gap-1">
                <div>
                  <span className="text-stone-500 block">CGST ({halfTaxRate}%):</span>
                  <span className="font-mono font-semibold">₹{halfTaxAmount}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">SGST ({halfTaxRate}%):</span>
                  <span className="font-mono font-semibold">₹{halfTaxAmount}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Total GST ({taxRate}%):</span>
                  <span className="font-mono font-bold text-stone-900">₹{invoice.tax_amount}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Details / UPI */}
          <div className="border border-stone-300 rounded p-2 text-[10px] text-stone-600 bg-white">
            <div className="flex justify-between items-center mb-1">
              <span className="font-black uppercase text-stone-700">Payment / UPI Details</span>
              <span className="text-[9px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Instant Settlement
              </span>
            </div>
            <p>
              UPI ID: <span className="font-mono font-bold text-stone-900">{business?.phone ? `${business.phone}@upi` : `${shopName.replace(/\s+/g, '').toLowerCase()}@upi`}</span>
            </p>
            <p className="text-stone-500 text-[9px] mt-0.5">
              Scan & Pay using Google Pay, PhonePe, Paytm, BHIM or any UPI app.
            </p>
          </div>

          {/* Terms & Notes */}
          <div className="text-[10px] text-stone-500 space-y-1">
            <p className="font-bold text-stone-700 uppercase tracking-wider text-[9px]">Terms & Conditions:</p>
            <ul className="list-decimal list-inside space-y-0.5 text-[9px] leading-tight text-stone-600">
              <li>{invoice.terms || 'Goods once sold will not be taken back or exchanged.'}</li>
              <li>Interest @ 18% p.a. will be levied if payment is not received on due date.</li>
              <li>Subject to local jurisdiction only. E. & O.E.</li>
            </ul>
            {invoice.notes && (
              <p className="text-[10px] text-stone-700 bg-amber-50/80 p-1.5 rounded border border-amber-200 mt-1">
                <span className="font-bold">Note:</span> {invoice.notes}
              </p>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Numerical Totals Breakdown */}
        <div className="col-span-5 p-3 flex flex-col justify-between bg-stone-50/40">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-stone-600">
              <span>Subtotal (Taxable):</span>
              <span className="font-mono font-bold text-stone-900">{formatCurrency(subtotalNum)}</span>
            </div>

            {discountNum > 0 && (
              <div className="flex justify-between items-center text-emerald-700">
                <span>
                  Discount
                  {invoice.discount_type === 'percentage' ? ` (${invoice.discount_value}%)` : ''}:
                </span>
                <span className="font-mono font-bold">- {formatCurrency(discountNum)}</span>
              </div>
            )}

            {taxNum > 0 && (
              <div className="flex justify-between items-center text-stone-600">
                <span>GST ({taxRate}%):</span>
                <span className="font-mono font-bold text-stone-900">+ {formatCurrency(taxNum)}</span>
              </div>
            )}

            <div className="border-t-2 border-stone-800 pt-2 mt-2">
              <div className="flex justify-between items-center bg-stone-200/80 p-2 rounded border border-stone-400">
                <span className="font-serif font-black text-sm text-stone-950 uppercase">Grand Total:</span>
                <span className="font-serif font-black text-base text-stone-950 font-mono">
                  {formatCurrency(totalNum)}
                </span>
              </div>
            </div>

            {paidNum > 0 && (
              <div className="flex justify-between items-center text-emerald-800 pt-1 text-[11px]">
                <span className="font-semibold">Amount Received / Paid:</span>
                <span className="font-mono font-bold">{formatCurrency(paidNum)}</span>
              </div>
            )}

            {dueNum > 0 ? (
              <div className="flex justify-between items-center text-rose-800 pt-1 border-t border-dashed border-rose-200 text-xs">
                <span className="font-black uppercase">Balance Due (Udhar):</span>
                <span className="font-mono font-black text-sm">{formatCurrency(dueNum)}</span>
              </div>
            ) : (
              <div className="text-right text-[10px] text-emerald-700 font-black uppercase pt-1">
                ✓ Full Payment Received
              </div>
            )}
          </div>

          {/* Computer Generated Invoice Disclaimer & Watermark */}
          <div className="mt-4 pt-3 border-t border-stone-300 text-center">
            <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block">
              HisabPoint Ledger Verified
            </span>
          </div>
        </div>
      </div>

      {/* Footer Signatures */}
      <div className="border-t-2 border-stone-800 pt-3 mt-4 flex justify-between items-end text-xs">
        <div className="max-w-xs space-y-1">
          <p className="text-[10px] text-stone-500 font-serif italic">
            "Certified that the particulars given above are true and correct."
          </p>
          <p className="text-[9px] text-stone-400">
            This is a computer generated invoice and does not require a physical signature.
          </p>
        </div>

        <div className="text-center min-w-[180px]">
          <p className="text-[11px] font-bold text-stone-800 uppercase mb-8">
            For {shopName}
          </p>
          <div className="border-b border-stone-400 mb-1 w-36 mx-auto"></div>
          <span className="text-[10px] font-bold text-stone-600 block uppercase">
            Authorized Signatory
          </span>
        </div>
      </div>

      {/* Page End Line */}
      <div className="mt-4 pt-2 border-t border-stone-300 flex justify-between text-[9px] text-stone-400 font-mono">
        <span>Page 1 of 1</span>
        <span>Generated by HisabPoint • {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        <span>Thank you for your business!</span>
      </div>
    </div>
  );
}
