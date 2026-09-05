import api from './api';
import type { Transaction, DashboardData, CreateTransactionData } from '../types';

export const ledgerService = {
  async getTransactions(customerId: string): Promise<Transaction[]> {
    const res = await api.get(`/customers/${customerId}/transactions/`);
    if (res.data.results) return res.data.results;
    return res.data;
  },

  async createTransaction(
    customerId: string,
    data: CreateTransactionData
  ): Promise<{ transaction: Transaction; balance: string; message: string }> {
    const res = await api.post(`/customers/${customerId}/transactions/`, data);
    return res.data;
  },

  async getTransaction(id: string): Promise<Transaction> {
    const res = await api.get(`/transactions/${id}/`);
    return res.data;
  },

  async updateTransaction(
    id: string,
    data: { description?: string; transaction_date?: string }
  ): Promise<Transaction> {
    const res = await api.patch(`/transactions/${id}/`, data);
    return res.data;
  },

  async reverseTransaction(
    id: string
  ): Promise<{ reversal: Transaction; balance: string; message: string }> {
    const res = await api.post(`/transactions/${id}/reverse/`);
    return res.data;
  },

  async getDashboard(): Promise<DashboardData> {
    const res = await api.get('/dashboard/');
    return res.data;
  },

  async getAllTransactions(): Promise<Transaction[]> {
    const res = await api.get('/transactions/');
    if (res.data.results) return res.data.results;
    return res.data;
  },
};

