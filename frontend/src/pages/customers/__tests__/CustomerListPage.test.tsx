import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { CustomerListPage } from '../CustomerListPage';
import { customerService } from '../../../services/customer.service';

vi.mock('../../../services/customer.service', () => ({
  customerService: {
    list: vi.fn(),
  },
}));

function renderCustomerListPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CustomerListPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('CustomerListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders customer list correctly', async () => {
    (customerService.list as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'c1', name: 'Vikram Singh', phone: '9988776655', balance: '1200.00', balance_status: 'due' },
      { id: 'c2', name: 'Pooja Sharma', phone: '9112233445', balance: '0.00', balance_status: 'paid' },
    ]);

    renderCustomerListPage();

    await waitFor(() => {
      expect(screen.getByText('Vikram Singh')).toBeInTheDocument();
    });

    expect(screen.getByText('Pooja Sharma')).toBeInTheDocument();
    expect(screen.getByText('9988776655')).toBeInTheDocument();
  });

  it('filters customers when filter tab is clicked', async () => {
    (customerService.list as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'c1', name: 'Vikram Singh', phone: '9988776655', balance: '1200.00', balance_status: 'due' },
      { id: 'c2', name: 'Pooja Sharma', phone: '9112233445', balance: '0.00', balance_status: 'paid' },
    ]);

    renderCustomerListPage();

    await waitFor(() => {
      expect(screen.getByText('Vikram Singh')).toBeInTheDocument();
    });

    // Click "Due" filter button
    const dueFilterBtn = screen.getByRole('button', { name: /due/i });
    fireEvent.click(dueFilterBtn);

    expect(screen.getByText('Vikram Singh')).toBeInTheDocument();
    expect(screen.queryByText('Pooja Sharma')).not.toBeInTheDocument();
  });

  it('renders empty state when no customers match', async () => {
    (customerService.list as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    renderCustomerListPage();

    await waitFor(() => {
      expect(screen.getByText('No customers found')).toBeInTheDocument();
    });
  });
});
