import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../../services/customer.service';
import { ledgerService } from '../../services/ledger.service';
import { showToast } from '../ui/Toast';
import { getErrorMessage } from '../../utils/format';
import {
  trackOnboardingStarted,
  trackOnboardingStep,
  trackOnboardingCompleted,
  trackOnboardingSkipped,
  trackCustomerAdded,
  trackTransactionCreated,
} from '../../utils/analytics';

const ONBOARDING_KEY = 'hisab_onboarding_complete';

/** Check if onboarding has been completed */
export function isOnboardingComplete(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  } catch {
    return false;
  }
}

/** Mark onboarding as done */
function markOnboardingComplete() {
  try {
    localStorage.setItem(ONBOARDING_KEY, 'true');
  } catch {}
}

interface OnboardingWizardProps {
  ownerName: string;
  onComplete: () => void;
}

type Step = 'welcome' | 'add_customer' | 'add_transaction' | 'done';

const STEPS: { key: Step; num: number; label: string }[] = [
  { key: 'welcome', num: 1, label: 'Welcome' },
  { key: 'add_customer', num: 2, label: 'Add Customer' },
  { key: 'add_transaction', num: 3, label: 'First Entry' },
  { key: 'done', num: 4, label: 'Ready!' },
];

export function OnboardingWizard({ ownerName, onComplete }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('welcome');
  const [hasStarted, setHasStarted] = useState(false);

  // Customer form state
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custError, setCustError] = useState('');
  const [createdCustomerId, setCreatedCustomerId] = useState('');
  const [createdCustomerName, setCreatedCustomerName] = useState('');

  // Transaction form state
  const [txnAmount, setTxnAmount] = useState('');
  const [txnItem, setTxnItem] = useState('');
  const [txnError, setTxnError] = useState('');

  // Start onboarding tracking
  const handleStart = () => {
    setHasStarted(true);
    trackOnboardingStarted();
    trackOnboardingStep(1, 'welcome');
    setStep('add_customer');
  };

  // Skip entire onboarding
  const handleSkip = () => {
    const currentIdx = STEPS.findIndex((s) => s.key === step);
    trackOnboardingSkipped(currentIdx + 1);
    markOnboardingComplete();
    onComplete();
  };

  // ─── ADD CUSTOMER MUTATION ────────────────────────────────────────
  const customerMutation = useMutation({
    mutationFn: async (data: { name: string; phone?: string }) => {
      return await customerService.create(data);
    },
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setCreatedCustomerId(customer.id);
      setCreatedCustomerName(customer.name);
      trackCustomerAdded('onboarding');
      trackOnboardingStep(2, 'add_customer');
      setStep('add_transaction');
    },
    onError: (err) => {
      setCustError(getErrorMessage(err));
    },
  });

  function handleCustomerSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCustError('');
    if (!custName.trim()) {
      setCustError('Customer name is required.');
      return;
    }
    customerMutation.mutate({
      name: custName.trim(),
      phone: custPhone.trim() || undefined,
    });
  }

  // ─── ADD TRANSACTION MUTATION ─────────────────────────────────────
  const txnMutation = useMutation({
    mutationFn: async (data: {
      type: 'credit';
      amount: string;
      description: string;
      quantity: string;
      transaction_date: string;
    }) => {
      return await ledgerService.createTransaction(createdCustomerId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      trackTransactionCreated('credit', 'onboarding', parseFloat(txnAmount));
      trackOnboardingStep(3, 'add_transaction');
      setStep('done');
    },
    onError: (err) => {
      setTxnError(getErrorMessage(err));
    },
  });

  function handleTxnSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTxnError('');
    const num = parseFloat(txnAmount);
    if (!txnAmount || isNaN(num) || num <= 0) {
      setTxnError('Enter a valid amount greater than ₹0.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    txnMutation.mutate({
      type: 'credit',
      amount: txnAmount,
      description: txnItem.trim() || 'First entry',
      quantity: '',
      transaction_date: today,
    });
  }

  // ─── FINISH ONBOARDING ────────────────────────────────────────────
  function handleFinish() {
    trackOnboardingCompleted();
    markOnboardingComplete();
    showToast('Your digital khata is ready! 🎉', 'success');
    onComplete();
  }

  const currentStepIdx = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-parchment-50 max-w-lg w-full rounded-3xl border-2 border-parchment-300 shadow-2xl overflow-hidden">
        {/* ── PROGRESS BAR ────────────────────────────────────────── */}
        <div className="bg-forest-900 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div
                key={s.key}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i <= currentStepIdx
                    ? 'bg-gold-400 shadow-sm shadow-gold-400/50'
                    : 'bg-forest-700'
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] text-gold-300/70 font-bold uppercase tracking-widest font-serif">
            Step {currentStepIdx + 1} of {STEPS.length}
          </span>
        </div>

        {/* ── STEP CONTENT ────────────────────────────────────────── */}
        <div className="p-6 space-y-5">
          {/* ═════════ WELCOME STEP ═════════ */}
          {step === 'welcome' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-forest-900 rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-gold-500/40">
                📖
              </div>
              <h2 className="text-2xl font-black font-serif text-stone-900">
                Welcome, {ownerName}! 👋
              </h2>
              <p className="text-sm text-stone-600 font-medium leading-relaxed max-w-sm mx-auto">
                Let's set up your <strong>digital Bahi Khata</strong> in under 60 seconds.
                We'll add your first customer and record your first entry.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={handleStart}
                  className="w-full py-3.5 bg-forest-900 hover:bg-forest-950 text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-98"
                  id="onboarding-start"
                >
                  Let's Start! ✨
                </button>
                <button
                  onClick={handleSkip}
                  className="text-xs text-stone-500 hover:text-stone-700 font-bold py-2"
                  id="onboarding-skip"
                >
                  Skip, I'll explore on my own
                </button>
              </div>
            </div>
          )}

          {/* ═════════ ADD CUSTOMER STEP ═════════ */}
          {step === 'add_customer' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 mx-auto bg-stone-800 rounded-xl flex items-center justify-center text-xl shadow">
                  👤
                </div>
                <h2 className="text-xl font-black font-serif text-stone-900">
                  Add your first customer
                </h2>
                <p className="text-xs text-stone-500 font-medium">
                  Who do you give udhari to? Add them here.
                </p>
              </div>

              <form onSubmit={handleCustomerSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="e.g. Aamir Khan"
                    className="input text-xs"
                    autoFocus
                    id="onboarding-cust-name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="input text-xs"
                    id="onboarding-cust-phone"
                  />
                </div>

                {custError && (
                  <p className="text-[11px] text-rose-700 font-bold bg-rose-50 px-3 py-2 rounded-lg border border-rose-200">
                    {custError}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={customerMutation.isPending}
                    className="flex-1 py-3 bg-forest-900 hover:bg-forest-950 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-60"
                    id="onboarding-save-customer"
                  >
                    {customerMutation.isPending ? 'Saving…' : 'Save & Continue →'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="px-4 py-3 text-xs text-stone-500 hover:text-stone-700 font-bold rounded-xl hover:bg-parchment-200 transition-colors"
                  >
                    Skip
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ═════════ ADD TRANSACTION STEP ═════════ */}
          {step === 'add_transaction' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 mx-auto bg-rose-800 rounded-xl flex items-center justify-center text-xl text-white shadow">
                  ✍️
                </div>
                <h2 className="text-xl font-black font-serif text-stone-900">
                  Record your first udhari
                </h2>
                <p className="text-xs text-stone-500 font-medium">
                  How much did <strong className="text-stone-800">{createdCustomerName}</strong> take on credit?
                </p>
              </div>

              <form onSubmit={handleTxnSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={txnAmount}
                    onChange={(e) => setTxnAmount(e.target.value)}
                    placeholder="e.g. 500"
                    className="input text-xs font-tabular"
                    min="1"
                    step="any"
                    autoFocus
                    id="onboarding-txn-amount"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Item / Reason (optional)
                  </label>
                  <input
                    type="text"
                    value={txnItem}
                    onChange={(e) => setTxnItem(e.target.value)}
                    placeholder="e.g. Rice, Sugar, Oil"
                    className="input text-xs"
                    id="onboarding-txn-item"
                  />
                </div>

                {txnError && (
                  <p className="text-[11px] text-rose-700 font-bold bg-rose-50 px-3 py-2 rounded-lg border border-rose-200">
                    {txnError}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={txnMutation.isPending}
                    className="flex-1 py-3 bg-rose-800 hover:bg-rose-900 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-60"
                    id="onboarding-save-txn"
                  >
                    {txnMutation.isPending ? 'Saving…' : 'Record Entry (+ Given) →'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="px-4 py-3 text-xs text-stone-500 hover:text-stone-700 font-bold rounded-xl hover:bg-parchment-200 transition-colors"
                  >
                    Skip
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ═════════ DONE STEP ═════════ */}
          {step === 'done' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl shadow border border-emerald-300">
                🎉
              </div>
              <h2 className="text-2xl font-black font-serif text-stone-900">
                Your khata is ready!
              </h2>
              <p className="text-sm text-stone-600 font-medium leading-relaxed max-w-sm mx-auto">
                You've added <strong>{createdCustomerName}</strong> and recorded your first entry of{' '}
                <strong className="text-rose-800">₹{txnAmount}</strong>. Your digital Bahi Khata is live!
              </p>

              <div className="bg-parchment-200 rounded-xl p-4 text-xs text-stone-700 font-bold space-y-2 text-left border border-parchment-300">
                <p className="text-[10px] uppercase tracking-wider text-stone-500 font-black">Quick tips:</p>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-700">✓</span>
                  <span>Use <strong>"+ Given"</strong> button to record udhari</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-700">✓</span>
                  <span>Use <strong>"Payment"</strong> button when customer pays</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-700">✓</span>
                  <span>Click any customer to see their full khata history</span>
                </div>
              </div>

              <button
                onClick={handleFinish}
                className="w-full py-3.5 bg-forest-900 hover:bg-forest-950 text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-98"
                id="onboarding-finish"
              >
                Go to My Dashboard →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
