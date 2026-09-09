// Core application TypeScript types

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  is_2fa_enabled?: boolean;
  is_email_verified?: boolean;
  created_at: string;
}

export interface BusinessProfile {
  id: string;
  shop_name: string;
  owner_name: string;
  address: string;
  phone: string;
  logo: string | null;
  gstin: string;
  created_at: string;
  updated_at: string;
}

export type BalanceStatus = 'due' | 'settled' | 'advance';
export type CustomerStatus = 'active' | 'archived';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
  status: CustomerStatus;
  balance: string;
  balance_status: BalanceStatus;
  created_at: string;
  updated_at: string;
}

export interface CustomerListItem {
  id: string;
  name: string;
  phone: string;
  status: CustomerStatus;
  balance: string;
  balance_status: BalanceStatus;
  last_transaction?: string;
}

export type TransactionType = 'credit' | 'payment' | 'reversal';

export interface Transaction {
  id: string;
  customer: string;
  customer_name: string;
  type: TransactionType;
  amount: string;
  description: string;
  quantity?: string;
  transaction_date: string;
  reversal_of_id: string | null;
  is_reversed: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  total_due: string;
  today_given: string;
  today_received: string;
  total_customers: number;
  total_given?: string;
  total_received?: string;
  total_transactions?: number;
  daily_summary?: Array<{
    date: string;
    given: number;
    received: number;
  }>;
  this_month_sales?: string;
  weekly_breakdown?: Array<{
    week: string;
    amount: string;
  }>;
  customers_with_due: Array<{
    id: string;
    name: string;
    phone: string;
    balance: string;
    last_transaction?: string;
  }>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}

export interface CreateCustomerData {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface CreateTransactionData {
  type: 'credit' | 'payment';
  amount: string;
  description?: string;
  quantity?: string;
  transaction_date: string;
}
