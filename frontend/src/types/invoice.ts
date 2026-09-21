// Invoice & Billing TypeScript types

export type InvoiceStatus = 'unpaid' | 'paid' | 'partially_paid' | 'cancelled';
export type PaymentMode = 'credit' | 'cash' | 'upi' | 'card' | 'other';
export type DiscountType = 'flat' | 'percentage';

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  unit_price: string;
  amount: string;
  order: number;
}

export interface Invoice {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  payment_status: InvoiceStatus;
  payment_mode: PaymentMode;
  subtotal: string;
  discount_type: DiscountType;
  discount_value: string;
  discount_amount: string;
  tax_rate: string;
  tax_amount: string;
  total_amount: string;
  paid_amount: string;
  balance_due: string;
  notes: string;
  terms: string;
  ledger_transaction_id: string | null;
  items: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

export interface InvoiceListItem {
  id: string;
  customer_name: string;
  customer_phone: string;
  invoice_number: string;
  invoice_date: string;
  payment_status: InvoiceStatus;
  payment_mode: PaymentMode;
  total_amount: string;
  paid_amount: string;
  balance_due: string;
  created_at: string;
}

export interface InvoiceItemInput {
  name: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

export interface InvoiceCreatePayload {
  customer_id?: string | null;
  customer_name: string;
  customer_phone?: string;
  invoice_date: string;
  due_date?: string | null;
  payment_mode: PaymentMode;
  discount_type: DiscountType;
  discount_value: number;
  tax_rate: number;
  paid_amount: number;
  notes?: string;
  terms?: string;
  items: InvoiceItemInput[];
}
