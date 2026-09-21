import type { Invoice } from '../types/invoice';
import type { BusinessProfile } from '../types';
import { formatDateFull } from './format';

// Number to words converter for Indian numbering system
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

function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatInr(val: string | number): string {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '₹0.00';
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Generate a standalone, pristine A4 paper bill HTML document.
 * This document is completely independent of the main app shell, viewport constraints,
 * responsive styles, or screen background colors.
 */
export function generateInvoiceHtml(invoice: Invoice, business?: BusinessProfile | null): string {
  const totalNum = parseFloat(invoice.total_amount) || 0;
  const taxNum = parseFloat(invoice.tax_amount) || 0;
  const taxRate = parseFloat(invoice.tax_rate) || 0;
  const discountNum = parseFloat(invoice.discount_amount) || 0;
  const subtotalNum = parseFloat(invoice.subtotal) || 0;
  const paidNum = parseFloat(invoice.paid_amount) || 0;
  const dueNum = parseFloat(invoice.balance_due) || 0;
  const amountWords = numberToWords(totalNum);

  const isTaxInvoice = taxNum > 0 || Boolean(business?.gstin && business.gstin.trim().length > 0);
  const docTitle = isTaxInvoice ? 'TAX INVOICE' : 'RETAIL INVOICE / CASH MEMO';
  const shopName = business?.shop_name?.trim() || 'HisabPoint Merchant';

  const halfTaxRate = taxRate > 0 ? (taxRate / 2).toFixed(2).replace(/\.00$/, '') : '0';
  const halfTaxAmount = taxNum > 0 ? (taxNum / 2).toFixed(2) : '0.00';

  const minRows = 8;
  const fillerCount = Math.max(0, minRows - (invoice.items?.length || 0));

  const itemsRows = (invoice.items || []).map((item, idx) => `
    <tr>
      <td class="text-center font-mono">${idx + 1}</td>
      <td class="font-medium">${escapeHtml(item.name)}</td>
      <td class="text-center font-mono text-muted">-</td>
      <td class="text-center font-bold font-mono">${item.quantity}</td>
      <td class="text-center text-muted">${escapeHtml(item.unit || 'pcs')}</td>
      <td class="text-right font-mono">${formatInr(item.unit_price)}</td>
      <td class="text-right font-bold font-mono">${formatInr(item.amount)}</td>
    </tr>
  `).join('');

  const fillerRows = Array.from({ length: fillerCount }).map(() => `
    <tr class="filler-row">
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
    </tr>
  `).join('');

  const paymentStatusClass = invoice.payment_status === 'paid'
    ? 'status-paid'
    : invoice.payment_status === 'partially_paid'
    ? 'status-partial'
    : invoice.payment_status === 'cancelled'
    ? 'status-cancelled'
    : 'status-unpaid';

  const statusLabel = invoice.payment_status === 'paid'
    ? 'PAID'
    : invoice.payment_status === 'partially_paid'
    ? 'PARTIALLY PAID'
    : invoice.payment_status === 'cancelled'
    ? 'CANCELLED'
    : 'UNPAID';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice_${escapeHtml(invoice.invoice_number)}_${escapeHtml(invoice.customer_name.replace(/\s+/g, '_'))}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      background: #ffffff !important;
      color: #0f172a !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .a4-paper-container {
      width: 100%;
      max-width: 190mm;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid #0f172a;
      padding: 6mm 8mm;
    }

    /* Header */
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 700;
      color: #475569;
      margin-bottom: 6px;
    }

    .tag-original {
      border: 1px solid #64748b;
      padding: 2px 6px;
      border-radius: 3px;
      background: #f8fafc;
      color: #0f172a;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }

    .shop-info {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .shop-logo {
      width: 56px;
      height: 56px;
      object-fit: contain;
      border: 1px solid #cbd5e1;
      padding: 2px;
      border-radius: 4px;
    }

    .shop-avatar {
      width: 50px;
      height: 50px;
      background: #0f172a;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 900;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .shop-name {
      font-size: 18px;
      font-weight: 900;
      color: #020617;
      text-transform: uppercase;
      letter-spacing: -0.3px;
      margin-bottom: 2px;
    }

    .shop-meta {
      font-size: 10px;
      color: #334155;
      line-height: 1.35;
      max-width: 320px;
    }

    .gstin-pill {
      display: inline-block;
      margin-top: 3px;
      padding: 1px 6px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 3px;
      font-weight: 700;
      font-family: monospace;
      font-size: 10px;
      color: #0f172a;
    }

    .doc-title-block {
      text-align: right;
    }

    .doc-title {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 3px;
      display: inline-block;
    }

    .doc-subtitle {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      margin-top: 4px;
    }

    /* 2-Column Meta Grid */
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border: 1px solid #0f172a;
      margin-bottom: 10px;
    }

    .meta-box {
      padding: 8px 10px;
      font-size: 10.5px;
    }

    .meta-box:first-child {
      border-right: 1px solid #0f172a;
      background: #fafafa;
    }

    .meta-box:last-child {
      background: #fafafa;
    }

    .box-heading {
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
      margin-bottom: 4px;
    }

    .buyer-name {
      font-size: 12px;
      font-weight: 800;
      color: #020617;
      margin-bottom: 2px;
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }

    .meta-label {
      font-weight: 600;
      color: #475569;
    }

    .meta-value {
      font-weight: 700;
      color: #0f172a;
    }

    .status-badge {
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: 800;
      border: 1px solid transparent;
    }

    .status-paid {
      background: #dcfce7;
      border-color: #86efac;
      color: #14532d;
    }

    .status-unpaid {
      background: #ffe4e6;
      border-color: #fda4af;
      color: #881337;
    }

    .status-partial {
      background: #fef3c7;
      border-color: #fde68a;
      color: #78350f;
    }

    .status-cancelled {
      background: #e2e8f0;
      border-color: #cbd5e1;
      color: #334155;
    }

    /* Items Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #0f172a;
      margin-bottom: 10px;
    }

    .items-table th, .items-table td {
      border: 1px solid #0f172a;
      padding: 5px 6px;
      font-size: 10px;
    }

    .items-table th {
      background: #f1f5f9;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1e293b;
      font-size: 9px;
    }

    .filler-row td {
      height: 22px;
    }

    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .font-bold { font-weight: 700; }
    .font-medium { font-weight: 600; }
    .text-muted { color: #64748b; }

    /* Summary Grid */
    .summary-grid {
      display: grid;
      grid-template-columns: 7fr 5fr;
      border: 1px solid #0f172a;
      margin-bottom: 10px;
    }

    .summary-left {
      padding: 8px 10px;
      border-right: 1px solid #0f172a;
      display: flex;
      flex-col;
      flex-direction: column;
      justify-content: space-between;
      gap: 8px;
    }

    .summary-right {
      padding: 8px 10px;
      background: #fafafa;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .words-box {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      border-radius: 3px;
      background: #f8fafc;
    }

    .words-label {
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      color: #64748b;
      display: block;
      margin-bottom: 2px;
    }

    .words-text {
      font-weight: 800;
      font-size: 10px;
      color: #0f172a;
    }

    .tax-breakdown {
      border: 1px solid #cbd5e1;
      border-radius: 3px;
      overflow: hidden;
      font-size: 9px;
    }

    .tax-breakdown-header {
      background: #f1f5f9;
      padding: 3px 6px;
      font-weight: 700;
      border-bottom: 1px solid #cbd5e1;
      color: #334155;
    }

    .tax-breakdown-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 6px;
    }

    .upi-box {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      border-radius: 3px;
      font-size: 9.5px;
      color: #334155;
      background: #ffffff;
    }

    .upi-box-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 9px;
      color: #1e293b;
      margin-bottom: 2px;
    }

    .upi-badge {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      font-size: 8px;
      padding: 1px 4px;
      border-radius: 2px;
    }

    .terms-box {
      font-size: 8.5px;
      color: #64748b;
      line-height: 1.35;
    }

    .terms-title {
      font-weight: 800;
      text-transform: uppercase;
      color: #334155;
      margin-bottom: 2px;
    }

    .terms-box ol {
      padding-left: 14px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2px 0;
      font-size: 10.5px;
    }

    .totals-grand {
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
      background: #e2e8f0;
      padding: 6px 6px;
      margin: 6px 0;
      font-weight: 900;
      font-size: 12px;
      color: #020617;
    }

    .due-row {
      border-top: 1px dashed #fca5a5;
      padding-top: 4px;
      margin-top: 4px;
      color: #991b1b;
      font-weight: 900;
    }

    /* Signatures */
    .signatures-block {
      border-top: 2px solid #0f172a;
      padding-top: 8px;
      margin-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .disclaimer-block {
      max-width: 280px;
      font-size: 8.5px;
      color: #64748b;
      line-height: 1.35;
    }

    .sig-box {
      text-align: center;
      min-width: 160px;
    }

    .sig-for {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 32px;
      color: #0f172a;
    }

    .sig-line {
      border-bottom: 1px solid #64748b;
      width: 140px;
      margin: 0 auto 3px auto;
    }

    .sig-title {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      color: #475569;
    }

    /* Bottom Page Meta */
    .page-footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 4px;
      margin-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      color: #94a3b8;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="a4-paper-container">
    <!-- Top Bar -->
    <div class="top-bar">
      <span>HisabPoint Smart Billing System</span>
      <span class="tag-original">Original For Recipient</span>
    </div>

    <!-- Header Content -->
    <div class="header-content">
      <div class="shop-info">
        ${business?.logo ? `
          <img src="${escapeHtml(business.logo)}" alt="${escapeHtml(shopName)}" class="shop-logo" />
        ` : `
          <div class="shop-avatar">${escapeHtml(shopName.charAt(0).toUpperCase())}</div>
        `}
        <div>
          <h1 class="shop-name">${escapeHtml(shopName)}</h1>
          ${business?.owner_name ? `<p class="shop-meta font-bold">Prop: ${escapeHtml(business.owner_name)}</p>` : ''}
          ${business?.address ? `<p class="shop-meta">${escapeHtml(business.address)}</p>` : ''}
          <p class="shop-meta font-mono">
            ${business?.phone ? `Phone: +91 ${escapeHtml(business.phone)}` : ''}
          </p>
          ${business?.gstin ? `<span class="gstin-pill">GSTIN: ${escapeHtml(business.gstin)}</span>` : ''}
        </div>
      </div>

      <div class="doc-title-block">
        <h2 class="doc-title">${escapeHtml(docTitle)}</h2>
        <p class="doc-subtitle">Computer Generated Bill</p>
      </div>
    </div>

    <!-- 2-Column Meta Grid -->
    <div class="meta-grid">
      <div class="meta-box">
        <div class="box-heading">Billed To / Buyer Details</div>
        <div class="buyer-name">${escapeHtml(invoice.customer_name)}</div>
        ${invoice.customer_address ? `
          <p class="shop-meta" style="margin-bottom: 2px;">${escapeHtml(invoice.customer_address)}</p>
        ` : `
          <p class="shop-meta text-muted" style="font-style: italic; margin-bottom: 2px;">Counter Sale / Walk-in Customer</p>
        `}
        ${invoice.customer_phone ? `
          <p class="shop-meta font-mono">Phone: ${escapeHtml(invoice.customer_phone)}</p>
        ` : ''}
        <p class="shop-meta" style="margin-top: 3px;">
          Place of Supply: <strong>Local (Within State)</strong>
        </p>
      </div>

      <div class="meta-box">
        <div class="box-heading">Invoice Particulars</div>
        <div class="meta-row">
          <span class="meta-label">Invoice No:</span>
          <span class="meta-value font-mono">${escapeHtml(invoice.invoice_number)}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Invoice Date:</span>
          <span class="meta-value">${escapeHtml(formatDateFull(invoice.invoice_date))}</span>
        </div>
        ${invoice.due_date ? `
          <div class="meta-row">
            <span class="meta-label">Due Date:</span>
            <span class="meta-value">${escapeHtml(formatDateFull(invoice.due_date))}</span>
          </div>
        ` : ''}
        <div class="meta-row">
          <span class="meta-label">Payment Mode:</span>
          <span class="meta-value" style="text-transform: uppercase;">${invoice.payment_mode === 'credit' ? 'Credit (Udhar)' : escapeHtml(invoice.payment_mode)}</span>
        </div>
        <div class="meta-row" style="margin-top: 3px;">
          <span class="meta-label">Payment Status:</span>
          <span class="status-badge ${paymentStatusClass}">${statusLabel}</span>
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 28px;" class="text-center">#</th>
          <th class="text-left">Description of Goods / Services</th>
          <th style="width: 55px;" class="text-center">HSN/SAC</th>
          <th style="width: 45px;" class="text-center">Qty</th>
          <th style="width: 45px;" class="text-center">Unit</th>
          <th style="width: 70px;" class="text-right">Rate (₹)</th>
          <th style="width: 80px;" class="text-right">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
        ${fillerRows}
      </tbody>
    </table>

    <!-- Summary Grid -->
    <div class="summary-grid">
      <!-- Left Column -->
      <div class="summary-left">
        <div class="words-box">
          <span class="words-label">Amount Chargeable in Words:</span>
          <span class="words-text">${escapeHtml(amountWords)}</span>
        </div>

        ${taxNum > 0 ? `
          <div class="tax-breakdown">
            <div class="tax-breakdown-header">Intra-State GST Breakdown</div>
            <div class="tax-breakdown-row">
              <span>CGST (${escapeHtml(halfTaxRate)}%): <strong>₹${halfTaxAmount}</strong></span>
              <span>SGST (${escapeHtml(halfTaxRate)}%): <strong>₹${halfTaxAmount}</strong></span>
              <span>Total Tax: <strong>₹${escapeHtml(invoice.tax_amount)}</strong></span>
            </div>
          </div>
        ` : ''}

        <div class="upi-box">
          <div class="upi-box-header">
            <span>Scan & Pay via UPI</span>
            <span class="upi-badge">Instant Settlement</span>
          </div>
          <p>UPI ID: <strong class="font-mono">${escapeHtml(business?.phone ? `${business.phone}@upi` : `${shopName.replace(/\s+/g, '').toLowerCase()}@upi`)}</strong></p>
          <p style="font-size: 8px; color: #64748b; margin-top: 1px;">Google Pay • PhonePe • Paytm • BHIM UPI</p>
        </div>

        <div class="terms-box">
          <p class="terms-title">Terms & Conditions:</p>
          <ol>
            <li>${escapeHtml(invoice.terms || 'Goods once sold will not be accepted back or exchanged.')}</li>
            <li>Subject to local jurisdiction only. E. & O.E.</li>
          </ol>
          ${invoice.notes ? `
            <p style="margin-top: 3px; font-weight: 600; color: #334155;">Note: ${escapeHtml(invoice.notes)}</p>
          ` : ''}
        </div>
      </div>

      <!-- Right Column -->
      <div class="summary-right">
        <div>
          <div class="totals-row">
            <span class="text-muted">Subtotal (Taxable):</span>
            <span class="font-mono font-bold">${formatInr(subtotalNum)}</span>
          </div>

          ${discountNum > 0 ? `
            <div class="totals-row" style="color: #047857;">
              <span>Discount ${invoice.discount_type === 'percentage' ? `(${invoice.discount_value}%)` : ''}:</span>
              <span class="font-mono font-bold">- ${formatInr(discountNum)}</span>
            </div>
          ` : ''}

          ${taxNum > 0 ? `
            <div class="totals-row">
              <span class="text-muted">GST (${escapeHtml(invoice.tax_rate)}%):</span>
              <span class="font-mono font-bold">+ ${formatInr(taxNum)}</span>
            </div>
          ` : ''}

          <div class="totals-row totals-grand">
            <span>GRAND TOTAL:</span>
            <span class="font-mono">${formatInr(totalNum)}</span>
          </div>

          ${paidNum > 0 ? `
            <div class="totals-row" style="color: #065f46;">
              <span>Amount Received / Paid:</span>
              <span class="font-mono font-bold">${formatInr(paidNum)}</span>
            </div>
          ` : ''}

          ${dueNum > 0 ? `
            <div class="totals-row due-row">
              <span>BALANCE DUE (UDHAR):</span>
              <span class="font-mono">${formatInr(dueNum)}</span>
            </div>
          ` : `
            <div class="text-right" style="color: #059669; font-weight: 800; font-size: 9.5px; margin-top: 4px;">
              ✓ Full Payment Received
            </div>
          `}
        </div>

        <div style="border-top: 1px solid #cbd5e1; padding-top: 4px; text-align: center; margin-top: 6px;">
          <span style="font-size: 8.5px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-family: monospace;">
            HisabPoint Ledger Verified
          </span>
        </div>
      </div>
    </div>

    <!-- Signatures Block -->
    <div class="signatures-block">
      <div class="disclaimer-block">
        <p style="font-style: italic;">"Certified that the particulars given above are true and correct."</p>
        <p style="margin-top: 2px;">This is a computer generated invoice and does not require a physical signature.</p>
      </div>

      <div class="sig-box">
        <p class="sig-for">For ${escapeHtml(shopName)}</p>
        <div class="sig-line"></div>
        <p class="sig-title">Authorized Signatory</p>
      </div>
    </div>

    <!-- Page Footer -->
    <div class="page-footer">
      <span>Page 1 of 1</span>
      <span>Generated by HisabPoint • ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
      <span>Thank you for your business!</span>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Trigger an isolated, clean print dialog specifically for the A4 bill.
 * Creates an invisible iframe to completely bypass the main window's screen layout,
 * viewport meta tags, dark mode, navigation, and margins.
 * When the user selects "Save as PDF", the browser outputs a pure, clean, vector A4 PDF.
 */
export function printInvoiceDirect(invoice: Invoice, business?: BusinessProfile | null): void {
  const html = generateInvoiceHtml(invoice, business);

  // Remove existing print iframe if any
  const existingFrame = document.getElementById('hisabpoint-invoice-print-frame');
  if (existingFrame && existingFrame.parentNode) {
    existingFrame.parentNode.removeChild(existingFrame);
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'hisabpoint-invoice-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    // Fallback to window.print if iframe document is unavailable
    window.print();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  // Wait for images (e.g. logo) and fonts to settle before printing
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn('Iframe print failed, falling back to window.print', e);
      window.print();
    } finally {
      // Remove iframe after print dialog completes
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 2000);
    }
  }, 250);
}
