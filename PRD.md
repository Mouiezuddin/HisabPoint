# Digital Ledger --- Product Requirements Document

## 1. Product Overview

Digital Ledger is a mobile-first web application for small shopkeepers
to replace handwritten customer credit notebooks.

The product has one primary job:

> Let a shopkeeper record who owes money, record payments, and instantly
> know the current balance.

The application must prioritize speed, simplicity, reliability, and data
safety over feature quantity.

## 2. Target Users

### Primary User

Small shopkeepers and local business owners who maintain customer credit
accounts.

### Secondary Users

-   Shop staff, in a future multi-user version
-   System administrators

## 3. Product Goals

1.  Record a customer transaction in seconds.
2.  Make outstanding balances immediately understandable.
3.  Preserve complete transaction history.
4.  Reduce manual calculations and notebook errors.
5.  Work well on low-end/mobile devices.
6.  Protect each shopkeeper's data from other users.

## 4. MVP Scope

### Authentication

-   Register
-   Login
-   Logout
-   Password recovery
-   User profile

### Customers

-   Add customer
-   View customer list
-   Search by name/phone
-   Edit customer
-   Archive customer
-   View customer details

### Ledger

-   Record customer credit
-   Record customer payment
-   Support partial payments
-   Add item/description
-   Store date and time
-   View transaction history
-   Correct erroneous transactions
-   Calculate balance automatically

### Dashboard

-   Total customers
-   Total outstanding amount
-   Today's credit
-   Today's payments
-   Customers with outstanding balances
-   Quick actions

### Security

-   Authentication
-   Authorization
-   User data isolation
-   Server-side validation
-   Secure password storage
-   Database backups

## 5. Balance Rules

For each customer:

`Balance = Total Credit - Total Payments`

Examples:

-   Credit ₹1,000 → Due ₹1,000
-   Payment ₹300 → Due ₹700
-   Payment ₹700 → Settled
-   Payment greater than outstanding amount → Advance/Credit balance, if
    enabled by product rules

A transaction must never be silently lost because a balance was
recalculated incorrectly.

## 6. Functional Requirements

### FR-01 Authentication

The system shall allow users to securely register and authenticate.

### FR-02 Customer Creation

The system shall allow an authenticated user to create a customer.

### FR-03 Customer Search

The system shall allow searching by customer name and phone number.

### FR-04 Credit Entry

The system shall allow recording an amount owed by a customer.

### FR-05 Payment Entry

The system shall allow recording money received from a customer.

### FR-06 Partial Payment

The system shall support multiple payments against accumulated credit.

### FR-07 Transaction History

The system shall display customer transactions in chronological order.

### FR-08 Automatic Balance

The system shall calculate customer balances from transaction data.

### FR-09 Dashboard

The system shall provide a concise overview of business ledger activity.

### FR-10 Authorization

The system shall prevent users from accessing another user's customers
or transactions.

## 7. Non-Functional Requirements

-   Mobile-first responsive UI
-   Fast common interactions
-   Reliable transaction persistence
-   Secure authentication
-   PostgreSQL-compatible production database
-   Maintainable modular codebase
-   Accessible touch targets and readable typography
-   API validation on the server
-   Production error logging
-   Backup and recovery strategy

## 8. Out of Scope for MVP

-   Full accounting/ERP
-   GST accounting
-   Inventory management
-   Payroll
-   Supplier management
-   AI chatbot
-   Complex financial analytics
-   Staff roles
-   Multi-business accounts
-   Native mobile applications

These can be considered after the core ledger is stable.

## 9. Success Criteria

The MVP is successful when a shopkeeper can:

1.  Log in.
2.  Find or create a customer.
3.  Record a credit transaction.
4.  Record a payment later.
5.  See the correct balance immediately.
6.  Review the complete history.
7.  Do all of this comfortably from a mobile device.

## 10. Future Features

-   Offline-first transaction entry
-   PWA installation
-   WhatsApp/share reminders
-   PDF/CSV exports
-   Digital receipts
-   Multi-device synchronization
-   Staff accounts and permissions
-   Multi-language support
-   Business subscriptions
