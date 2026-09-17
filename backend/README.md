# ⚙️ HisabPoint Backend API Engine

> **High-throughput, multi-tenant financial ledger & POS invoicing REST API built with Django 5.0, Django REST Framework, and PostgreSQL.**

---

## 🛠️ Tech Stack & Dependencies

- **Python**: 3.12+
- **Framework**: Django 5.0 & Django REST Framework (DRF 3.15)
- **Database**: PostgreSQL (Serverless via NeonDB) with direct connection pooling / SQLite for local dev
- **Authentication**: Stateless JWT via `djangorestframework-simplejwt` with 2FA (RFC 6238 TOTP)
- **WSGI / Server**: Gunicorn (3 worker threads)
- **Containerization**: Docker (multi-stage python:3.12-slim build)
- **Hosting**: Render Docker Cloud Service

---

## 🏗️ Architecture & Modules

The backend is structured into modular, decoupled Django apps:

```text
backend/
├── accounts/      # User authentication, JWT tokens, 2FA, password resets
├── businesses/    # Shop profile, GSTIN, letterhead details, branding
├── customers/     # Customer records, contact directory, audit history
├── ledger/        # Immutable transaction ledger (Credit, Payment, Reversals)
├── billing/       # Itemized POS bills, GST/discounts, atomic ledger integration
├── reports/       # Real-time analytics, dashboard metrics, daily cash summaries
├── common/        # Shared permissions, pagination, validators, and health probes
└── config/        # Environment-aware Django settings (base, local, production)
```

---

## 🚀 Local Development Setup

### 1. Create Virtual Environment
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 4. Database Migrations
```bash
python manage.py migrate
```

### 5. Run Automated Tests
```bash
python manage.py test billing -v2
```

### 6. Start API Server
```bash
python manage.py runserver 8000
```
API will run at: `http://localhost:8000/api/`

---

## 📡 Core API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health/` | Autonomous health probe & DB keep-alive |
| `POST` | `/api/auth/login/` | Issue authenticated JWT token pair |
| `GET` | `/api/customers/` | List customer accounts with computed balances |
| `POST` | `/api/ledger/transactions/` | Record Credit (`GIVEN`) or Payment (`RECEIVED`) |
| `GET` | `/api/reports/dashboard/` | Real-time aggregate metric counters |
| `GET` | `/api/invoices/` | List all invoices with status/date filters |
| `POST` | `/api/invoices/` | Create itemized invoice with atomic ledger sync |
| `POST` | `/api/invoices/<id>/cancel/` | Cancel invoice and reverse ledger entry |
| `GET` | `/api/invoices/next-number/` | Get next sequential invoice number |
