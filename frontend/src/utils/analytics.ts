/**
 * GA4 Analytics Event Tracking Utility
 *
 * Centralizes all Google Analytics custom event calls.
 * The gtag script is loaded in index.html (G-VZNMZ3W6VH).
 * This module provides typed helpers so every business-critical
 * user action is tracked as a GA4 custom event.
 */

// Extend the Window interface to include gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Core event dispatcher — fires a GA4 custom event.
 * Silently no-ops if gtag is not loaded (e.g. ad-blockers).
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
) {
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, params);
    }
  } catch {
    // Analytics should never break the app
  }
}

// ─── AUTH EVENTS ────────────────────────────────────────────────────────────

/** User successfully creates a new account */
export function trackSignUp(method: 'email' | 'google') {
  trackEvent('sign_up', { method });
}

/** User successfully logs in */
export function trackLogin(method: 'email' | 'google' | '2fa') {
  trackEvent('login', { method });
}

// ─── CUSTOMER EVENTS ────────────────────────────────────────────────────────

/** User adds a new customer to their khata */
export function trackCustomerAdded(source: 'add_page' | 'onboarding' | 'offline') {
  trackEvent('customer_added', { source });
}

// ─── TRANSACTION / LEDGER EVENTS ────────────────────────────────────────────

/** User records a credit (given) or payment (received) */
export function trackTransactionCreated(
  type: 'credit' | 'payment',
  source: 'quick_modal' | 'customer_detail' | 'add_page' | 'onboarding' | 'offline',
  amount?: number,
) {
  trackEvent('transaction_created', {
    transaction_type: type,
    source,
    ...(amount !== undefined && { value: amount }),
  });
}

// ─── INVOICE / BILLING EVENTS ───────────────────────────────────────────────

/** User creates a new invoice/bill */
export function trackInvoiceCreated() {
  trackEvent('invoice_created');
}

// ─── PWA EVENTS ─────────────────────────────────────────────────────────────

/** User installs the PWA on their device */
export function trackPWAInstalled() {
  trackEvent('pwa_installed');
}

// ─── LANDING PAGE / DEMO EVENTS ─────────────────────────────────────────────

/** User clicks "Try Live Demo" on the landing page */
export function trackDemoStarted() {
  trackEvent('demo_started');
}

/** User clicks CTA on landing page */
export function trackLandingCTA(cta: 'login' | 'register' | 'demo' | 'see_how' | 'install') {
  trackEvent('landing_cta_click', { cta });
}

// ─── ONBOARDING EVENTS ─────────────────────────────────────────────────────

/** User starts the onboarding wizard */
export function trackOnboardingStarted() {
  trackEvent('onboarding_started');
}

/** User completes a specific onboarding step */
export function trackOnboardingStep(step: number, stepName: string) {
  trackEvent('onboarding_step', { step, step_name: stepName });
}

/** User completes the full onboarding wizard */
export function trackOnboardingCompleted() {
  trackEvent('onboarding_completed');
}

/** User skips the onboarding wizard */
export function trackOnboardingSkipped(atStep: number) {
  trackEvent('onboarding_skipped', { skipped_at_step: atStep });
}

// ─── ENGAGEMENT EVENTS ─────────────────────────────────────────────────────

/** User performs a search action */
export function trackSearch(context: 'dashboard' | 'customers') {
  trackEvent('search_used', { context });
}

/** User generates/views a report */
export function trackReportViewed() {
  trackEvent('report_viewed');
}
