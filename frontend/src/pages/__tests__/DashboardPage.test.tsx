import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from '../DashboardPage';
import { ledgerService } from '../../services/ledger.service';
import { authService } from '../../services/auth.service';

vi.mock('../../services/ledger.service', () => ({
  ledgerService: {
    getDashboard: vi.fn(),
    getAllTransactions: vi.fn(),
  },
}));

vi.mock('../../services/auth.service', () => ({
  authService: {
    getBusinessProfile: vi.fn(),
  },
}));

vi.mock('../../features/auth/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Ramesh Store', email: 'ramesh@test.com' },
    isAuthenticated: true,
  }),
}));

function renderDashboardPage() {
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
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading state initially', () => {
    (ledgerService.getDashboard as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    (ledgerService.getAllTransactions as ReturnType<typeof vi.fn>).mockResolvedValue({ results: [] });
    (authService.getBusinessProfile as ReturnType<typeof vi.fn>).mockResolvedValue({ business_name: 'Ramesh General Store' });

    renderDashboardPage();
    expect(screen.getByText(/Opening Bahi Khata…/i)).toBeInTheDocument();
  });

  it('renders summary cards with correct dashboard metrics', async () => {
    (ledgerService.getDashboard as ReturnType<typeof vi.fn>).mockResolvedValue({
      total_due: '12500.00',
      total_paid: '3400.00',
      customers_with_due: [
        { id: 'c1', name: 'Suresh Kumar', phone: '9876543210', balance: '5000.00', balance_status: 'due' },
        { id: 'c2', name: 'Anita Devi', phone: '9123456789', balance: '7500.00', balance_status: 'due' },
      ],
      due_count: 2,
    });
    (ledgerService.getAllTransactions as ReturnType<typeof vi.fn>).mockResolvedValue({ results: [] });
    (authService.getBusinessProfile as ReturnType<typeof vi.fn>).mockResolvedValue({ business_name: 'Ramesh General Store' });

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText('TOTAL DUE')).toBeInTheDocument();
    });

    expect(screen.getByText('₹12,500')).toBeInTheDocument();
    expect(screen.getByText('Suresh Kumar')).toBeInTheDocument();
    expect(screen.getByText('Anita Devi')).toBeInTheDocument();
  });

  it('renders error state when dashboard query fails', async () => {
    (ledgerService.getDashboard as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
    (ledgerService.getAllTransactions as ReturnType<typeof vi.fn>).mockResolvedValue({ results: [] });
    (authService.getBusinessProfile as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText(/Couldn't load Hisab dashboard/i)).toBeInTheDocument();
    });
  });
});
