import type { Customer, Transaction, BusinessProfile } from '../types';
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
 * Generate a standalone, pristine A4 paper Khata Statement HTML document.
 * Completely isolated from any screen UI, modals, or background elements.
 */
export function generateKhataStatementHtml(
  customer: Customer,
  transactions: Transaction[],
  business?: BusinessProfile | null,
  range: string = 'all',
  shopNameOverride?: string
): string {
  const shopName = business?.shop_name?.trim() || shopNameOverride || 'HisabPoint Merchant';
  const balanceNum = parseFloat(customer.balance) || 0;
  const isDue = customer.balance_status === 'due' && balanceNum > 0;
  const amountWords = numberToWords(balanceNum);

  // Filter valid transactions
  const validTxns = (transactions || []).filter((t) => !t.is_reversed && t.type !== 'reversal');

  let filteredTxns = validTxns;
  if (range === 'last5') filteredTxns = validTxns.slice(0, 5);
  else if (range === 'last10') filteredTxns = validTxns.slice(0, 10);
  else if (range === 'month') {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    filteredTxns = validTxns.filter((t) => t.transaction_date.startsWith(currentMonth));
  }

  let totalGiven = 0;
  let totalPaid = 0;
  filteredTxns.forEach((t) => {
    const amt = parseFloat(t.amount) || 0;
    if (t.type === 'credit') totalGiven += amt;
    else if (t.type === 'payment') totalPaid += amt;
  });

  const rangeLabel = range === 'last5' ? 'Last 5 Transactions' : range === 'last10' ? 'Last 10 Transactions' : range === 'month' ? 'This Month' : 'Full Account History';

  const rowsHtml = filteredTxns.length === 0 ? `
    <tr>
      <td colspan="4" style="text-align: center; padding: 18px; color: #64748b; font-style: italic;">
        No transactions recorded in this period.
      </td>
    </tr>
  ` : filteredTxns.map((t) => {
    const isCredit = t.type === 'credit';
    return `
      <tr>
        <td class="font-mono" style="white-space: nowrap;">${escapeHtml(t.transaction_date)}</td>
        <td class="font-medium">${escapeHtml(t.description || (isCredit ? 'Credit Entry' : 'Payment Received'))}</td>
        <td class="text-right font-mono font-bold" style="color: ${isCredit ? '#b91c1c' : '#64748b'};">
          ${isCredit ? formatInr(t.amount) : '-'}
        </td>
        <td class="text-right font-mono font-bold" style="color: ${!isCredit ? '#047857' : '#64748b'};">
          ${!isCredit ? formatInr(t.amount) : '-'}
        </td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Khata_Statement_${escapeHtml(customer.name.replace(/\\s+/g, '_'))}_${new Date().toISOString().split('T')[0]}</title>
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

    /* Interactive toolbar visible only on screen */
    .screen-toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #1e293b;
      color: #ffffff;
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      margin-bottom: 16px;
    }

    .screen-toolbar .btn-print {
      background: #059669;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .screen-toolbar .btn-close {
      background: #475569;
      color: #ffffff;
      border: none;
      padding: 8px 14px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
    }

    @media print {
      .no-print {
        display: none !important;
      }
      body {
        padding: 0 !important;
      }
      .a4-paper-container {
        border: 2px solid #0f172a !important;
        box-shadow: none !important;
        margin: 0 !important;
        max-width: 100% !important;
      }
    }

    .a4-paper-container {
      width: 100%;
      max-width: 190mm;
      margin: 12px auto;
      background: #ffffff;
      border: 2px solid #0f172a;
      padding: 8mm 10mm;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
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
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
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

    .shop-avatar {
      width: 48px;
      height: 48px;
      background: #0f172a;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 900;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .shop-logo {
      width: 52px;
      height: 52px;
      object-fit: contain;
      border: 1px solid #cbd5e1;
      padding: 2px;
      border-radius: 4px;
    }

    .shop-name {
      font-size: 20px;
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
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 2px;
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
      font-size: 13px;
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

    /* Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #0f172a;
      margin-bottom: 10px;
    }

    .items-table th, .items-table td {
      border: 1px solid #0f172a;
      padding: 6px 8px;
      font-size: 10.5px;
    }

    .items-table th {
      background: #f1f5f9;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1e293b;
      font-size: 9.5px;
    }

    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .font-bold { font-weight: 700; }
    .font-medium { font-weight: 600; }

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
      flex-direction: column;
      justify-content: space-between;
      gap: 8px;
      background: #ffffff;
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
      font-size: 10.5px;
      color: #0f172a;
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
      padding: 6px;
      margin: 6px 0;
      font-weight: 900;
      font-size: 12px;
      color: #020617;
    }

    .due-highlight {
      color: #991b1b;
      font-weight: 900;
    }

    .settled-badge {
      color: #059669;
      font-weight: 800;
      font-size: 10px;
      text-align: right;
      padding-top: 4px;
    }

    /* Signatures */
    .signatures-block {
      border-top: 2px solid #0f172a;
      padding-top: 10px;
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .disclaimer-block {
      max-width: 300px;
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
      margin-bottom: 30px;
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
  <!-- Screen-Only Toolbar for Browsers / Mobile Devices -->
  <div class="screen-toolbar no-print">
    <div>
      <strong>Khata Statement Preview</strong> — ${escapeHtml(customer.name)}
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn-print" onclick="window.print()">
        <span>🖨️ Save as PDF / Print</span>
      </button>
      <button class="btn-close" onclick="window.close()">✕ Close</button>
    </div>
  </div>

  <div class="a4-paper-container">
    <!-- Top Bar -->
    <div class="top-bar">
      <span>HisabPoint Digital Bahi Khata</span>
      <span>Official Account Statement</span>
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
        <h2 class="doc-title">KHATA ACCOUNT STATEMENT</h2>
        <p class="doc-subtitle">Customer Ledger Bill</p>
      </div>
    </div>

    <!-- 2-Column Meta Grid -->
    <div class="meta-grid">
      <div class="meta-box">
        <div class="box-heading">CUSTOMER DETAILS</div>
        <div class="buyer-name">${escapeHtml(customer.name)}</div>
        ${customer.phone ? `<p class="shop-meta font-mono">Phone: ${escapeHtml(customer.phone)}</p>` : ''}
        ${customer.address ? `<p class="shop-meta">${escapeHtml(customer.address)}</p>` : ''}
      </div>

      <div class="meta-box">
        <div class="box-heading">STATEMENT DETAILS</div>
        <div class="meta-row">
          <span class="meta-label">Date:</span>
          <span class="meta-value">${escapeHtml(formatDateFull(new Date().toISOString().split('T')[0]))}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Period / Filter:</span>
          <span class="meta-value">${escapeHtml(rangeLabel)}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Total Entries:</span>
          <span class="meta-value font-mono">${filteredTxns.length}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Account Status:</span>
          <span class="meta-value ${isDue ? 'due-highlight' : ''}">
            ${isDue ? 'DUE (PENDING)' : 'SETTLED'}
          </span>
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 85px;" class="text-left">Date</th>
          <th class="text-left">Particulars / Description</th>
          <th style="width: 100px;" class="text-right">Credit (Given)</th>
          <th style="width: 100px;" class="text-right">Payment (Paid)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <!-- Summary Grid -->
    <div class="summary-grid">
      <div class="summary-left">
        <div class="words-box">
          <span class="words-label">Outstanding Balance in Words:</span>
          <span class="words-text">${escapeHtml(amountWords)}</span>
        </div>

        <div class="upi-box">
          <div class="upi-box-header">
            <span>Settle via UPI</span>
            <span class="upi-badge">Instant Settlement</span>
          </div>
          <p>UPI ID: <strong class="font-mono">${escapeHtml(business?.phone ? `${business.phone}@upi` : `${shopName.replace(/\\s+/g, '').toLowerCase()}@upi`)}</strong></p>
          <p style="font-size: 8px; color: #64748b; margin-top: 1px;">Google Pay • PhonePe • Paytm • BHIM UPI</p>
        </div>
      </div>

      <div class="summary-right">
        <div>
          <div class="totals-row">
            <span style="color: #64748b;">Total Credit Given:</span>
            <span class="font-mono font-bold" style="color: #991b1b;">${formatInr(totalGiven)}</span>
          </div>

          <div class="totals-row">
            <span style="color: #64748b;">Total Payments Received:</span>
            <span class="font-mono font-bold" style="color: #047857;">${formatInr(totalPaid)}</span>
          </div>

          <div class="totals-row totals-grand">
            <span>OUTSTANDING DUE:</span>
            <span class="font-mono ${isDue ? 'due-highlight' : ''}">${formatInr(balanceNum)}</span>
          </div>

          ${!isDue ? `
            <div class="settled-badge">✓ Full Account Settled</div>
          ` : ''}
        </div>

        <div style="border-top: 1px solid #cbd5e1; padding-top: 4px; text-align: center; margin-top: 6px;">
          <span style="font-size: 8px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-family: monospace;">
            HisabPoint Ledger Verified
          </span>
        </div>
      </div>
    </div>

    <!-- Signatures Block -->
    <div class="signatures-block">
      <div class="disclaimer-block">
        <p style="font-style: italic;">Computer generated statement from HisabPoint Bahi Khata.</p>
        <p style="margin-top: 2px;">Thank you for your business!</p>
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
      <span>Statement generated on ${escapeHtml(formatDateFull(new Date().toISOString().split('T')[0]))}</span>
      <span>HisabPoint • 100% Safe & Secure</span>
    </div>
  </div>

  <script>
    // Automatically trigger print on document load
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch (e) {
          console.warn('Auto print failed:', e);
        }
      }, 300);
    });
  </script>
</body>
</html>`;
}

/**
 * Triggers clean, standalone printing of the Khata Account Statement.
 * Completely isolates the output so it NEVER captures the app UI, modals, or screen backgrounds.
 */
export function printKhataStatementDirect(
  customer: Customer,
  transactions: Transaction[],
  business?: BusinessProfile | null,
  range: string = 'all',
  shopNameOverride?: string
): void {
  const html = generateKhataStatementHtml(customer, transactions, business, range, shopNameOverride);

  // Strategy 1: Open a dedicated printable tab/window.
  // This is the cleanest and most reliable strategy on both Mobile Android/iOS and Desktop.
  try {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      return;
    }
  } catch (err) {
    console.warn('window.open blocked, falling back to hidden iframe:', err);
  }

  // Strategy 2: Hidden iframe fallback if popup was blocked
  const existingFrame = document.getElementById('hisabpoint-statement-print-frame');
  if (existingFrame && existingFrame.parentNode) {
    existingFrame.parentNode.removeChild(existingFrame);
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'hisabpoint-statement-print-frame';
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
    window.print();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn('Iframe print failed, falling back to window.print:', e);
      window.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 2500);
    }
  }, 350);
}
