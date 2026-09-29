import api from './api';
import type {
  Invoice,
  InvoiceListItem,
  InvoiceCreatePayload,
} from '../types/invoice';

export const invoiceService = {
  async getInvoices(params?: {
    status?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<InvoiceListItem[]> {
    const res = await api.get('/invoices/', { params });
    if (res.data.results) return res.data.results;
    return res.data;
  },

  async getInvoiceById(id: string): Promise<Invoice> {
    const res = await api.get(`/invoices/${id}/`);
    return res.data;
  },

  async createInvoice(
    data: InvoiceCreatePayload
  ): Promise<{ invoice: Invoice; message: string }> {
    const res = await api.post('/invoices/', data);
    return res.data;
  },

  async cancelInvoice(
    id: string
  ): Promise<{ invoice: Invoice; message: string }> {
    const res = await api.post(`/invoices/${id}/cancel/`);
    return res.data;
  },

  async getNextInvoiceNumber(): Promise<string> {
    const res = await api.get('/invoices/next-number/');
    return res.data.next_number;
  },

  async downloadInvoicePdf(id: string, invoiceNumber?: string): Promise<void> {
    const res = await api.get(`/invoices/${id}/pdf/`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${invoiceNumber || id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
