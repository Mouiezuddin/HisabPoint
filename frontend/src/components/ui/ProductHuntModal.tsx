import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProductHuntModalProps {
  postUrl?: string;
}

export function ProductHuntModal({ postUrl = 'https://www.producthunt.com/posts/hisabpoint' }: ProductHuntModalProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const ref = searchParams.get('ref');
    const hasSeenModal = sessionStorage.getItem('hisab_ph_welcome_seen');

    if ((ref === 'producthunt' || ref === 'ph') && !hasSeenModal) {
      setIsOpen(true);
      sessionStorage.setItem('hisab_ph_welcome_seen', 'true');
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ph-modal-title"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="bg-[#f7f4ea] text-[#2c2825] max-w-lg w-full rounded-3xl p-6 sm:p-8 border-4 border-[#d4af37]/60 shadow-2xl relative space-y-6">
        {/* Metal Brass Corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#d4af37] rounded-tl-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#d4af37] rounded-tr-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#d4af37] rounded-bl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#d4af37] rounded-br-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#eae3d2] hover:bg-[#ded5be] text-stone-800 font-bold flex items-center justify-center transition-all cursor-pointer"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="space-y-2 text-center pt-2">
          <div className="inline-flex items-center gap-2 bg-[#ff6154]/10 text-[#d84a3e] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-[#ff6154]/20">
            <span>🐱</span>
            <span>Welcome Product Hunters</span>
          </div>

          <h2 id="ph-modal-title" className="text-2xl sm:text-3xl font-black font-serif text-[#194a32] tracking-tight">
            Namaste &amp; Welcome!
          </h2>
          <p className="text-xs sm:text-sm text-[#524b42] font-medium leading-relaxed max-w-md mx-auto">
            Thank you for checking out <strong>HisabPoint</strong> on launch day. We are digitizing the centuries-old Indian Bahi Khata (बही खाता) ledger for millions of grassroots merchants.
          </p>
        </div>

        {/* Highlights Box */}
        <div className="bg-[#ede7d5] rounded-2xl p-4 border border-[#d6cbaf] space-y-2.5 text-xs text-[#3d362e]">
          <div className="flex items-center gap-2 font-bold text-[#194a32]">
            <span>✨</span>
            <span>What makes HisabPoint special:</span>
          </div>
          <ul className="space-y-1.5 list-disc list-inside text-[11px] sm:text-xs text-[#524b42]">
            <li><strong>Zero Balance Drift:</strong> Mathematical dynamic ledger balance derivations.</li>
            <li><strong>Tactile Skeuomorphism:</strong> Genuine parchment, gold accents, and leather-bound notebook UI.</li>
            <li><strong>POS Billing + WhatsApp:</strong> 1-click tax receipts &amp; PDF ledger statements.</li>
            <li><strong>Offline-Ready PWA:</strong> Ultra-lightweight (&lt; 1.2 MB) installable application.</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => {
              setIsOpen(false);
              navigate('/login?demo=true');
            }}
            id="ph-modal-demo-btn"
            className="w-full py-3.5 px-4 text-sm font-bold text-white bg-[#194a32] hover:bg-[#133c28] rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>⚡ Test Drive Live Demo (1-Click)</span>
            <span>→</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 text-xs font-bold text-[#d84a3e] bg-[#ff6154]/10 hover:bg-[#ff6154]/20 border border-[#ff6154]/30 rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <span>🐱 Upvote on PH</span>
            </a>

            <button
              onClick={() => setIsOpen(false)}
              className="py-2.5 px-3 text-xs font-bold text-[#5c5449] bg-[#eae3d2] hover:bg-[#dfd5bf] border border-[#cfc4a6] rounded-xl transition-all flex items-center justify-center"
            >
              <span>Explore Website</span>
            </button>
          </div>
        </div>

        <p className="text-[10px] text-center text-[#786f62] italic">
          No credit card, installation, or registration required for the demo test drive.
        </p>
      </div>
    </div>
  );
}
