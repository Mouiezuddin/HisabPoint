import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type ModalType = 'how-it-works' | 'features' | 'benefits' | 'pricing' | 'reviews' | 'faq' | null;

export function LandingPage() {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f4ea] text-[#2c2825] font-sans selection:bg-[#194a32] selection:text-white flex flex-col antialiased">
      {/* ── TOP HEADER NAVBAR ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#f7f4ea]/95 backdrop-blur-md border-b border-[#e5dec8] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-11 h-11 rounded-xl bg-[#194a32] flex items-center justify-center shadow-md border border-[#2d6447] text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <path d="M8 7h8" />
                <path d="M8 11h6" />
              </svg>
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-[#194a32] font-serif">
                HisabPoint
              </span>
              <p className="text-[11px] font-semibold text-[#665e52] tracking-wide">
                Your shop's khata, made digital.
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-[#4a433b]">
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-[#194a32] transition-colors py-1"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-[#194a32] transition-colors py-1"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('benefits')}
              className="hover:text-[#194a32] transition-colors py-1"
            >
              Benefits
            </button>
            <button
              onClick={() => setActiveModal('pricing')}
              className="hover:text-[#194a32] transition-colors py-1"
            >
              Pricing
            </button>
            <button
              onClick={() => setActiveModal('reviews')}
              className="hover:text-[#194a32] transition-colors py-1"
            >
              Reviews
            </button>
            <button
              onClick={() => setActiveModal('faq')}
              className="hover:text-[#194a32] transition-colors py-1"
            >
              FAQ
            </button>
          </nav>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              id="landing-btn-login"
              className="px-5 py-2.5 text-sm font-bold text-[#332c25] bg-[#ece5d5] hover:bg-[#e4dcc9] border border-[#d8cea0] rounded-xl transition-all shadow-sm"
            >
              Log In
            </button>
            <button
              onClick={() => navigate('/register')}
              id="landing-btn-register"
              className="px-5 py-2.5 text-sm font-bold text-white bg-[#194a32] hover:bg-[#133c28] rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Get Started Free</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 w-full">
        {/* Title & Subtitle */}
        <div className="max-w-3xl space-y-5 text-left mb-10">
          <h1 className="text-4xl sm:text-6xl font-black font-serif text-[#1b1714] leading-[1.12] tracking-tight">
            Your shop’s khata,<br />made digital.
          </h1>

          <p className="text-base sm:text-xl text-[#524b42] font-medium leading-relaxed max-w-2xl">
            Track customers, record payments, and know exactly who owes you — without complicated accounting software.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => navigate('/login')}
              id="hero-btn-login"
              className="px-7 py-4 text-base font-bold text-white bg-[#194a32] hover:bg-[#133c28] rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <span>Log In to Your Account</span>
              <span className="text-lg">→</span>
            </button>

            <button
              onClick={() => navigate('/register')}
              id="hero-start-free"
              className="px-6 py-4 text-base font-bold text-[#194a32] bg-[#ece5d5] hover:bg-[#e2d8c3] border border-[#cfc4a6] rounded-xl transition-all flex items-center gap-2 shadow-sm"
            >
              <span>Get Started Free</span>
            </button>

            <button
              onClick={() => scrollToSection('how-it-works')}
              id="hero-see-how"
              className="px-5 py-4 text-base font-bold text-[#2d2721] bg-transparent hover:bg-[#eae3d2]/60 rounded-xl transition-all flex items-center gap-2"
            >
              <div className="w-6 h-6 rounded-full bg-[#194a32] text-white flex items-center justify-center text-xs">
                ▶
              </div>
              <span>See How It Works</span>
            </button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center gap-8 pt-6 text-xs sm:text-sm font-bold text-[#5c5449]">
            <div className="flex items-center gap-2">
              <span className="text-emerald-700 text-base">🛡️</span>
              <div>
                <p className="font-bold text-[#2b251f]">100% Safe</p>
                <p className="text-[11px] text-[#786f62] font-normal">Your data is secure</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-amber-700 text-base">⚡</span>
              <div>
                <p className="font-bold text-[#2b251f]">Super Easy</p>
                <p className="text-[11px] text-[#786f62] font-normal">No accounting skills needed</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-blue-700 text-base">📱</span>
              <div>
                <p className="font-bold text-[#2b251f]">Works Everywhere</p>
                <p className="text-[11px] text-[#786f62] font-normal">Mobile, tablet and desktop</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Visual Display: Paper Notebook vs Laptop & Smartphone */}
        <div className="relative mt-8 bg-[#e8e2d2]/70 rounded-3xl p-4 sm:p-8 border border-[#d6cbaf] shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Handwritten Paper Customer Ledger */}
            <div className="lg:col-span-5 bg-[#faf6ed] text-[#2c2825] rounded-2xl p-5 sm:p-6 border border-[#dcd3bc] shadow-md relative font-serif">
              {/* Spiral rings on top */}
              <div className="flex justify-between items-center -mt-8 mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="w-2.5 h-5 bg-[#5c5449] rounded-full shadow-inner border border-[#3b362e]" />
                ))}
              </div>

              <div className="flex justify-between items-center border-b border-[#ded5be] pb-3 mb-3">
                <span className="font-bold text-lg text-[#194a32]">Customer Ledger</span>
                <span className="text-xs text-[#786f62] font-sans font-medium">Page 42</span>
              </div>

              <table className="w-full text-xs font-sans">
                <thead>
                  <tr className="border-b border-[#ded5be] text-[#786f62] text-left">
                    <th className="py-2">Name</th>
                    <th className="py-2 text-right">Due Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee6d4] font-medium text-[#2c2825]">
                  <tr>
                    <td className="py-2.5 font-bold">Aamir Khan</td>
                    <td className="py-2.5 text-right font-bold text-[#b91c1c]">3,500</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold">Rahul Patil</td>
                    <td className="py-2.5 text-right font-bold text-[#b91c1c]">2,200</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold">Sana</td>
                    <td className="py-2.5 text-right font-bold text-[#b91c1c]">800</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold">Imran Shaikh</td>
                    <td className="py-2.5 text-right font-bold text-[#b91c1c]">650</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold">Vijay More</td>
                    <td className="py-2.5 text-right font-bold text-[#b91c1c]">450</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#194a32] font-black text-sm">
                    <td className="py-3 font-serif text-[#194a32]">Total Due</td>
                    <td className="py-3 text-right font-bold text-[#b91c1c]">₹7,600</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Transition Arrow (Desktop view) */}
            <div className="hidden lg:flex lg:col-span-1 justify-center items-center">
              <div className="w-12 h-12 rounded-full bg-[#194a32] text-white flex items-center justify-center text-xl shadow-lg">
                →
              </div>
            </div>

            {/* Right: Laptop & Smartphone Mockup Screens */}
            <div className="lg:col-span-6 flex flex-col sm:flex-row gap-4 items-center justify-center">
              {/* Laptop Web Dashboard Screen */}
              <div className="w-full bg-[#1f2421] rounded-2xl p-2.5 border border-[#3b443e] shadow-2xl text-xs font-sans text-white">
                {/* Laptop Window Header */}
                <div className="flex items-center gap-1.5 px-2 pb-2 border-b border-[#313933] mb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="ml-2 text-[10px] text-[#9ca79e] font-mono">hisabpoint.com/dashboard</span>
                </div>

                {/* Web App Dashboard UI */}
                <div className="bg-[#f7f4ea] text-[#2c2825] rounded-xl p-3.5 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-[#665e52] font-semibold">Good evening, Moinuddin 👋</p>
                      <h3 className="font-bold text-sm text-[#194a32] font-serif">HisabPoint Ledger</h3>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-[#ffffff] p-2 rounded-lg border border-[#e5dec8] shadow-sm">
                      <p className="text-[9px] text-[#786f62] font-bold uppercase">Total Due</p>
                      <p className="text-xs font-black text-[#b91c1c]">₹84,500</p>
                      <p className="text-[8px] text-[#786f62]">27 customers</p>
                    </div>

                    <div className="bg-[#ffffff] p-2 rounded-lg border border-[#e5dec8] shadow-sm">
                      <p className="text-[9px] text-[#786f62] font-bold uppercase">Given Today</p>
                      <p className="text-xs font-black text-[#194a32]">₹4,200</p>
                    </div>

                    <div className="bg-[#ffffff] p-2 rounded-lg border border-[#e5dec8] shadow-sm">
                      <p className="text-[9px] text-[#786f62] font-bold uppercase">Received Today</p>
                      <p className="text-xs font-black text-emerald-700">₹2,800</p>
                    </div>
                  </div>

                  {/* Customers List Preview */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-bold text-[#665e52]">
                      <span>Customers with Due</span>
                      <span className="text-[#194a32]">View All</span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-[#e5dec8] flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#194a32] text-white flex items-center justify-center font-bold text-[10px]">
                          AK
                        </div>
                        <span className="font-bold text-[11px]">Aamir Khan</span>
                      </div>
                      <span className="font-black text-[#b91c1c] text-[11px]">₹3,500 Due</span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-[#e5dec8] flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#194a32] text-white flex items-center justify-center font-bold text-[10px]">
                          RP
                        </div>
                        <span className="font-bold text-[11px]">Rahul Patil</span>
                      </div>
                      <span className="font-black text-[#b91c1c] text-[11px]">₹2,200 Due</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Smartphone Screen Mockup */}
              <div className="w-48 bg-[#1f2421] rounded-[28px] p-2 border-2 border-[#3b443e] shadow-2xl flex-shrink-0">
                <div className="bg-[#f7f4ea] text-[#2c2825] rounded-[22px] p-2.5 space-y-2 text-[10px]">
                  <div className="text-center font-bold font-serif text-[#194a32] text-xs pb-1 border-b border-[#e5dec8]">
                    HisabPoint Mobile
                  </div>
                  <div className="bg-[#194a32] text-white p-2 rounded-xl text-center space-y-0.5">
                    <p className="text-[8px] opacity-80 uppercase font-bold">Total Due</p>
                    <p className="text-sm font-black">₹84,500</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-[#e5dec8] flex justify-between items-center">
                    <span>Aamir Khan</span>
                    <span className="font-bold text-[#b91c1c]">₹3,500</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: EVERYTHING YOUR DAILY KHATA NEEDS ─────────────────── */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#194a32] uppercase tracking-widest bg-[#eae3d2] px-3.5 py-1.5 rounded-full">
            ✦ Core Capabilities ✦
          </div>
          <h2 className="text-3xl sm:text-5xl font-black font-serif text-[#1c1815] tracking-tight">
            Everything your daily khata needs
          </h2>
        </div>

        {/* 6 Feature Cards Grid + Smartphone Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card 1 */}
            <div className="bg-[#ffffff] p-5 rounded-2xl border border-[#e5dec8] shadow-sm hover:shadow-md transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#194a32]/10 text-[#194a32] flex items-center justify-center text-xl font-bold">
                📱
              </div>
              <h3 className="font-bold text-base font-serif text-[#1c1815]">Customer Management</h3>
              <p className="text-xs text-[#665e52] font-medium leading-relaxed">
                Add customers and manage all details instantly with complete phone and address info.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#ffffff] p-5 rounded-2xl border border-[#e5dec8] shadow-sm hover:shadow-md transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#194a32]/10 text-[#194a32] flex items-center justify-center text-xl font-bold">
                📖
              </div>
              <h3 className="font-bold text-base font-serif text-[#1c1815]">Digital Ledger</h3>
              <p className="text-xs text-[#665e52] font-medium leading-relaxed">
                Record every transaction and keep your khata organized with line item notes and dates.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#ffffff] p-5 rounded-2xl border border-[#e5dec8] shadow-sm hover:shadow-md transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#194a32]/10 text-[#194a32] flex items-center justify-center text-xl font-bold">
                🧮
              </div>
              <h3 className="font-bold text-base font-serif text-[#1c1815]">Automatic Balance</h3>
              <p className="text-xs text-[#665e52] font-medium leading-relaxed">
                Balances are calculated automatically. No more manual math or calculator mistakes.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-[#ffffff] p-5 rounded-2xl border border-[#e5dec8] shadow-sm hover:shadow-md transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#194a32]/10 text-[#194a32] flex items-center justify-center text-xl font-bold">
                🔍
              </div>
              <h3 className="font-bold text-base font-serif text-[#1c1815]">Quick Search</h3>
              <p className="text-xs text-[#665e52] font-medium leading-relaxed">
                Find any customer or transaction in seconds by name or phone number.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-[#ffffff] p-5 rounded-2xl border border-[#e5dec8] shadow-sm hover:shadow-md transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#194a32]/10 text-[#194a32] flex items-center justify-center text-xl font-bold">
                🧾
              </div>
              <h3 className="font-bold text-base font-serif text-[#1c1815]">Payment Tracking</h3>
              <p className="text-xs text-[#665e52] font-medium leading-relaxed">
                Track payments, partial dues, and maintain a clear chronological history.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-[#ffffff] p-5 rounded-2xl border border-[#e5dec8] shadow-sm hover:shadow-md transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#194a32]/10 text-[#194a32] flex items-center justify-center text-xl font-bold">
                📊
              </div>
              <h3 className="font-bold text-base font-serif text-[#1c1815]">Simple Reports</h3>
              <p className="text-xs text-[#665e52] font-medium leading-relaxed">
                Understand your business with easy daily and monthly sales summaries.
              </p>
            </div>
          </div>

          {/* Right Smartphone Screen Mockup */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="w-full max-w-[280px] bg-[#1f2421] rounded-[36px] p-3 border-4 border-[#3b443e] shadow-2xl">
              <div className="bg-[#f7f4ea] rounded-[28px] p-4 space-y-3 font-sans text-xs text-[#2c2825]">
                <div className="flex justify-between items-center font-serif text-[#194a32] font-bold border-b border-[#e5dec8] pb-2">
                  <span>HisabPoint App</span>
                  <span>🔔</span>
                </div>

                <div className="bg-[#194a32] text-white p-3 rounded-2xl space-y-1 text-center shadow-sm">
                  <p className="text-[10px] text-[#e8e2d2] uppercase font-bold">Total Due</p>
                  <p className="text-2xl font-black font-serif">₹84,500</p>
                  <p className="text-[9px] text-emerald-200">Across 27 customers</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                  <div className="bg-white p-2 rounded-xl border border-[#e5dec8]">
                    <p className="text-[#786f62]">Given Today</p>
                    <p className="font-bold text-[#194a32]">₹4,200</p>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-[#e5dec8]">
                    <p className="text-[#786f62]">Received Today</p>
                    <p className="font-bold text-emerald-700">₹2,800</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] font-bold text-[#665e52]">Recent Activity</p>
                  <div className="bg-white p-2 rounded-xl border border-[#e5dec8] flex justify-between items-center text-[10px]">
                    <div>
                      <p className="font-bold">Aamir Khan</p>
                      <p className="text-[8px] text-[#786f62]">Payment</p>
                    </div>
                    <span className="font-bold text-emerald-700">₹500</span>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-[#e5dec8] flex justify-between items-center text-[10px]">
                    <div>
                      <p className="font-bold">Rahul Patil</p>
                      <p className="text-[8px] text-[#786f62]">Given</p>
                    </div>
                    <span className="font-bold text-[#b91c1c]">₹1,200</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: HOW IT WORKS ─────────────────────────────────────── */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full border-t border-[#e5dec8]">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#194a32] uppercase tracking-widest bg-[#eae3d2] px-3.5 py-1.5 rounded-full">
            ✦ Simple 4-Step Process ✦
          </div>
          <h2 className="text-3xl sm:text-5xl font-black font-serif text-[#1c1815] tracking-tight">
            How it works
          </h2>
        </div>

        {/* 4 Step Cards with arrows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-2xl border border-[#e5dec8] shadow-sm relative space-y-3">
            <div className="text-3xl font-black font-serif text-[#194a32]/20">01</div>
            <div className="w-10 h-10 rounded-xl bg-[#194a32] text-white flex items-center justify-center text-lg font-bold">
              👤
            </div>
            <h3 className="font-bold text-lg font-serif text-[#1c1815]">Add Customer</h3>
            <p className="text-xs text-[#665e52] font-medium leading-relaxed">
              Save your customer's basic details like name, phone number, and address.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-2xl border border-[#e5dec8] shadow-sm relative space-y-3">
            <div className="text-3xl font-black font-serif text-[#194a32]/20">02</div>
            <div className="w-10 h-10 rounded-xl bg-[#194a32] text-white flex items-center justify-center text-lg font-bold">
              🛍️
            </div>
            <h3 className="font-bold text-lg font-serif text-[#1c1815]">Record Given</h3>
            <p className="text-xs text-[#665e52] font-medium leading-relaxed">
              Add items or credit amount given to the customer at the counter.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-2xl border border-[#e5dec8] shadow-sm relative space-y-3">
            <div className="text-3xl font-black font-serif text-[#194a32]/20">03</div>
            <div className="w-10 h-10 rounded-xl bg-[#194a32] text-white flex items-center justify-center text-lg font-bold">
              💵
            </div>
            <h3 className="font-bold text-lg font-serif text-[#1c1815]">Record Payment</h3>
            <p className="text-xs text-[#665e52] font-medium leading-relaxed">
              Record any payment received from customer (full or partial).
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-6 rounded-2xl border border-[#e5dec8] shadow-sm relative space-y-3">
            <div className="text-3xl font-black font-serif text-[#194a32]/20">04</div>
            <div className="w-10 h-10 rounded-xl bg-[#194a32] text-white flex items-center justify-center text-lg font-bold">
              ✅
            </div>
            <h3 className="font-bold text-lg font-serif text-[#1c1815]">See the Balance</h3>
            <p className="text-xs text-[#665e52] font-medium leading-relaxed">
              HisabPoint calculates customer balance automatically in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: YOUR KHATA IN YOUR POCKET (MOBILE FIRST) ───────────── */}
      <section id="benefits" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full border-t border-[#e5dec8]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left: Mobile Screen showing Customer Detail View */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center space-y-6">
            <div className="w-full max-w-[320px] bg-[#1f2421] rounded-[42px] p-3 border-4 border-[#3b443e] shadow-2xl">
              <div className="bg-[#f7f4ea] text-[#2c2825] rounded-[34px] p-4 space-y-4 text-xs font-sans">
                {/* Header */}
                <div className="flex justify-between items-center border-b border-[#e5dec8] pb-2 font-serif font-bold text-sm">
                  <span>← Aamir Khan</span>
                  <span>⋮</span>
                </div>

                {/* Customer Balance Box */}
                <div className="bg-white p-4 rounded-2xl border border-[#e5dec8] text-center space-y-1 shadow-sm">
                  <p className="text-[10px] text-[#786f62] uppercase font-bold">Current Balance</p>
                  <p className="text-2xl font-black text-[#b91c1c] font-serif">₹3,500</p>
                  <span className="inline-block bg-rose-100 text-[#b91c1c] text-[10px] font-bold px-2 py-0.5 rounded">
                    Due
                  </span>

                  <div className="grid grid-cols-2 gap-2 pt-3">
                    <button className="bg-[#194a32] text-white py-2 text-xs font-bold rounded-xl">
                      + Given
                    </button>
                    <button className="bg-[#194a32] text-white py-2 text-xs font-bold rounded-xl">
                      - Payment
                    </button>
                  </div>
                </div>

                {/* History Timeline */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-[#665e52]">Transaction History</p>

                  <div className="bg-white p-2.5 rounded-xl border border-[#e5dec8] flex justify-between items-center">
                    <div>
                      <p className="font-bold text-[11px]">Rice + Oil</p>
                      <p className="text-[9px] text-[#786f62]">02 Sep</p>
                    </div>
                    <span className="font-black text-[#b91c1c]">₹1,200</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-[#e5dec8] flex justify-between items-center">
                    <div>
                      <p className="font-bold text-[11px]">Payment</p>
                      <p className="text-[9px] text-[#786f62]">01 Sep</p>
                    </div>
                    <span className="font-black text-emerald-700">₹500</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-[#e5dec8] flex justify-between items-center">
                    <div>
                      <p className="font-bold text-[11px]">Groceries</p>
                      <p className="text-[9px] text-[#786f62]">28 Aug</p>
                    </div>
                    <span className="font-black text-[#b91c1c]">₹900</span>
                  </div>
                </div>
              </div>
            </div>

            {/* App Store / Google Play badges */}
            <div className="flex flex-wrap justify-center gap-3">
              <div className="bg-black text-white px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer border border-stone-800 shadow-md">
                <span className="text-xl">▶</span>
                <div className="text-left">
                  <p className="text-[9px] uppercase font-bold text-stone-400">GET IT ON</p>
                  <p className="text-xs font-bold font-sans">Google Play</p>
                </div>
              </div>

              <div className="bg-black text-white px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer border border-stone-800 shadow-md">
                <span className="text-xl">🍏</span>
                <div className="text-left">
                  <p className="text-[9px] uppercase font-bold text-stone-400">Download on the</p>
                  <p className="text-xs font-bold font-sans">App Store</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Why Shopkeepers Love HisabPoint */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#194a32] uppercase tracking-widest bg-[#eae3d2] px-3.5 py-1.5 rounded-full">
                MOBILE FIRST
              </span>
              <h2 className="text-3xl sm:text-5xl font-black font-serif text-[#1c1815] tracking-tight">
                Your khata in your pocket
              </h2>
              <p className="text-sm sm:text-base text-[#665e52] font-medium leading-relaxed">
                Manage your customers, record transactions and track dues anytime, anywhere.
              </p>
            </div>

            {/* Checklist Card */}
            <div className="bg-white p-6 rounded-3xl border border-[#e5dec8] shadow-md space-y-4 relative overflow-hidden">
              <h3 className="text-xl font-bold font-serif text-[#194a32]">
                Why shopkeepers love HisabPoint
              </h3>

              <ul className="space-y-3 text-sm text-[#4a433b] font-semibold">
                <li className="flex items-center gap-3">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Very easy to use</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>No accounting knowledge required</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Track all customer dues in one place</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Works on mobile, tablet and desktop</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Secure, reliable and always with you</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: DARK GREEN BANNER ────────────────────────────────── */}
      <section className="bg-[#194a32] text-white py-14 my-8 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl sm:text-4xl font-black font-serif tracking-tight">
              Leave the notebook behind.<br />Keep the khata simple.
            </h2>
            <p className="text-sm text-[#d4e4db] font-medium max-w-xl">
              Start managing your customer records digitally with HisabPoint.
            </p>
          </div>

          <button
            onClick={() => navigate('/register')}
            id="banner-btn-register"
            className="px-8 py-4 text-base font-bold text-[#194a32] bg-[#f7f4ea] hover:bg-[#ffffff] rounded-2xl shadow-xl transition-all flex items-center gap-2 flex-shrink-0"
          >
            <span>Get Started Free</span>
            <span className="text-lg">→</span>
          </button>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="bg-[#e8e2d2]/60 border-t border-[#dcd3bc] pt-12 pb-8 text-xs font-medium text-[#5c5449]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          {/* Logo & Tagline */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#194a32] text-white flex items-center justify-center font-bold">
                📖
              </div>
              <span className="text-xl font-black font-serif text-[#194a32]">HisabPoint</span>
            </div>
            <p className="text-xs text-[#786f62]">Your shop's khata, made digital.</p>
          </div>

          {/* Product Links */}
          <div className="space-y-2">
            <p className="font-bold text-[#1c1815] uppercase tracking-wider text-[11px]">Product</p>
            <ul className="space-y-1.5">
              <li><button onClick={() => scrollToSection('features')} className="hover:text-[#194a32]">Features</button></li>
              <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-[#194a32]">How It Works</button></li>
              <li><button onClick={() => setActiveModal('pricing')} className="hover:text-[#194a32]">Pricing</button></li>
              <li><button onClick={() => setActiveModal('features')} className="hover:text-[#194a32]">Updates</button></li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-2">
            <p className="font-bold text-[#1c1815] uppercase tracking-wider text-[11px]">Company</p>
            <ul className="space-y-1.5">
              <li><button onClick={() => setActiveModal('benefits')} className="hover:text-[#194a32]">About Us</button></li>
              <li><button onClick={() => setActiveModal('faq')} className="hover:text-[#194a32]">Contact Us</button></li>
              <li><button onClick={() => setActiveModal('faq')} className="hover:text-[#194a32]">Privacy Policy</button></li>
              <li><button onClick={() => setActiveModal('faq')} className="hover:text-[#194a32]">Terms & Conditions</button></li>
            </ul>
          </div>

          {/* Support & Socials */}
          <div className="space-y-2">
            <p className="font-bold text-[#1c1815] uppercase tracking-wider text-[11px]">Support</p>
            <ul className="space-y-1.5">
              <li><button onClick={() => setActiveModal('faq')} className="hover:text-[#194a32]">Help Center</button></li>
              <li><button onClick={() => setActiveModal('faq')} className="hover:text-[#194a32]">FAQ</button></li>
              <li><button onClick={() => setActiveModal('how-it-works')} className="hover:text-[#194a32]">Video Tutorials</button></li>
            </ul>
            <div className="pt-2 flex items-center gap-3 text-lg text-[#194a32]">
              <span className="cursor-pointer hover:opacity-80">📘</span>
              <span className="cursor-pointer hover:opacity-80">▶️</span>
              <span className="cursor-pointer hover:opacity-80">💬</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#dcd3bc] pt-6 text-center text-xs text-[#786f62]">
          © 2026 HisabPoint. All rights reserved.
        </div>
      </footer>

      {/* ── INTERACTIVE MODALS ───────────────────────────────────────────── */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#f7f4ea] text-[#2c2825] max-w-lg w-full rounded-3xl p-6 border border-[#d6cbaf] shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#eae3d2] hover:bg-[#ded5be] text-stone-900 font-bold flex items-center justify-center"
            >
              ✕
            </button>

            <h3 className="text-2xl font-black font-serif text-[#194a32] border-b border-[#e5dec8] pb-2">
              {activeModal === 'pricing' && '100% Free Forever'}
              {activeModal === 'reviews' && 'Shopkeeper Reviews'}
              {activeModal === 'faq' && 'Frequently Asked Questions'}
            </h3>

            {activeModal === 'pricing' && (
              <div className="space-y-3 text-xs text-[#524b42]">
                <div className="bg-[#194a32] text-white p-4 rounded-2xl text-center space-y-1">
                  <p className="text-2xl font-black font-serif">₹0 — Totally Free</p>
                  <p className="text-xs text-emerald-200">No hidden fees, no credit card required, unlimited customers.</p>
                </div>
              </div>
            )}

            {activeModal === 'reviews' && (
              <div className="space-y-3 text-xs text-[#524b42]">
                <div className="bg-white p-3.5 rounded-xl border border-[#e5dec8] space-y-1">
                  <p className="font-bold text-[#194a32]">"HisabPoint has made my daily kaam so easy!"</p>
                  <p className="text-[11px] text-[#786f62]">— Imran Shaikh, Kirana Store Owner</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-[#e5dec8] space-y-1">
                  <p className="font-bold text-[#194a32]">"Ab koi hisab miss nahi hota."</p>
                  <p className="text-[11px] text-[#786f62]">— Ramesh Patil, General Store</p>
                </div>
              </div>
            )}

            {activeModal === 'faq' && (
              <div className="space-y-3 text-xs text-[#524b42]">
                <p><strong>Q: Is my shop data private and safe?</strong><br />A: Yes! All ledger records are encrypted and safely backed up.</p>
                <p><strong>Q: Can I use this on both laptop and mobile?</strong><br />A: Absolutely. Your account syncs seamlessly across all your devices.</p>
              </div>
            )}

            <div className="pt-3 border-t border-[#e5dec8] flex justify-end">
              <button
                onClick={() => {
                  setActiveModal(null);
                  navigate('/register');
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-[#194a32] rounded-xl"
              >
                Get Started Now →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
