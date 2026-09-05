import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AddTransactionPage } from '../AddTransactionPage';
import { customerService } from '../../../services/customer.service';
import { ledgerService } from '../../../services/ledger.service';

vi.mock('../../../services/customer.service', () => ({
  customerService: {
    get: vi.fn(),
  },
}));

vi.mock('../../../services/ledger.service', () => ({
  ledgerService: {
    createTransaction: vi.fn(),
  },
}));

vi.mock('../../../components/ui/Toast', () => ({
  showToast: vi.fn(),
}));

function renderAddTransactionPage(customerId = 'c123') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/customers/${customerId}/add-transaction`]}>
        <Routes>
          <Route path="/customers/:id/add-transaction" element={<AddTransactionPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('AddTransactionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders customer details and default credit type tab', async () => {
    (customerService.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'c123',
      name: 'Rohan Verma',
      phone: '9876543210',
      balance: '1500.00',
      balance_status: 'due',
    });

    renderAddTransactionPage('c123');

    await waitFor(() => {
      expect(screen.getAllByText('Rohan Verma')[0]).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /record given \(credit\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /record payment/i })).toBeInTheDocument();
  });

  it('validates amount field when submitted empty or zero', async () => {
    (customerService.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'c123',
      name: 'Rohan Verma',
      phone: '9876543210',
      balance: '1500.00',
      balance_status: 'due',
    });

    renderAddTransactionPage('c123');

    await waitFor(() => {
      expect(screen.getAllByText('Rohan Verma')[0]).toBeInTheDocument();
    });

    // Click Save Given button with empty amount
    const submitBtn = screen.getByRole('button', { name: /save given/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Enter an amount greater than ₹0.')).toBeInTheDocument();
    expect(ledgerService.createTransaction).not.toHaveBeenCalled();
  });

  it('submits transaction payload when valid data is entered', async () => {
    (customerService.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'c123',
      name: 'Rohan Verma',
      phone: '9876543210',
      balance: '1500.00',
      balance_status: 'due',
    });
    (ledgerService.createTransaction as ReturnType<typeof vi.fn>).mockResolvedValue({
      message: 'Transaction saved successfully',
    });

    renderAddTransactionPage('c123');

    await waitFor(() => {
      expect(screen.getAllByText('Rohan Verma')[0]).toBeInTheDocument();
    });

    // Enter amount and description
    const amountInput = screen.getByPlaceholderText('1,200');
    fireEvent.change(amountInput, { target: { value: '250.00' } });

    const submitBtn = screen.getByRole('button', { name: /save given/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(ledgerService.createTransaction).toHaveBeenCalledWith('c123', expect.objectContaining({
        type: 'credit',
        amount: '250.00',
      }));
    });
  });
});
