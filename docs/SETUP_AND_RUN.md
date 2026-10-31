# Setup and Run Guide - Hisab Ledger Management System

This guide walks you through setting up and running both the backend (Django) and frontend (React) applications for the Hisab Ledger Management System.

**Table of Contents**
1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Running Both Together](#running-both-together)
5. [Testing the Application](#testing-the-application)
6. [Troubleshooting](#troubleshooting)
7. [Database Options](#database-options)

---

## Prerequisites

Before starting, ensure you have the following installed on your system:

### Required Software

- **Python 3.9+** - Download from [python.org](https://www.python.org/downloads/)
  - Verify: Open PowerShell and run `python --version`
  - On Windows, Python should be added to PATH during installation (check "Add Python to PATH")

- **Node.js 16+** - Download from [nodejs.org](https://nodejs.org/)
  - Verify: Open PowerShell and run `node --version` and `npm --version`

- **Git** (optional, but recommended) - Download from [git-scm.com](https://git-scm.com/)

### Optional Database

Choose one (SQLite is easiest for development):

- **SQLite** - Built into Python, no installation needed
- **PostgreSQL 13+** - Download from [postgresql.org](https://www.postgresql.org/download/)
- **MySQL 8.0+** - Download from [mysql.com](https://www.mysql.com/downloads/)

### Prerequisites Checklist

- [ ] Python 3.9+ installed and available in PATH
- [ ] Node.js 16+ installed and available in PATH
- [ ] npm (comes with Node.js) available
- [ ] PowerShell or Command Prompt available
- [ ] (Optional) PostgreSQL or MySQL installed for production

---

## Backend Setup

The backend is a Django application that provides the REST API for the ledger system.

### Step 1: Navigate to Project Root

```powershell
cd D:\Projects\Ledger
```

### Step 2: Create Virtual Environment

A virtual environment isolates Python dependencies for this project.

```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# You should see (venv) at the start of your command line
```

**Note:** After activation, you'll see `(venv)` in your prompt. Always activate the virtual environment before working on the backend.

### Step 3: Install Django Dependencies

```powershell
# Upgrade pip to latest version
python -m pip install --upgrade pip

# Install all dependencies from requirements.txt
pip install -r requirements.txt
```

This installs:
- Django 4.2
- Django REST Framework
- PostgreSQL support (psycopg2)
- CORS headers support
- API documentation (Swagger)
- Testing tools (pytest, factory-boy)
- Code quality tools (black, flake8, isort)

### Step 4: Configure Environment Variables

Create a `.env` file in the project root (D:\Projects\Ledger\.env):

```powershell
# Copy the example file
Copy-Item .env.example .env
```

Edit the `.env` file and configure for development:

```
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration (SQLite for development - default)
DATABASE_URL=sqlite:///db.sqlite3

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# JWT Configuration
JWT_ACCESS_TOKEN_LIFETIME=3600
JWT_REFRESH_TOKEN_LIFETIME=604800
```

### Step 5: Run Database Migrations

Migrations set up the database schema.

```powershell
# Make sure virtual environment is activated
# If not, run: venv\Scripts\activate

python manage.py migrate
```

You should see output like:
```
Operations to perform:
  Apply all migrations: admin, auth, contenttypes, sessions, hisab
Running migrations:
  Applying hisab.0001_initial... OK
  ...
```

### Step 6: Create Superuser (Optional)

Create an admin account to access the Django admin interface:

```powershell
python manage.py createsuperuser
```

Follow the prompts to set username and password. Example:
```
Username: admin
Email: admin@example.com
Password: ••••••••
Password (again): ••••••••
Superuser created successfully.
```

### Step 7: Verify Backend Setup

Run the development server:

```powershell
python manage.py runserver
```

You should see output like:
```
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

**Test the backend is working:**

Open your browser and visit:
- **Django Admin**: http://localhost:8000/admin/
- **API Root**: http://localhost:8000/api/
- **Swagger UI**: http://localhost:8000/swagger/

If you created a superuser, you can log in to the admin interface.

**Press Ctrl+C to stop the server** when done testing.

---

## Frontend Setup

The frontend is a React application built with TypeScript and Vite.

### Step 1: Open New PowerShell Window

Keep the backend PowerShell window open, and open a **new PowerShell window** for the frontend.

### Step 2: Navigate to Frontend Directory

```powershell
cd D:\Projects\Ledger\frontend
```

### Step 3: Install npm Dependencies

```powershell
npm install
```

This installs all dependencies listed in package.json:
- React 18
- React Router for navigation
- Axios for API calls
- Tailwind CSS for styling
- Vite for bundling

This may take 2-3 minutes.

### Step 4: Configure Environment Variables

Create a `.env` file in the frontend directory (D:\Projects\Ledger\frontend\.env):

```powershell
# Copy the example file
Copy-Item .env.example .env
```

Edit the `.env` file to point to your backend:

```
# API Configuration - must match backend URL
VITE_API_URL=http://localhost:8000/api

# Optional: Set environment
NODE_ENV=development
```

**Important:** Make sure this URL matches where your Django backend is running (typically http://localhost:8000/api).

### Step 5: Verify Frontend Setup

Run the development server:

```powershell
npm run dev
```

You should see output like:
```
  VITE v5.0.8  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Press h to show help
```

**Note:** Vite may use port 5173 or 3000 depending on availability. Check the output for the actual URL.

Open your browser and visit: http://localhost:5173/ (or the URL shown in the output)

You should see the Ledger application homepage.

**Press Ctrl+C to stop the server** when done testing.

---

## Running Both Together

The application requires both the backend and frontend running simultaneously.

### Setup Instructions

1. **Open Terminal 1 - Backend**
   ```powershell
   cd D:\Projects\Ledger
   venv\Scripts\activate
   python manage.py runserver
   ```
   - Backend runs on: http://localhost:8000
   - Keep this window open

2. **Open Terminal 2 - Frontend**
   ```powershell
   cd D:\Projects\Ledger\frontend
   npm run dev
   ```
   - Frontend runs on: http://localhost:5173 (or 3000)
   - Keep this window open

3. **Access the Application**
   - Open your browser to http://localhost:5173 (or the URL from Terminal 2)
   - The frontend will automatically call the backend API at http://localhost:8000/api

### Daily Development Workflow

Each time you work on the project:

**Backend:**
```powershell
cd D:\Projects\Ledger
venv\Scripts\activate
python manage.py runserver
```

**Frontend (in new PowerShell window):**
```powershell
cd D:\Projects\Ledger\frontend
npm run dev
```

Then open your browser to http://localhost:5173 (or the shown URL).

---

## Testing the Application

Once both the backend and frontend are running, test the complete flow:

### Dashboard
- [ ] Open the application at http://localhost:5173
- [ ] You should see the Dashboard page
- [ ] Dashboard shows financial statistics and summaries

### Add Customer
1. Navigate to the Customers page
2. Click "Add Customer" button
3. Enter customer details:
   - Name: "Test Customer"
   - Phone: "123-456-7890"
   - Email: "test@example.com"
   - Address: "123 Test Street"
   - Opening Balance: "1000"
4. Click Save
5. [ ] Customer should appear in the customer list

### Add Ledger Entry
1. Navigate to a customer's ledger
2. Click "Add Entry" button
3. Enter entry details:
   - Date: Today's date
   - Type: "Credit" or "Debit"
   - Amount: "100"
   - Description: "Test transaction"
4. Click Save
5. [ ] Entry should appear in the ledger

### Record Payment
1. Go to a customer's record
2. Click "Record Payment" button
3. Enter payment details:
   - Amount: "50"
   - Payment Method: "Cash"
   - Date: Today's date
4. Click Save
5. [ ] Payment should be recorded and balance updated

### Verify Balance Calculations
1. Navigate to a customer's details
2. [ ] Current balance should be calculated correctly
   - Formula: Opening Balance + Credits - Debits - Payments
3. [ ] Dashboard should show accurate totals

### Complete Testing Checklist
- [ ] Dashboard displays correctly
- [ ] Can add new customers
- [ ] Can add ledger entries
- [ ] Can record payments
- [ ] Balances calculate correctly
- [ ] Can view customer transaction history
- [ ] Can edit/delete entries (if allowed)
- [ ] Navigation between pages works smoothly

---

## Troubleshooting

### Port Conflicts

**Error: "Address already in use"**

Ports 8000 (backend) or 5173 (frontend) are already in use by another application.

**Solution - Backend (port 8000):**
```powershell
# Run on a different port
python manage.py runserver 8001
```

Then update frontend `.env` to point to the new port:
```
VITE_API_URL=http://localhost:8001/api
```

**Solution - Frontend (port 5173):**
```powershell
# Vite will automatically use the next available port (5174, 5175, etc.)
npm run dev
```

### Python Not Found

**Error: "python is not recognized"**

Python is not in your system PATH.

**Solutions:**
1. Reinstall Python and check "Add Python to PATH" during installation
2. Or use the full path: `C:\Users\YourUsername\AppData\Local\Programs\Python\Python311\python.exe --version`
3. Or restart PowerShell after installing Python

### Virtual Environment Activation Fails

**Error: "cannot be loaded because running scripts is disabled"**

PowerShell execution policy prevents running scripts.

**Solution:**
```powershell
# Set execution policy for current user
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then try again
venv\Scripts\activate
```

### npm Modules Not Found

**Error: "npm: The term 'npm' is not recognized"**

Node.js is not in your system PATH.

**Solutions:**
1. Reinstall Node.js from nodejs.org
2. Restart PowerShell or your computer after installation
3. Verify with: `node --version` and `npm --version`

### CORS Errors in Browser Console

**Error: "Access to XMLHttpRequest has been blocked by CORS policy"**

The frontend and backend CORS configuration doesn't match.

**Solution:**

Make sure backend `.env` includes:
```
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Restart the backend server:
```powershell
# Stop with Ctrl+C, then restart
python manage.py runserver
```

### API Connection Issues

**Error: "Failed to fetch from API" or "net::ERR_REFUSED_CONNECTION"**

The backend is not running or the API URL is incorrect.

**Checklist:**
- [ ] Backend is running in first PowerShell window
- [ ] Check frontend `.env` file has correct `VITE_API_URL`
- [ ] Test backend is accessible: http://localhost:8000/api in browser
- [ ] Restart frontend dev server after changing `.env`

### Database Errors

**Error: "database is locked"** or "no such table"**

Database migrations haven't been run or database is corrupted.

**Solution:**
```powershell
# Make sure virtual environment is activated
venv\Scripts\activate

# Re-run migrations
python manage.py migrate

# Optional: Create fresh superuser
python manage.py createsuperuser
```

### Migrations Won't Run

**Error: "ImportError" or "ModuleNotFoundError"**

Dependencies not installed properly.

**Solution:**
```powershell
# Activate virtual environment
venv\Scripts\activate

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Try migrations again
python manage.py migrate
```

### Frontend Page Blank or Not Loading

**Causes:**
1. Frontend not compiled properly
2. Browser cached old version
3. API not returning expected data

**Solutions:**
1. Clear browser cache: Press Ctrl+Shift+Delete in Chrome/Edge
2. Restart frontend dev server:
   ```powershell
   # Stop with Ctrl+C
   npm run dev
   ```
3. Check browser console for errors: F12 > Console tab
4. Verify backend is running: http://localhost:8000/api

### Need to Reset Everything

If the database is corrupted or you want a fresh start:

```powershell
# Activate virtual environment
cd D:\Projects\Ledger
venv\Scripts\activate

# Remove existing database
Remove-Item db.sqlite3 -ErrorAction SilentlyContinue

# Run fresh migrations
python manage.py migrate

# Create new superuser
python manage.py createsuperuser

# Restart server
python manage.py runserver
```

---

## Database Options

The application supports different databases for different scenarios.

### SQLite (Recommended for Development)

**Best for:** Local development, testing, small deployments

Already configured in `settings.py`. No additional setup needed.

**File:** `db.sqlite3` in project root

**Advantages:**
- No separate database server needed
- Fast setup
- Perfect for development

**Limitations:**
- Not suitable for high-concurrency scenarios
- Limited to one writer at a time

### PostgreSQL (Recommended for Production)

**Best for:** Production, team environments, scalability

**Setup:**

1. **Install PostgreSQL**
   - Download from [postgresql.org](https://www.postgresql.org/download/)
   - During installation, remember the password for the `postgres` user
   - Verify: `psql --version`

2. **Create Database and User**

   Open pgAdmin (included with PostgreSQL) or use command line:

   ```powershell
   # Connect to PostgreSQL
   psql -U postgres

   # Create database
   CREATE DATABASE ledger_db;

   # Create user
   CREATE USER ledger_user WITH PASSWORD 'your_secure_password';

   # Grant permissions
   ALTER ROLE ledger_user SET client_encoding TO 'utf8';
   ALTER ROLE ledger_user SET default_transaction_isolation TO 'read committed';
   ALTER ROLE ledger_user SET default_transaction_deferrable TO on;
   ALTER ROLE ledger_user SET default_transaction_level TO 'read committed';
   GRANT ALL PRIVILEGES ON DATABASE ledger_db TO ledger_user;

   # Exit psql
   \q
   ```

3. **Update `.env` File**

   ```
   DATABASE_URL=postgresql://ledger_user:your_secure_password@localhost:5432/ledger_db
   ```

4. **Run Migrations**

   ```powershell
   venv\Scripts\activate
   python manage.py migrate
   ```

**Advantages:**
- Production-grade database
- Excellent for concurrent access
- Full SQL support
- Best for large datasets

### MySQL (Alternative Option)

**Best for:** Organizations already using MySQL

**Setup:**

1. **Install MySQL**
   - Download from [mysql.com](https://www.mysql.com/downloads/)
   - Remember root password during installation

2. **Create Database and User**

   ```sql
   -- Connect as root
   mysql -u root -p

   -- Create database
   CREATE DATABASE ledger_db;

   -- Create user
   CREATE USER 'ledger_user'@'localhost' IDENTIFIED BY 'your_secure_password';

   -- Grant permissions
   GRANT ALL PRIVILEGES ON ledger_db.* TO 'ledger_user'@'localhost';
   FLUSH PRIVILEGES;

   -- Exit
   EXIT;
   ```

3. **Update `.env` File**

   ```
   DATABASE_URL=mysql://ledger_user:your_secure_password@localhost:3306/ledger_db
   ```

4. **Run Migrations**

   ```powershell
   venv\Scripts\activate
   python manage.py migrate
   ```

### Switching Databases

To switch from SQLite to PostgreSQL:

1. **Update `.env`:**
   ```
   DATABASE_URL=postgresql://ledger_user:password@localhost:5432/ledger_db
   ```

2. **Verify database exists**

3. **Run migrations:**
   ```powershell
   venv\Scripts\activate
   python manage.py migrate
   ```

4. **Restart Django server**

---

## Quick Reference Commands

### Backend

```powershell
# Activate virtual environment
venv\Scripts\activate

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver

# Run on different port
python manage.py runserver 8001

# Run tests
pytest

# Run tests with coverage
pytest --cov=hisab

# Format code with Black
black .

# Check code style
flake8 .

# Sort imports
isort .
```

### Frontend

```powershell
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm build

# Preview production build
npm preview

# Check for linting errors
npm run lint

# Type check
npm run type-check
```

---

## Additional Resources

- **Django Documentation**: https://docs.djangoproject.com/
- **Django REST Framework**: https://www.django-rest-framework.org/
- **React Documentation**: https://react.dev/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Vite Guide**: https://vitejs.dev/guide/
- **PostgreSQL Tutorial**: https://www.postgresql.org/docs/

---

## Support

If you encounter issues not covered here:

1. Check the browser console (F12) for error messages
2. Check the terminal/PowerShell output for error logs
3. Review the [Troubleshooting](#troubleshooting) section above
4. Ensure all prerequisites are installed and in PATH
5. Verify both backend and frontend are running simultaneously

Good luck with your Ledger application!
