# Quick Start Guide - Hisab Ledger Frontend

## 5-Minute Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Backend URL
```bash
# Copy environment template
cp .env.example .env

# Make sure your .env file has:
VITE_API_URL=http://localhost:8000/api
```

### 3. Start Development Server
```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Backend Requirements

Make sure your Django backend is running:
```bash
python manage.py runserver
```

The backend should be at `http://localhost:8000/api`

## Available Pages

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/` | View overview and statistics |
| Customers | `/customers` | List and search customers |
| Customer Detail | `/customer/:id` | View customer ledger |
| Add Customer | `/add-customer` | Create new customer |
| Add Entry | `/add-entry` | Record sale/payment |
| Record Payment | `/record-payment` | Record payment received |

## Quick Actions from Dashboard

1. **Add Customer** - Create new customer account
2. **Add Entry** - Record a sale or payment
3. **Record Payment** - Record money received
4. **View Customers** - See all customers

## Common Tasks

### Adding a Customer
1. Click "Add Customer" button
2. Fill in name, phone, email (optional), address (optional)
3. Set opening balance if customer already owes money
4. Click "Create Customer"

### Recording a Sale
1. Click "Add Entry" 
2. Select customer
3. Leave entry type as "Sale" (Credit)
4. Enter amount and description
5. Click "Add Entry"

### Recording a Payment
1. Click "Record Payment"
2. Select customer
3. Enter amount received
4. Choose payment method (Cash/Bank/UPI/etc.)
5. Add reference number if needed
6. Click "Record Payment"

### Viewing Customer Ledger
1. Go to Customers page
2. Click on a customer card
3. View complete transaction history
4. See current balance/due

## Mobile Usage

The app is fully mobile-optimized:
- Touch-friendly buttons
- Responsive layout
- Fast on mobile networks
- Works offline for viewing (data resets)

## Keyboard Shortcuts

- Press `Tab` to navigate between form fields
- Press `Enter` to submit forms
- Press `Escape` to close modals (when implemented)

## Troubleshooting

### "Cannot connect to API"
- [ ] Django backend running on `http://localhost:8000`?
- [ ] Check browser console for errors
- [ ] Verify `VITE_API_URL` in `.env`
- [ ] Clear browser cache (Ctrl+Shift+Delete)

### Form not submitting
- [ ] Check red error messages below fields
- [ ] Verify all required fields are filled
- [ ] Check browser console for API errors

### App shows "Loading..." forever
- [ ] Check network tab in browser DevTools
- [ ] Is the backend API responding?
- [ ] Try refreshing the page

## Performance Tips

1. **Minimize Customers List** - Search to filter customers before viewing
2. **Use Quick Actions** - Dashboard buttons are fastest for common tasks
3. **Mobile Data** - App uses minimal bandwidth
4. **Caching** - Browser caches API responses

## Building for Production

```bash
npm run build
```

This creates optimized files in the `dist` folder for deployment.

For deployment options, see main README.md

## Need More Help?

- Check `README.md` for detailed documentation
- Review backend API docs at `http://localhost:8000/swagger/`
- Check browser console for error messages
- Inspect network requests in DevTools

---

**Happy ledger keeping! 📊**
