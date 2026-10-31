import api from './api';
import type {
  Supplier,
  SupplierListItem,
  SupplierTransaction,
  CreateSupplierData,
  CreateSupplierTransactionData,
  SupplierSummary,
} from '../types';

export const supplierService = {
  async list(search?: string, filter?: string): Promise<SupplierListItem[]> {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (filter && filter !== 'all') params.filter = filter;

    const res = await api.get('/suppliers/', { params });
    if (res.data.results) return res.data.results;
    return res.data;
  },

  async get(id: string): Promise<Supplier> {
    const res = await api.get(`/suppliers/${id}/`);
    return res.data;
  },

  async getSummary(): Promise<SupplierSummary> {
    const res = await api.get('/suppliers/summary/');
    return res.data;
  },

  async create(data: CreateSupplierData): Promise<Supplier> {
    const res = await api.post('/suppliers/', data);
    return res.data;
  },

  async update(id: string, data: Partial<CreateSupplierData>): Promise<Supplier> {
    const res = await api.patch(`/suppliers/${id}/`, data);
    return res.data;
  },

  async delete(id: string): Promise<{ message?: string }> {
    const res = await api.delete(`/suppliers/${id}/`);
    return res.data;
  },

  async getTransactions(supplierId: string): Promise<SupplierTransaction[]> {
    const res = await api.get(`/suppliers/${supplierId}/transactions/`);
    if (res.data.results) return res.data.results;
    return res.data;
  },

  async createTransaction(
    supplierId: string,
    data: CreateSupplierTransactionData
  ): Promise<SupplierTransaction> {
    const res = await api.post(`/suppliers/${supplierId}/transactions/`, data);
    return res.data;
  },

  async reverseTransaction(transactionId: string): Promise<SupplierTransaction> {
    const res = await api.post(`/suppliers/transactions/${transactionId}/reverse/`);
    return res.data;
  },
};
