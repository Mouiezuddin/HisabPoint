# Digital Ledger --- System Architecture

## 1. Architecture Goal

Build a maintainable full-stack application where the frontend is
responsible for presentation and user interaction, while the backend
owns business rules, authorization, validation, and persistent data.

## 2. Recommended Stack

### Frontend

-   React
-   TypeScript
-   Tailwind CSS
-   React Router
-   TanStack Query or equivalent server-state solution
-   PWA capabilities in a later phase

### Backend

-   Python
-   Django
-   Django REST Framework

### Database

-   PostgreSQL

### Authentication

-   JWT-based authentication for the initial API architecture, or secure
    session authentication if the deployment model favors it.

### Deployment

-   Frontend: Vercel/Netlify or equivalent
-   Backend: Render/Railway or equivalent
-   Database: Managed PostgreSQL

## 3. High-Level Architecture

``` text
Mobile/Desktop Browser
        |
        v
React Frontend
        |
      HTTPS
        |
        v
Django REST API
        |
        +---- Authentication
        +---- Authorization
        +---- Business Logic
        +---- Validation
        +---- Reporting
        |
        v
PostgreSQL
```

## 4. Core Domain Model

``` text
User
 |
 +---- BusinessProfile
 |
 +---- Customer
          |
          +---- Transaction
```

A user owns customers. A customer owns transactions.

Every customer and transaction must be associated with the correct
authenticated owner, directly or through a validated relationship.

## 5. Initial Data Model

### User

-   id
-   name
-   email
-   phone
-   password hash
-   created_at
-   updated_at

### BusinessProfile

-   id
-   user_id
-   shop_name
-   owner_name
-   address
-   phone
-   logo
-   created_at
-   updated_at

### Customer

-   id
-   user_id
-   name
-   phone
-   address
-   notes
-   status
-   created_at
-   updated_at

### Transaction

-   id
-   customer_id
-   type: CREDIT \| PAYMENT
-   amount
-   description
-   transaction_date
-   created_at
-   updated_at
-   created_by

## 6. Backend Structure

Recommended Django structure:

``` text
backend/
├── config/
├── accounts/
├── businesses/
├── customers/
├── ledger/
├── reports/
└── common/
```

Responsibilities:

-   `accounts`: authentication and user profile
-   `businesses`: shop/business information
-   `customers`: customer management
-   `ledger`: transactions and balances
-   `reports`: reporting queries
-   `common`: shared utilities, permissions, exceptions

## 7. API Structure

Example endpoints:

``` text
POST   /api/auth/register/
POST   /api/auth/login/
POST   /api/auth/logout/

GET    /api/customers/
POST   /api/customers/
GET    /api/customers/{id}/
PATCH  /api/customers/{id}/
DELETE /api/customers/{id}/

GET    /api/customers/{id}/transactions/
POST   /api/customers/{id}/transactions/

GET    /api/transactions/{id}/
PATCH  /api/transactions/{id}/
POST   /api/transactions/{id}/reverse/

GET    /api/dashboard/
```

The exact routes may change during implementation, but the API must
remain resource-oriented and predictable.

## 8. Transaction Integrity

Transactions are the source of truth.

Do not rely on a manually editable `customer.balance` as the
authoritative financial record.

Balance should be derived from valid transactions:

`Balance = SUM(CREDIT) - SUM(PAYMENT)`

Database operations that modify financial records should be atomic.

## 9. Authorization

Every protected endpoint must verify:

1.  User is authenticated.
2.  Requested resource belongs to the authenticated user.
3.  User has permission for the requested operation.

Never trust a customer ID supplied by the client.

## 10. Frontend Structure

``` text
src/
├── components/
├── layouts/
├── pages/
├── features/
│   ├── auth/
│   ├── customers/
│   ├── ledger/
│   └── dashboard/
├── services/
├── hooks/
├── utils/
├── types/
└── routes/
```

Keep feature-specific logic close to its feature instead of creating a
single giant utilities/components folder.

## 11. Error Handling

Backend should return consistent errors.

Example:

``` json
{
  "message": "Unable to create transaction.",
  "errors": {
    "amount": ["Enter a valid positive amount."]
  }
}
```

Frontend should show human-readable messages rather than raw server
errors.

## 12. Security Architecture

-   HTTPS in production
-   Password hashing through Django's authentication system
-   Authentication token/session protection
-   Server-side authorization
-   Input validation
-   CSRF protection where applicable
-   Rate limiting for sensitive endpoints
-   Secure CORS configuration
-   Secrets stored in environment variables
-   No credentials committed to Git
-   Database backups
-   Audit trail for sensitive financial corrections

## 13. Future Offline Architecture

For offline-first support:

``` text
React App
   |
   +---- Local Store
   |        |
   |        +---- Pending Transactions
   |
   +---- Sync Queue
             |
          Internet
             |
             v
         Django API
             |
             v
        PostgreSQL
```

Offline synchronization should be designed around unique transaction IDs
and idempotent requests to prevent duplicates.

## 14. Deployment Architecture

``` text
User
 |
 v
CDN / Frontend Host
 |
 | HTTPS API
 v
Backend Host
 |
 v
Managed PostgreSQL
```

Production environment variables must be configured separately from
source code.

## 15. Observability

Production should eventually include:

-   Error logging
-   API request monitoring
-   Database health monitoring
-   Basic usage analytics
-   Backup verification

Avoid collecting unnecessary personal information in logs.
