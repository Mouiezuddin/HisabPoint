/**
 * Secure authentication state utilities.
 * Authentication tokens are stored in secure HttpOnly, SameSite cookies managed by the backend.
 * LocalStorage token persistence has been completely removed to prevent XSS credential theft.
 */

export function clearTokens(): void {
  try {
    localStorage.removeItem('ledger_tokens');
    localStorage.removeItem('ledger_access_token');
    localStorage.removeItem('ledger_refresh_token');
  } catch {
    // Ignore
  }
}
