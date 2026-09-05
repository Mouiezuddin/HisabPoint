# Digital Ledger

A mobile-first digital ledger for small Indian shopkeepers — replacing the traditional handwritten customer credit notebook.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS v3 + TanStack Query |
| Backend | Python 3.11 + Django 5 + Django REST Framework |
| Database | SQLite (dev) / PostgreSQL (production) |
| Auth | JWT via djangorestframework-simplejwt |

## Project Structure

```
Ledger/
├── backend/      # Django REST API
├── frontend/     # React + TypeScript SPA
└── README.md
```

## Local Development

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # Edit as needed
python manage.py migrate
python manage.py runserver
```

API available at: http://localhost:8000/api/

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # Edit VITE_API_URL if needed
npm run dev
```

App available at: http://localhost:5173/

## Environment Variables

See `backend/.env.example` and `frontend/.env.example`.

Never commit real `.env` files.

## Core Workflow

```
Open App → Find Customer → Given / Payment → Enter Amount → Save → Balance Updated
```

## Architecture

- Balance is always computed from transactions (never stored)
- Every customer/transaction is owned by the authenticated user
- Users cannot access each other's data
- Transactions are never deleted — corrections create reversal records
