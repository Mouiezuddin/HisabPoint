import axios, { AxiosInstance } from 'axios';

// API base URL - adjust based on your backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add request interceptor for auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if needed
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface Customer {
  id: string;
  name: string;
  phone_number: string;
  email?: string;
  address?: string;
  opening_balance: number;
  current_balance: number;
  status: 'active' | 'inactive' | 'suspended';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  credit_limit?: number;
  notes?: string;
}

export interface LedgerEntry {
  id: string;
  customer: string;
  customer_name: string;
  customer_phone: string;
  entry_date: string;
  entry_type: 'credit' | 'debit';
  transaction_type: 'sale' | 'purchase' | 'return' | 'adjustment' | 'other';
  amount: number;
  description?: string;
  reference_number?: string;
  is_settled: boolean;
  settlement_date?: string;
  invoice_number?: string;
  bill_number?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  customer: string;
  customer_name: string;
  customer_phone: string;
  payment_date: string;
  payment_method: 'cash' | 'bank_transfer' | 'check' | 'card' | 'digital';
  payment_method_display: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  status_display: string;
  reference_number?: string;
  transaction_id?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  customer_stats: {
    total_customers: number;
    active_customers: number;
    new_customers_week: number;
    inactive_customers: number;
  };
  ledger_stats: {
    today: {
      credit: number;
      debit: number;
      net: number;
      entries: number;
    };
    this_month: {
      credit: number;
      debit: number;
      net: number;
      entries: number;
    };
  };
  payment_stats: {
    today: {
      total: number;
      count: number;
    };
    this_month: {
      total: number;
      count: number;
    };
  };
  top_debtors: Array<{
    id: string;
    name: string;
    phone: string;
    balance: number;
  }>;
  recent_activity: {
    ledger_entries: LedgerEntry[];
    payments: Payment[];
  };
}

export interface CustomerBalance {
  customer_id: string;
  customer_name: string;
  phone_number: string;
  total_credit: number;
  total_debit: number;
  total_payments: number;
  current_balance: number;
  balance_type: 'credit' | 'debit' | 'zero';
}

// API Functions
export const api = {
  // Authentication
  post: async <T = any,>(endpoint: string, data?: any): Promise<T> => {
    const response = await apiClient.post<T>(endpoint, data);
    return response.data;
  },

  // Customers
  getCustomers: async (searchQuery?: string) => {
    const params = searchQuery ? { search: searchQuery } : {};
    const response = await apiClient.get<{ results: Customer[]; count: number }>('/customers/', { params });
    return response.data;
  },

  getCustomer: async (customerId: string) => {
    const response = await apiClient.get<Customer>(`/customers/${customerId}/`);
    return response.data;
  },

  addCustomer: async (data: {
    name: string;
    phone_number: string;
    email?: string;
    address?: string;
    opening_balance?: number;
  }) => {
    const response = await apiClient.post<Customer>('/customers/', data);
    return response.data;
  },

  updateCustomer: async (customerId: string, data: Partial<Customer>) => {
    const response = await apiClient.patch<Customer>(`/customers/${customerId}/`, data);
    return response.data;
  },

  deleteCustomer: async (customerId: string) => {
    await apiClient.delete(`/customers/${customerId}/`);
  },

  getCustomerLedger: async (customerId: string) => {
    const response = await apiClient.get<{ results: LedgerEntry[] }>(
      `/customers/${customerId}/ledger_entries/`
    );
    return response.data.results || response.data;
  },

  getCustomerPayments: async (customerId: string) => {
    const response = await apiClient.get<{ results: Payment[] }>(
      `/customers/${customerId}/payments/`
    );
    return response.data.results || response.data;
  },

  getCustomerBalance: async (customerId: string) => {
    const response = await apiClient.get<CustomerBalance>(
      `/customers/${customerId}/current_balance/`
    );
    return response.data;
  },

  // Ledger Entries
  getLedgerEntries: async (customerId?: string, dateRange?: { startDate: string; endDate: string }) => {
    const params: Record<string, string> = {};
    if (customerId) params.customer_id = customerId;
    if (dateRange) {
      params.start_date = dateRange.startDate;
      params.end_date = dateRange.endDate;
    }
    const response = await apiClient.get<{ results: LedgerEntry[] }>('/ledger-entries/', { params });
    return response.data.results || response.data;
  },

  addEntry: async (data: {
    customer: string;
    entry_date: string;
    entry_type: 'credit' | 'debit';
    amount: number;
    description?: string;
    transaction_type?: string;
  }) => {
    const response = await apiClient.post<LedgerEntry>('/ledger-entries/', data);
    return response.data;
  },

  // Payments
  getPayments: async (customerId?: string) => {
    const params = customerId ? { customer_id: customerId } : {};
    const response = await apiClient.get<{ results: Payment[] }>('/payments/', { params });
    return response.data.results || response.data;
  },

  recordPayment: async (data: {
    customer: string;
    payment_date: string;
    payment_method: 'cash' | 'bank_transfer' | 'check' | 'card' | 'digital';
    amount: number;
    description?: string;
    reference_number?: string;
  }) => {
    const response = await apiClient.post<Payment>('/payments/', data);
    return response.data;
  },

  // Dashboard
  getDashboard: async () => {
    const response = await apiClient.get<DashboardStats>('/dashboard/');
    return response.data;
  },

  // Customer Balance (all)
  getAllCustomersBalance: async () => {
    const response = await apiClient.get<{
      summary: Record<string, number>;
      customers: CustomerBalance[];
    }>('/customer-balance/');
    return response.data;
  },
};

export default apiClient;
