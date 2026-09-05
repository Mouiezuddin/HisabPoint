/**
 * Secure authentication state utilities.
 * Authentication tokens are stored in secure HttpOnly, SameSite cookies managed by the backend.
 * LocalStorage token persistence has been completely removed to prevent XSS credential theft.
 */

export function clearTokens(): void {
  // Legacy cleanup if any tokens exist in localStorage
  try {
    localStorage.removeItem('ledger_tokens');
  } catch {
    // Ignore
  }
}
