# Digital Ledger --- Development Rules

## 1. Product Rules

### Rule 1 --- Simplicity First

The application is for shopkeepers, not accountants.

Prefer: - Customer - Amount - Given - Received - Due - Paid

Avoid unnecessary accounting terminology.

### Rule 2 --- Speed Is a Feature

The common transaction flow must be extremely fast.

Target:

`Find customer → choose action → enter amount → save`

### Rule 3 --- Mobile First

Design and test the primary experience on small mobile screens before
optimizing desktop layouts.

### Rule 4 --- No Feature Creep

Do not add inventory, GST, payroll, AI, or complex accounting features
to the MVP without an explicit product decision.

## 2. Financial Rules

### Rule 5 --- Transactions Are the Source of Truth

Never make a manually edited balance the authoritative financial record.

### Rule 6 --- Never Lose Financial History

Prefer reversing/correcting a transaction over destructive deletion in
production.

### Rule 7 --- Positive Amounts

Transaction amounts must be positive numbers. Transaction type
determines whether the amount increases or decreases the balance.

### Rule 8 --- Atomic Updates

A financial transaction must either be fully saved or fully rejected.

### Rule 9 --- Server Calculates the Balance

The frontend may display a calculated preview, but the backend remains
authoritative.

## 3. Security Rules

### Rule 10 --- Never Trust the Client

All important validation and authorization must happen on the backend.

### Rule 11 --- User Isolation

A user can access only their own business data.

### Rule 12 --- No Secrets in Git

Never commit: - Passwords - JWT secrets - Database credentials - API
keys - Production environment variables

### Rule 13 --- Secure Authentication

Use established Django authentication/security mechanisms instead of
custom password handling.

### Rule 14 --- Validate Every Input

Validate amounts, dates, identifiers, strings, and permissions
server-side.

## 4. Code Rules

### Rule 15 --- Small Components

React components should have one clear responsibility.

### Rule 16 --- Reuse Before Duplicating

Create reusable UI and domain utilities when the same behavior appears
more than once.

### Rule 17 --- No Giant Files

Split large components, services, serializers, and views by
responsibility.

### Rule 18 --- Clear Naming

Use names that explain intent.

Bad: `doThing()`

Good: `recordCustomerPayment()`

### Rule 19 --- No Business Logic in UI

Financial calculations and authorization rules belong to the
backend/domain layer, not scattered through React components.

### Rule 20 --- Consistent API Contracts

Frontend and backend must agree on request and response structures.

## 5. UI Rules

### Rule 21 --- Large Touch Targets

Primary mobile actions must be easy to tap.

### Rule 22 --- Clear Status

Due, paid, and settled states must be visually distinguishable without
relying only on color.

### Rule 23 --- Minimal Navigation

A user should reach a customer's ledger quickly.

### Rule 24 --- Confirm Destructive Actions

Archiving, reversing, or deleting important records requires
confirmation.

### Rule 25 --- Good Empty States

Empty screens should explain what to do next.

## 6. Git Rules

Use meaningful commits:

``` text
feat: add customer creation
feat: add payment transactions
fix: correct customer balance calculation
refactor: split ledger service
docs: update API specification
```

Do not commit broken code to the main branch.

## 7. Testing Rules

Every core financial behavior must have tests.

Minimum scenarios:

-   Add credit
-   Record payment
-   Partial payment
-   Full settlement
-   Multiple transactions
-   Invalid amount
-   Unauthorized customer access
-   Transaction correction
-   Balance calculation

## 8. Definition of Done

A feature is not complete until:

-   UI is implemented
-   Backend/API is implemented
-   Validation exists
-   Authorization exists
-   Relevant tests pass
-   Loading/error states exist
-   Mobile layout works
-   Documentation is updated
-   Code is reviewed

## 9. Architecture Rule

Do not introduce a new library or service just because it is popular.

Every dependency should solve a real project problem.

## 10. Product Quality Rule

A beautiful interface with unreliable financial data is a failed
product.

Correctness \> reliability \> usability \> visual polish \> extra
features.
