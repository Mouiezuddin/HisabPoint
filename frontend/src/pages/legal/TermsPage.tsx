import React from 'react';
import { useNavigate } from 'react-router-dom';

export function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-wood-desk text-stone-900 selection:bg-gold-500 selection:text-forest-950 font-sans p-4 sm:p-8">
      <div className="max-w-4xl mx-auto bg-[#f7f4ea] rounded-3xl border-4 border-[#d4af37]/60 shadow-2xl p-6 sm:p-10 relative leather-stitch bg-paper-lines">
        {/* Navigation Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-[#d6cbaf] gap-4">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <img
              src="/logo-mark.webp"
              alt="HisabPoint Logo"
              className="w-10 h-10 rounded-xl object-contain shadow-sm border border-[#c4b595] bg-[#f7f4ea]"
            />
            <div>
              <span className="text-2xl font-black font-serif text-[#194a32] tracking-tight group-hover:underline">
                HisabPoint
              </span>
              <p className="text-[11px] text-[#786f62] font-semibold">Terms of Service & Data Processing Addendum</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <button
              onClick={() => navigate('/privacy')}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-[#d6cbaf] bg-white text-[#194a32] hover:bg-[#eae3d2] transition-colors"
            >
              Privacy Policy →
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-[#d6cbaf] bg-white text-stone-700 hover:bg-[#eae3d2] transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="space-y-2 mb-8">
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
            Legal Terms & Data Processing Addendum (DPA)
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-serif text-[#194a32]">
            Terms of Service
          </h1>
          <p className="text-xs text-[#786f62]">
            Effective: September 2026 • Governed by laws of India and DPDP Act 2023
          </p>
        </div>

        <div className="space-y-6 text-sm text-[#423b32] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold font-serif text-[#194a32]">1. Agreement to Terms</h2>
            <p>
              By creating an account or using HisabPoint (&quot;the Service&quot;), operated by HisabPoint Technologies (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;), you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service and our statutory Privacy Policy.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold font-serif text-[#194a32]">2. Eligibility & Age Restriction (DPDP Section 9)</h2>
            <p>
              The Service is strictly intended for individuals who are at least 18 years of age and legally capable of entering into binding contracts under the Indian Contract Act, 1872. In accordance with Section 9 of the Digital Personal Data Protection Act, 2023, HisabPoint does not process or solicit personal data of minors.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold font-serif text-[#194a32]">3. Roles under DPDP Act & Data Processing Addendum (DPA)</h2>
            <div className="bg-white p-4 rounded-2xl border border-[#e5dec8] space-y-3 text-xs">
              <p>
                <strong>3.1 Shopkeeper as Data Fiduciary:</strong> When you enter names, phone numbers, and financial credit amounts of your shop customers, you represent and warrant that you have obtained appropriate consent or have a legitimate lawful ground under applicable law to record such information in your ledger.
              </p>
              <p>
                <strong>3.2 HisabPoint as Data Processor:</strong> HisabPoint processes end-customer personal data solely on your instructions to maintain the ledger, compute balances, generate invoices, and facilitate merchant-requested reminders.
              </p>
              <p>
                <strong>3.3 Data Confidentiality & Sub-processing:</strong> HisabPoint maintains technical and organizational measures (encryption in transit, tenant database separation, HttpOnly authentication) to ensure customer records are not disclosed to any third party without merchant authorization.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold font-serif text-[#194a32]">4. Account Security & Two-Factor Authentication</h2>
            <p>
              You are responsible for maintaining the confidentiality of your login credentials. We strongly advise enabling Two-Factor Authentication (2FA) via Settings. You must notify us immediately at <a href="mailto:support@hisabpoint.com" className="text-[#194a32] underline font-bold">support@hisabpoint.com</a> upon suspecting any unauthorized access.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold font-serif text-[#194a32]">5. Right to Erasure & Termination</h2>
            <p>
              You may terminate this agreement and delete your account at any time. Under Section 12(1)(b) of the DPDP Act 2023, performing an account deletion permanently erases all merchant profile data, customer lists, transactions, and invoices from our live servers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold font-serif text-[#194a32]">6. Limitation of Liability</h2>
            <p>
              HisabPoint is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis as a bookkeeping assistant. While we implement strict database backups and transaction atomicity, you remain solely responsible for the accuracy of credit and payment amounts recorded with your customers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold font-serif text-[#194a32]">7. Dispute Resolution & Jurisdiction</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the Republic of India. Any legal dispute arising out of or related to these Terms shall be subject to the exclusive jurisdiction of the competent courts in New Delhi, India.
            </p>
          </section>
        </div>

        {/* Footer actions */}
        <div className="mt-8 pt-6 border-t border-[#d6cbaf] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#786f62]">
          <p>© 2026 HisabPoint Technologies. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/privacy')} className="hover:text-[#194a32] font-bold underline">
              Privacy Policy
            </button>
            <button onClick={() => navigate('/')} className="hover:text-[#194a32] font-bold">
              Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
