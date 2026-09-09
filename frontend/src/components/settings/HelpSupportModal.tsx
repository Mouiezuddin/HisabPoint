import React, { useState } from 'react';
import { Modal } from '../ui/Modal';

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'How is customer balance calculated?',
    answer:
      'Balance is computed automatically: Total Credit (Given) minus Total Payments (Received). If positive, the customer owes you money ("Due"). If negative, the customer has deposited advance balance ("Advance").',
  },
  {
    question: 'How do WhatsApp payment reminders work?',
    answer:
      'Click the "💬 WhatsApp" button on any customer page. HisabPoint formats a professional, polite payment reminder with the exact due balance and opens WhatsApp directly on your phone or desktop.',
  },
  {
    question: 'Can I install HisabPoint on my phone or computer?',
    answer:
      'Yes! HisabPoint is an installable Progressive Web App (PWA). Click "Install HisabPoint App" in Settings to add it to your home screen or desktop for 1-tap khata access without downloading heavy app store files.',
  },
  {
    question: 'Are my shop and ledger records backed up safely?',
    answer:
      'Every single ledger entry is stored in an encrypted PostgreSQL cloud database. Even if your physical computer or phone is lost, stolen, or damaged, your financial data remains 100% safe and recoverable.',
  },
  {
    question: 'How can I download reports or ledger summaries?',
    answer:
      'Navigate to the Reports page from the navigation bar. You can view total credit given, payments collected, and export customer ledger summaries.',
  },
];

export function HelpSupportModal({ isOpen, onClose }: HelpSupportModalProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  function toggleFaq(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Help & Support">
      <div className="space-y-4 pt-1 max-h-[75vh] overflow-y-auto pr-1">
        {/* Support Channels Card */}
        <div className="bg-parchment-200/60 rounded-2xl p-4 border border-parchment-300 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏪</span>
            <div>
              <h3 className="text-xs font-bold text-stone-900 font-serif">Customer Care Desk</h3>
              <p className="text-[11px] text-stone-500">Available Mon – Sat, 9:00 AM – 9:00 PM IST</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href="https://wa.me/?text=Hello%20HisabPoint%20Support,%20I%20need%20assistance%20with%20my%20digital%20khata."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-transform active:scale-95"
            >
              <span>💬 WhatsApp</span>
            </a>
            <a
              href="mailto:support@hisabpoint.com?subject=HisabPoint%20Customer%20Support"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-forest-900 hover:bg-forest-950 text-gold-300 rounded-xl text-xs font-bold shadow-sm transition-transform active:scale-95"
            >
              <span>✉️ Email Us</span>
            </a>
          </div>
        </div>

        {/* FAQs Header */}
        <div className="pt-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-stone-500 font-serif mb-2">
            Frequently Asked Questions
          </h4>

          <div className="space-y-2">
            {FAQS.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-parchment-50 rounded-xl border border-parchment-300 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left p-3 flex items-center justify-between gap-2 hover:bg-parchment-100 transition-colors"
                  >
                    <span className="text-xs font-bold text-stone-900">{faq.question}</span>
                    <span className="text-stone-400 font-bold text-xs shrink-0">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3 text-xs text-stone-600 leading-relaxed border-t border-parchment-200/60 pt-2">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-parchment-200 hover:bg-parchment-300 text-stone-800 font-bold text-xs rounded-xl border border-parchment-300 transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
