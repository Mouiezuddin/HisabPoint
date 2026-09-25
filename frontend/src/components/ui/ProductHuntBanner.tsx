import React, { useState, useEffect } from 'react';

interface ProductHuntBannerProps {
  postUrl?: string;
}

export function ProductHuntBanner({ postUrl = 'https://www.producthunt.com/posts/hisabpoint' }: ProductHuntBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('hisab_ph_banner_dismissed');
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('hisab_ph_banner_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Product Hunt announcement"
      className="bg-gradient-to-r from-[#194a32] via-[#1f5f3e] to-[#2d4030] text-white py-2 px-4 border-b border-[#d4af37]/40 text-xs sm:text-sm font-medium shadow-md relative z-50 flex items-center justify-between"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-center">
        <span className="inline-flex items-center gap-1.5 bg-[#ff6154] text-white text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
          <span>🐱</span>
          <span>Product Hunt</span>
        </span>
        <span className="text-[#f7f4ea]">
          We are live on <strong>Product Hunt</strong> today! Support grassroots commerce &amp; share your feedback.
        </span>
        <a
          href={postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-bold text-amber-200 hover:text-white underline underline-offset-2 decoration-amber-400 hover:decoration-white transition-all text-xs"
        >
          <span>Support Our Launch</span>
          <span>→</span>
        </a>
      </div>

      <button
        onClick={handleDismiss}
        aria-label="Dismiss banner"
        className="text-amber-200/70 hover:text-white p-1 rounded-md transition-colors text-base font-bold ml-2 cursor-pointer"
        title="Dismiss banner"
      >
        ✕
      </button>
    </div>
  );
}
