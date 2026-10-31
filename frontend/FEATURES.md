# Hisab Ledger Frontend - Features Guide

## 🎯 Core Features

### Dashboard
Your central hub showing:
- **Today's Sales** - Total amount sold today
- **Today's Collections** - Cash received today
- **Total Outstanding** - Total amount customers owe
- **Customer Count** - Total active customers
- **Top Debtors** - List of customers owing most money
- **Quick Actions** - Fast buttons for common tasks
- **Recent Customers** - Latest customer additions

### Customer Management

#### Customer List
- Search by name or phone number
- View customer cards showing:
  - Customer name and phone
  - Current due amount (color-coded)
  - Active/Inactive status
- Click any card to view full ledger

#### Add New Customer
- Required fields: Name, Phone
- Optional fields: Email, Address
- Set opening balance
- Automatic balance calculation

#### Customer Detail (Ledger)
- Complete customer information
- Current balance prominently displayed
- Balance summary showing:
  - Opening balance
  - Total sales (credit)
  - Total paid (debit)
  - Current balance
- Full transaction history:
  - Sales entries
  - Payment records
  - Grouped by date
  - Sorted by most recent

### Ledger Management

#### Adding Entries (Sales)
Record what customers owe:
- Select customer
- Choose date (defaults to today)
- Set entry type (Sale = customer owes)
- Enter amount
- Add description/notes
- Optional reference number

#### Recording Payments
Track money received:
- Select customer
- Choose payment method:
  - Cash
  - Bank Transfer
  - Check
  - Card
  - Digital (UPI/Mobile)
- Enter amount
- Add reference number (if applicable)
- Add notes

### Transaction History

Each customer's ledger shows:
- **Type** - Sale, Payment, or Adjustment
- **Amount** - Color-coded:
  - Orange/Red = Money owed by customer
  - Green = Payment from customer
- **Date** - When transaction occurred
- **Description** - Additional details
- **Reference** - Invoice/check numbers
- **Running Balance** - Implied current total

## 🎨 User Interface

### Design Philosophy
- **Mobile-First** - Optimized for phones
- **Fast** - Quick interactions, minimal loading
- **Clear** - Obvious balance colors and amounts
- **Professional** - Business-appropriate design

### Color Coding

| Color | Meaning |
|-------|---------|
| Green ✓ | Payments, money received, positive |
| Orange ⚠️ | Outstanding amounts, items owing |
| Red ✗ | Errors, alerts |
| Blue ℹ️ | Actions, information |
| Gray | Neutral, inactive |

### Responsiveness

#### Desktop (1024px+)
- Multi-column layouts
- Side-by-side cards
- Full navigation visible
- Larger buttons

#### Tablet (768px-1023px)
- 2-column grids
- Adjusted spacing
- Simplified navigation

#### Mobile (<768px)
- Full-width single column
- Hamburger menu
- Large touch targets
- Minimal horizontal scrolling

## 📊 Data Display

### Balance Calculation
```
Current Due = Opening Balance + Sales - Payments
```

Example:
- Opening: ₹1,000
- Sales (created): +₹5,000
- Payments (received): -₹2,000
- **Current Due: ₹4,000**

### Customer Cards Show
- Name and phone
- Current due amount
- Color indicator (red = owes, green = credit)
- Status badge

### Dashboard Stats
- Real-time calculations
- Updated on refresh
- Includes today's data
- Monthly summaries available

## 🔄 Workflows

### Complete Sale & Payment Workflow

1. **Add Entry (Sale)**
   - Dashboard → Add Entry
   - Select customer
   - Set amount
   - Optional: Add item description
   - Click "Add Entry"

2. **View Customer Balance**
   - Customers page → Click customer
   - See updated balance
   - View transaction history

3. **Record Payment**
   - Customer Ledger → Record Payment button
   - Enter payment amount
   - Choose payment method
   - Click "Record Payment"

4. **View Updated Balance**
   - Transaction appears immediately
   - Balance updated automatically
   - History includes both sale and payment

### Daily Operations Workflow

**Morning Opening:**
1. Dashboard - Check today's targets
2. Top Debtors - Identify who to follow up with
3. Recent Customers - See new customer additions

**During Day:**
1. Add Entry - Record each sale
2. Record Payment - Log received payments
3. Quick check - Customer balance confirmation

**End of Day:**
1. Dashboard - Review today's performance
2. All Customers - Check for any issues
3. Top Debtors - Plan follow-ups for tomorrow

## ⚡ Performance Features

### Fast Operations
- Instant form validation
- Quick search (client-side filtering)
- Cached customer list
- Minimal page reloads
- Keyboard navigation support

### Mobile Optimized
- Minimal data transfer
- Compressed assets
- Touch-friendly buttons (48px+)
- Fast page loads

### Offline Support (Partial)
- Read-only browsing
- Data disappears on refresh
- Sync on reconnect
- Always requires backend for writes

## 🛡️ Data Validation

### Customer Entry
- ✓ Name required, min 2 characters
- ✓ Phone required, min 10 digits
- ✓ Email validated (if provided)
- ✓ Opening balance must be non-negative

### Ledger Entry
- ✓ Customer required
- ✓ Amount required, must be > 0
- ✓ Date cannot be in future
- ✓ Description optional but recommended

### Payment Entry
- ✓ Customer required
- ✓ Amount required, must be > 0
- ✓ Payment method required
- ✓ Reference number required for bank transfers
- ✓ Date cannot be in future

## 🔍 Search & Filter

### Customer Search
- Real-time search
- Searches by name and phone
- Case-insensitive
- Shows count of results

### Date Filtering (Future)
- Filter entries by date range
- Filter payments by month
- Export capabilities (planned)

## 📱 Mobile-Specific Features

- **Bottom Navigation** (future) - Quick access to pages
- **Pull to Refresh** - Reload data
- **Touch Gestures** - Swipe to navigate
- **Large Buttons** - 48px minimum
- **High Contrast** - Easy to read in sunlight
- **Responsive Text** - Readable on small screens

## 🎓 Usage Tips

### Pro Tips for Speed
1. Use search to find customers quickly
2. Bookmark frequently used customers
3. Use keyboard Tab to move between fields
4. Pre-fill common items in description
5. Keep opening balance accurate

### Best Practices
1. Update balance daily
2. Record payments immediately
3. Add notes for unusual amounts
4. Regular reconciliation (weekly)
5. Keep phone numbers accurate

## 🚀 Coming Soon Features

(Future enhancements)
- Export to CSV/PDF
- Bulk customer import
- SMS/Email reminders
- Advanced reports
- Multiple user support
- Dark mode
- Multi-language support
- Backup & restore

---

**For more details, see README.md or QUICKSTART.md**
