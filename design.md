# Digital Ledger --- UI/UX Design Specification

## 1. Design Philosophy

The product should feel like a modern replacement for a paper ledger,
not like enterprise accounting software.

Primary design principles:

-   Simple
-   Fast
-   Familiar
-   Mobile-first
-   Readable
-   Low cognitive load
-   Minimal steps
-   Clear financial status

## 2. Primary Navigation

Mobile navigation should contain only the most important destinations.

Recommended:

``` text
Home | Customers | Activity | Settings
```

The primary action can be a prominent `+ Add Transaction` button.

Avoid a large navigation menu.

## 3. Core Screens

### 3.1 Login

Elements: - App logo/name - Phone/email - Password - Login button -
Forgot password - Register link

### 3.2 Dashboard

Recommended hierarchy:

``` text
Good evening

Total Due
₹84,500

[ + Add Transaction ]

Today's Activity
Given       ₹4,200
Received    ₹2,800

Customers with Due
Aamir       ₹3,500
Rahul       ₹2,200
Sana          ₹800
```

The total outstanding amount should have the strongest visual emphasis.

### 3.3 Customer List

``` text
Customers

[ Search customers... ]

Aamir Khan
₹3,500 Due

Rahul Patil
₹2,200 Due

Sana
Settled
```

Support: - Fast search - Alphabetical/relevance ordering - Clear balance
state

### 3.4 Add Customer

Fields: - Customer name - Phone - Address - Notes

Only name should be required for the basic workflow.

### 3.5 Customer Details

``` text
Aamir Khan
9876543210

₹3,500 Due

[ + Given ] [ Payment ]

Transactions
--------------------------------
02 Sep
Rice + Oil                ₹1,200
Due

01 Sep
Payment                    ₹500
Received
```

Actions should be obvious without overcrowding the screen.

### 3.6 Add Transaction

First ask the simple question:

``` text
What happened?

[ Customer Took Something ]

[ Customer Paid Money ]
```

Then display the appropriate form.

Credit form: - Item/description - Amount - Date - Note

Payment form: - Amount - Date - Note

The amount field should receive focus quickly.

### 3.7 Settings

Sections: - Profile - Business details - Security - Notifications -
Help - Logout

Do not overload settings with rarely used controls.

## 4. Visual System

### Typography

Use a highly readable modern sans-serif.

Recommended hierarchy: - Large balance numbers - Medium page headings -
Clear body text - Smaller secondary metadata

Currency values must be easy to scan.

### Spacing

Use a consistent spacing scale. Prioritize generous spacing around: -
Financial totals - Primary buttons - Forms - Transaction groups

### Cards

Use cards only where they improve grouping. Avoid turning every element
into a card.

### Buttons

Primary actions should be visually dominant.

Examples: - `+ Add Transaction` - `Given` - `Payment`

Avoid vague buttons such as `Submit`.

## 5. Financial Status Design

Do not communicate status using color alone.

Use both label and visual treatment:

``` text
₹3,500
Due

₹0
Settled

₹500
Advance
```

The exact color palette can be selected during visual design, but status
must remain understandable in grayscale/accessibility modes.

## 6. Forms

Rules: - One clear label per field - Numeric keyboard for amount fields
on mobile - Validate immediately where useful - Show specific error
messages - Preserve entered data after recoverable errors - Disable
duplicate submission while saving - Show success feedback after save

## 7. Transaction UX

The transaction workflow should require as few decisions as possible.

Ideal:

``` text
Customer
   ↓
Given / Payment
   ↓
Amount
   ↓
Optional description
   ↓
Save
```

Do not make users navigate through multiple unrelated screens.

## 8. Empty States

Example customer empty state:

``` text
No customers yet

Add your first customer to start
tracking their balance.

[ + Add Customer ]
```

Empty states should always provide a next action.

## 9. Error States

Bad:

`Something went wrong.`

Better:

`We couldn't save this transaction. Check your internet connection and try again.`

For validation:

`Enter an amount greater than ₹0.`

## 10. Responsive Design

### Mobile

Primary target: - 320px--480px width

### Tablet

-   600px--1024px

### Desktop

-   1024px+

Desktop layouts may use a wider content area, but the mobile information
hierarchy must remain intact.

## 11. Accessibility

Requirements: - Keyboard navigation - Visible focus states - Proper
labels - Semantic HTML - Screen-reader-friendly buttons - Sufficient
contrast - Touch targets large enough for comfortable mobile use - Do
not rely on color alone

## 12. Interaction Rules

### Saving

Show a clear saving state and prevent accidental double submission.

### Destructive actions

Require confirmation for: - Archive - Reverse - Delete where allowed

### Navigation

Preserve context when possible. Returning from a customer transaction
should return to that customer's ledger rather than unexpectedly sending
the user to the dashboard.

## 13. Design System Components

Create reusable components for:

-   Button
-   Input
-   AmountInput
-   SearchInput
-   CustomerCard
-   BalanceDisplay
-   TransactionItem
-   StatusBadge
-   Modal
-   BottomSheet
-   EmptyState
-   ErrorState
-   LoadingState
-   Toast
-   ConfirmDialog

## 14. Design Quality Rule

Do not prioritize animations over usability.

Subtle transitions are acceptable. The app should never feel slow
because of visual effects.

The most important visual element is the customer's current balance and
the most important interaction is recording a transaction quickly.
