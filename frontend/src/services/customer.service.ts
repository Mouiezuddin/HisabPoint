import api from './api';
import type { Customer, CustomerListItem, PaginatedResponse, CreateCustomerData } from '../types';

export const customerService = {
  async list(search?: string): Promise<CustomerListItem[]> {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    const res = await api.get('/customers/', { params });
    // Handle both paginated and plain array responses
    if (res.data.results) return res.data.results;
    return res.data;
  },

  async get(id: string): Promise<Customer> {
    const res = await api.get(`/customers/${id}/`);
    return res.data;
  },

  async create(data: CreateCustomerData): Promise<Customer> {
    const res = await api.post('/customers/', data);
    return res.data;
  },

  async update(id: string, data: Partial<CreateCustomerData>): Promise<Customer> {
    const res = await api.patch(`/customers/${id}/`, data);
    return res.data;
  },

  async archive(id: string): Promise<{ message: string }> {
    const res = await api.post(`/customers/${id}/archive/`);
    return res.data;
  },

  async restore(id: string): Promise<{ message: string }> {
    const res = await api.post(`/customers/${id}/restore/`);
    return res.data;
  },

  async delete(id: string): Promise<{ message?: string }> {
    const res = await api.delete(`/customers/${id}/`);
    return res.data;
  },
};
