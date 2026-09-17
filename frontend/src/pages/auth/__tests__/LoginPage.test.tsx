import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../LoginPage';

const mockLogin = vi.fn();
const mockVerify2FA = vi.fn();
const mockLoginWithGoogle = vi.fn();

vi.mock('../../../features/auth/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    verify2FA: mockVerify2FA,
    loginWithGoogle: mockLoginWithGoogle,
  }),
}));

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: () => <div>MockGoogleLogin</div>,
}));

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

describe('LoginPage Rate Limiting & Lockout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders standard login form with active inputs', () => {
    renderLoginPage();
    const emailInput = screen.getByLabelText(/Email or Phone Number/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/^Password$/i) as HTMLInputElement;
    const submitBtn = screen.getByRole('button', { name: /Sign In to Khata/i });

    expect(emailInput).not.toBeDisabled();
    expect(passwordInput).not.toBeDisabled();
    expect(submitBtn).not.toBeDisabled();
  });

  it('displays warning badge when remaining attempts is returned on 401', async () => {
    mockLogin.mockRejectedValueOnce({
      response: {
        status: 401,
        data: {
          message: 'Invalid email or password. 3 attempts remaining before a 30-minute lockout.',
          locked: false,
          remaining_attempts: 3,
        },
      },
    });

    renderLoginPage();
    const emailInput = screen.getByLabelText(/Email or Phone Number/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In to Khata/i });

    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Security Notice:/i)).toBeInTheDocument();
      expect(screen.getAllByText(/3 attempts remaining before a 30-minute lockout/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('locks the form and starts 30-minute countdown when HTTP 429 is received', async () => {
    mockLogin.mockRejectedValueOnce({
      response: {
        status: 429,
        data: {
          message: 'Too many failed login attempts. Your account has been locked for 30 minutes.',
          locked: true,
          retry_after: 1800,
          remaining_attempts: 0,
        },
      },
    });

    renderLoginPage();
    const emailInput = screen.getByLabelText(/Email or Phone Number/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/^Password$/i) as HTMLInputElement;
    const submitBtn = screen.getByRole('button', { name: /Sign In to Khata/i });

    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Account Locked \(5 Failed Attempts\)/i)).toBeInTheDocument();
      expect(screen.getAllByText(/30:00/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('button', { name: /Locked/i })).toBeInTheDocument();
    });

    // Inputs and submit button must be disabled
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(screen.getByRole('button', { name: /Locked/i })).toBeDisabled();

    // Verify lockout saved in localStorage
    expect(localStorage.getItem('hisab_login_lockout_until')).toBeTruthy();
  });

  it('restores lockout state from localStorage on mount', () => {
    // Set lockout to expire 15 minutes from now
    const fifteenMinutesFromNow = Date.now() + 15 * 60 * 1000;
    localStorage.setItem('hisab_login_lockout_until', fifteenMinutesFromNow.toString());

    renderLoginPage();

    expect(screen.getByText(/Account Locked \(5 Failed Attempts\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/15:00/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /Locked/i })).toBeInTheDocument();

    const emailInput = screen.getByLabelText(/Email or Phone Number/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/^Password$/i) as HTMLInputElement;
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
  });

  it('triggers 30-minute lockout on 5th consecutive failed attempt even with generic 401', async () => {
    mockLogin.mockRejectedValue({
      response: {
        status: 401,
        data: { message: 'Invalid email or password.' },
      },
    });

    renderLoginPage();
    const emailInput = screen.getByLabelText(/Email or Phone Number/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In to Khata/i });

    // 4 failed attempts
    for (let i = 1; i <= 4; i++) {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
      fireEvent.click(submitBtn);
      await waitFor(() => {
        expect(screen.getByText(new RegExp(`${5 - i} attempt`, 'i'))).toBeInTheDocument();
      });
    }

    // 5th failed attempt triggers lockout
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText(/Account Locked \(5 Failed Attempts\)/i)).toBeInTheDocument();
      expect(screen.getAllByText(/30:00/i).length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByRole('button', { name: /Locked/i })).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
  });
});
