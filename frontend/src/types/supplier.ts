// Supplier & Payables TypeScript interfaces

export type SupplierStatus = 'active' | 'archived';
export type SupplierTransactionType = 'purchase' | 'payment' | 'reversal';
export type SupplierBalanceStatus = 'due' | 'settled' | 'advance';

export interface Supplier {
  id: string;
  name: string;
  company_name: string;
  phone: string;
  gstin: string;
  upi_id: string;
  address: string;
  notes: string;
  status: SupplierStatus;
  balance: string;
  balance_status: SupplierBalanceStatus;
  created_at: string;
  updated_at: string;
}

export interface SupplierListItem {
  id: string;
  name: string;
  company_name: string;
  phone: string;
  gstin: string;
  upi_id: string;
  status: SupplierStatus;
  balance: string;
  balance_status: SupplierBalanceStatus;
}

export interface SupplierTransaction {
  id: string;
  supplier: string;
  supplier_name: string;
  supplier_company: string;
  type: SupplierTransactionType;
  amount: string;
  bill_number: string;
  description: string;
  transaction_date: string;
  is_reversed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierData {
  name: string;
  company_name?: string;
  phone?: string;
  gstin?: string;
  upi_id?: string;
  address?: string;
  notes?: string;
}

export interface CreateSupplierTransactionData {
  type: 'purchase' | 'payment';
  amount: string;
  bill_number?: string;
  description?: string;
  transaction_date: string;
  transaction_time?: string;
}

export interface SupplierSummary {
  total_payable: string;
  total_advance: string;
  suppliers_due_count: number;
  total_suppliers: number;
  month_purchases: string;
  month_payments: string;
}
