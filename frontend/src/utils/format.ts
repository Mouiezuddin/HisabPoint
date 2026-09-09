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
 * Extract a human-readable error message from an Axios error or generic error.
 */
export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    // Check for Axios response errors
    if ('response' in error) {
      const resp = (error as { response?: { data?: Record<string, unknown>; status?: number } }).response;
      const data = resp?.data;
      if (data && typeof data === 'object') {
        if (typeof data.message === 'string' && data.message) {
          return data.message;
        }
        if (typeof data.error === 'string' && data.error) {
          return data.error;
        }
        if (typeof data.detail === 'string' && data.detail) {
          return data.detail;
        }
        // Check for field-specific errors e.g. { email: ["User already exists."] }
        for (const val of Object.values(data)) {
          if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') {
            return val[0];
          }
          if (typeof val === 'string' && val) {
            return val;
          }
        }
      }
      return 'Something went wrong. Please try again.';
    }

    // Check for timeout or aborted connections
    const errObj = error as { code?: string; message?: string };
    if (errObj.code === 'ECONNABORTED' || errObj.message?.toLowerCase().includes('timeout')) {
      return 'The server took too long to respond. Render may be waking up from sleep — please try again in a few seconds.';
    }
  }
  return 'Could not connect to the server. Check your internet connection.';
}
