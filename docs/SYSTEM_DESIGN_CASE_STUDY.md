# 🏛️ HisabPoint System Design & Engineering Case Study

> **A production-grade, full-stack digital ledger & POS billing SaaS designed for high financial integrity, sub-second latency, and multi-tenant isolation.**

---

## 1. Executive Problem & Technical Scope

Traditional paper-based Indian merchant accounting (*Bahi Khata*) accounts for billions of rupees in credit transactions across 30M+ micro-retailers. While paper ledgers provide an intuitive, tactile experience, they suffer from three fatal structural flaws:
1. **Mathematical Ledger Drift**: Accumulation of rounding errors and manual calculation mistakes.
2. **Audit Irreversibility**: Crossed-out entries in paper books cause customer disputes without proof.
3. **Fragile Single Point of Failure**: Water, fire, or loss results in permanent loss of accounts receivable.

**HisabPoint** was engineered to solve these challenges with an enterprise-grade financial architecture, combining **atomic database transactions**, **immutable audit trails**, a **server-authoritative billing engine**, and **sub-second edge distribution**.

---

## 2. High-Level System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT INTERFACES                                │
│       Counter Desktop (Chrome/Edge) • Mobile PWA (Android/iOS) • Tablets     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / REST (JWT Auth)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          VERCEL EDGE DISTRIBUTION                           │
│  • React 19 + TypeScript SPA                                                │
│  • Stale-While-Revalidate LocalStorage Caching (0.2s FCP)                   │
│  • Non-render-blocking font pipeline (Zero FCP delay)                       │
│  • Workbox Service Worker App Shell (Secure offline caching)               │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ RESTful API Calls
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DOCKERIZED BACKEND (Render Cloud Engine)                 │
│  • Python 3.12 + Django 5.0 + Django REST Framework                         │
│  • Stateless JWT Verification (Access + Rotating Refresh Tokens)            │
│  • Server-Authoritative Billing Calculation Engine                          │
│  • Atomic Ledger Synchronization (`django.db.transaction.atomic`)          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Connection Pooling (Neon-Direct)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 SERVERLESS POSTGRESQL DATABASE (Neon Cloud)                 │
│  • Row-Level Multi-Tenancy (Strict `user_id` filtering)                     │
│  • Double-Entry Inspired Derived Balances (Zero Drift)                      │
│  • Immutable Transaction Ledger History                                     │
│  • Relational Foreign Keys with Cascade / Protect Rules                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema & Entity Relationships (ERD)

```text
┌─────────────────┐       1:1       ┌─────────────────────┐
│      User       ├─────────────────┤   BusinessProfile   │
│  (Auth, 2FA)    │                 │ (Shop Name, GSTIN)  │
└────────┬────────┘                 └─────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐       1:N       ┌─────────────────────┐
│    Customer     ├─────────────────┤     Transaction     │
│ (Name, Phone,   │                 │ (Credit / Payment / │
│  Derived Bal.)  │                 │  Reversal Audit)    │
└────────┬────────┘                 └──────────▲──────────┘
         │                                     │
         │ 1:N                                 │ 1:1 (Optional link)
         ▼                                     │
┌─────────────────┐       1:N       ┌──────────┴──────────┐
│     Invoice     ├─────────────────┤     InvoiceItem     │
│ (Bill No, Tax,  │                 │ (Name, Qty, Price,  │
│  Discount, Mode)│                 │  Line Total)        │
└─────────────────┘                 └─────────────────────┘
```

### Key Schema Design Decisions:
1. **No Static Stored Balances**: 
   - Storing balances in a mutable column (`balance += amount`) causes concurrency race conditions under simultaneous requests.
   - Customer balances are **dynamically derived** via aggregation:
     $$\text{Balance} = \sum(\text{Credit Given}) - \sum(\text{Payment Received})$$
2. **Soft Reversals, Never Hard Deletes**:
   - Financial transactions are immutable. To correct an entry, a `reversal` transaction is created pointing to `reversal_of_id`. This preserves a legally auditable history.
3. **Decimal Precision for Money**:
   - All financial amounts use Python `Decimal` (`max_digits=12, decimal_places=2`), preventing binary floating-point rounding errors common with standard JavaScript numbers.

---

## 4. Key Subsystems & Design Patterns

### A. The Billing & Invoicing Engine (`billing/`)
* **Problem**: Shopkeepers generate itemized bills (cash, UPI, or credit). When a bill is sold on credit, the shopkeeper shouldn't have to manually create a matching ledger transaction.
* **Solution**: Atomic synchronization via `django.db.transaction.atomic`:
  1. Calculate server-authoritative line subtotals, flat/percentage discounts, and GST.
  2. Create the `Invoice` and associated `InvoiceItem` records.
  3. If payment mode is `credit` (or partially paid), **automatically generate a linked `Transaction` (type: `credit`)** in the customer's ledger.
  4. If an invoice is cancelled, the linked ledger transaction is **automatically reversed** in the same transaction block.

```python
# Conceptual transaction-safe billing creation
with transaction.atomic():
    invoice = Invoice.objects.create(
        user=user, customer=customer, total_amount=computed_total, ...
    )
    InvoiceItem.objects.bulk_create(items)
    
    if invoice.payment_mode == PaymentMode.CREDIT:
        txn = Transaction.objects.create(
            user=user,
            customer=customer,
            type=TransactionType.CREDIT,
            amount=invoice.balance_due,
            description=f"Bill #{invoice.invoice_number}"
        )
        invoice.ledger_transaction = txn
        invoice.save(update_fields=['ledger_transaction'])
```

### B. Sub-Second (0.2s) Web Performance
* **Problem**: Single-Page Applications (SPAs) often feel sluggish on initial load (1–3s) due to render-blocking assets, font downloads, and network waterfall queries.
* **Architecture Solutions Applied**:
  1. **Stale-While-Revalidate (SWR) Local Snapshot**:
     - Dashboard and Customer list queries use TanStack Query's `initialData` populated synchronously from `localStorage`.
     - First Paint (FCP) occurs in **under 15 milliseconds** with cached metrics while network synchronization occurs silently in the background.
  2. **Non-Render-Blocking Typography**:
     - Google Fonts stylesheets are loaded via `<link rel="preload" as="style" ... media="print" onload="this.media='all'">`, preventing the browser from blocking DOM construction.
  3. **Eager Core Route Packaging**:
     - `DashboardPage` is bundled directly with the authenticated shell, eliminating secondary chunk network requests on login.
  4. **Elimination of Artificial Timers**:
     - Removed artificial splash delays; the splash screen now only activates if the backend cold start exceeds 1200ms.

---

## 5. Security & Multi-Tenancy Architecture

| Layer | Implementation | Security Guarantee |
|:---|:---|:---|
| **Authentication** | SimpleJWT with automated rotation | Short-lived access tokens (15m), refresh tokens stored securely |
| **Two-Factor Auth** | TOTP RFC 6238 (Google Authenticator) | Multi-factor authentication for merchant store management |
| **Tenant Isolation** | ORM queries scoped to `request.user` | Zero cross-tenant data leakage between independent shops |
| **Service Worker** | CacheStorage bypass for `/api/*` | Confidential financial figures are never saved in unencrypted browser cache |
| **CORS / CSP** | Strict white-listing (`Vercel` origin) | Eliminates unauthorized API access and cross-origin hijacking |

---

## 6. Technical Interview Talking Points (FAQ)

### Q1: "How do you ensure zero financial drift or balance corruption?"
> *"Instead of relying on a mutable database field like `customer.balance += 500`, which is prone to race conditions and asynchronous discrepancies, HisabPoint derives balances dynamically from an immutable transaction history. Credit entries add to the sum, and payments subtract from it. To correct mistakes, we issue an immutable reversal transaction rather than mutating or deleting past rows."*

### Q2: "How does the billing system synchronize with customer credit without race conditions?"
> *"We wrap invoice creation and ledger transaction dispatch inside a single database transaction using Django's `transaction.atomic()`. If the invoice succeeds but the ledger entry fails, the entire operation rolls back. Additionally, financial calculations (item prices, discounts, tax) are computed server-side to prevent client-side parameter tampering."*

### Q3: "How did you achieve a ~0.2s initial load time for the web application?"
> *"We adopted a Stale-While-Revalidate pattern using TanStack Query and `localStorage` snapshots. On first render, the dashboard mounts immediately with cached data in under 20ms, bypassing network latency. We also converted Google Fonts into non-blocking preloads, eager-bundled the primary dashboard route, and tuned QueryClient to avoid unnecessary refetches on window focus."*

### Q4: "Why did you build HisabPoint as a PWA rather than a native mobile app?"
> *"For Indian retailers, app storage and data bandwidth are valuable. A native app requires a 40–80 MB Play Store download and updates. Our PWA loads in under 1.5 MB total, supports offline asset caching via service workers, installs directly to the home screen, and works seamlessly across Android phones, iPads, and counter desktop PCs from a single TypeScript codebase."*
