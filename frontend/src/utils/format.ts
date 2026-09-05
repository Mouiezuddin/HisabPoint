import type { BalanceStatus } from '../types';

/**
 * Format a balance string as Indian currency with ₹ symbol.
 * Example: "3500.00" → "₹3,500"
 */
export function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '₹0';

  const abs = Math.abs(num);
  return '₹' + abs.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Format a date string or Date for display.
 * Example: "2026-09-02" → "02 Sep"
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00'); // Avoid timezone issues
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
}

/**
 * Format a date string for display with year.
 */
export function formatDateFull(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Get today's date as YYYY-MM-DD for form default values.
 */
export function todayAsInputDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Return greeting based on current hour.
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Get display label for balance status.
 */
export function getBalanceLabel(status: BalanceStatus): string {
  switch (status) {
    case 'due': return 'Due';
    case 'settled': return 'Settled';
    case 'advance': return 'Advance';
  }
}

/**
 * Extract a human-readable error message from an Axios error.
 */
export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { message?: string } } }).response;
    return resp?.data?.message || 'Something went wrong. Please try again.';
  }
  return 'Could not connect to the server. Check your internet connection.';
}
