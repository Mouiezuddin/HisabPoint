import React, { useState, useEffect } from 'react';

const PROVERBS = [
  'बही खाता साफ, तो व्यापार बेदाग़!',
  'उधार प्रेम की कैंची है — हिसाब हमेशा साफ़ रखें!',
  '✦ शुभ लाभ • सुरक्षित और पारदर्शी डिजिटल बही खाता ✦',
  'ग्राहक ही भगवान है — हिसाब में कोई भूल नहीं!',
  'Instant UPI QR Codes & 100% Encrypted Ledger',
];

interface SplashScreenProps {
  isLoading?: boolean;
  onFinish?: () => void;
}

export function SplashScreen({ isLoading = false, onFinish }: SplashScreenProps) {
  // Stages: 'intro' -> 'unlatch' -> 'opening' -> 'revealing' -> 'done'
  const [stage, setStage] = useState<'intro' | 'unlatch' | 'opening' | 'revealing' | 'done'>('intro');
  const [proverbIndex, setProverbIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Cycle proverbs every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setProverbIndex((prev) => (prev + 1) % PROVERBS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Track elapsed time for cold start messaging
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Orchestrate animation timeline
  useEffect(() => {
    const t1 = setTimeout(() => setStage('unlatch'), 400);
    const t2 = setTimeout(() => setStage('opening'), 800);
    const t3 = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // When both min animation time has elapsed AND backend loading is done, reveal app
  useEffect(() => {
    if (minTimeElapsed && !isLoading && stage !== 'revealing' && stage !== 'done') {
      setStage('revealing');
      const t = setTimeout(() => {
        setStage('done');
        onFinish?.();
      }, 500);
      return () => clearTimeout(t);
    }
  }, [minTimeElapsed, isLoading, stage, onFinish]);

  if (stage === 'done') return null;

  const isCoverOpen = stage === 'opening' || stage === 'revealing';

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 select-none overflow-hidden transition-opacity duration-500 ${
        stage === 'revealing' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundColor: '#130a05',
        backgroundImage: 'radial-gradient(ellipse at 50% 30%, #2b170e 0%, #0d0603 90%)',
      }}
      aria-label="HisabPoint Loading Screen"
    >
      {/* Ambient Gold Glow behind the book */}
      <div className="absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-[#d4af37]/15 blur-3xl pointer-events-none animate-pulse" />

      {/* 3D Perspective Book Wrapper */}
      <div
        className="relative w-64 sm:w-72 h-84 sm:h-96 my-auto"
        style={{ perspective: '1200px' }}
      >
        {/* Book Spine Rings (Left Edge) */}
        <div className="absolute -left-3 top-6 bottom-6 flex flex-col justify-between items-center z-30 pointer-events-none">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="w-3.5 h-4 bg-[#211b15] rounded-full border border-[#d4af37] shadow-md"
            />
          ))}
        </div>

        {/* ── BACK LAYER: Open Parchment Paper Pages ── */}
        <div className="absolute inset-0 bg-[#f7f3e8] rounded-2xl p-5 border-2 border-[#d6c7ab] shadow-2xl flex flex-col justify-between overflow-hidden bg-paper-lines">
          {/* Subtle watermark / header */}
          <div className="border-b border-[#e2d5bd] pb-2 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#194a32] font-serif">
              ✦ बही खाता ✦
            </span>
            <span className="text-[10px] font-mono text-stone-500">Page 01</span>
          </div>

          {/* Ledger Ruling Columns */}
          <div className="space-y-3 my-auto text-left opacity-60">
            <div className="flex justify-between text-[9px] font-bold text-stone-700 border-b border-dashed border-stone-300 pb-1">
              <span>विवरण (Details)</span>
              <span>जमा / बाकी</span>
            </div>
            <div className="h-2 bg-[#e8decd] rounded w-3/4" />
            <div className="h-2 bg-[#e8decd] rounded w-1/2" />
            <div className="h-2 bg-[#e8decd] rounded w-5/6" />
          </div>

          <div className="pt-2 border-t border-[#e2d5bd] text-center">
            <span className="text-[9px] font-bold text-forest-900 tracking-wider">
              ✦ HISABPOINT LEDGER READY ✦
            </span>
          </div>
        </div>

        {/* ── FRONT LAYER: 3D Leather Cover with Gold Leaf Stitching ── */}
        <div
          className="absolute inset-0 bg-[#163e2a] rounded-2xl p-6 border-2 border-[#d4af37]/70 shadow-2xl flex flex-col items-center justify-between text-center overflow-hidden transition-transform duration-700 ease-out origin-left"
          style={{
            transformStyle: 'preserve-3d',
            transform: isCoverOpen ? 'rotateY(-130deg)' : 'rotateY(0deg)',
            backfaceVisibility: 'hidden',
            boxShadow: isCoverOpen
              ? '20px 20px 50px rgba(0,0,0,0.8)'
              : '0 20px 40px rgba(0,0,0,0.6)',
          }}
        >
          {/* Brass Corner Ornaments */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-[#d4af37] rounded-tl-xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-[#d4af37] rounded-tr-xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-[#d4af37] rounded-bl-xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-[#d4af37] rounded-br-xl pointer-events-none" />

          {/* Top Traditional Blessing */}
          <div className="text-[10px] font-serif font-black tracking-widest text-amber-200/80 uppercase">
            ✦ श्री गणेशाय नमः ✦
          </div>

          {/* Center Brand Identity */}
          <div className="space-y-2 my-auto">
            <div className="relative inline-block">
              <img
                src="/logo-mark.webp"
                alt="HisabPoint Logo"
                className="w-16 h-16 rounded-2xl mx-auto border-2 border-[#d4af37] shadow-lg p-1 bg-[#f7f3e8]"
              />
              {stage === 'intro' && (
                <div className="absolute inset-0 rounded-2xl border-2 border-white animate-ping opacity-30" />
              )}
            </div>

            <div>
              <h1 className="text-2xl font-black font-serif text-amber-100 tracking-tight drop-shadow-md">
                HisabPoint
              </h1>
              <div className="inline-block mt-1 bg-[#d4af37] text-forest-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm border border-amber-300">
                डिजिटल बही खाता
              </div>
            </div>

            <p className="text-[10px] text-amber-200/70 font-medium">
              पवित्र व्यापार • साफ़ हिसाब
            </p>
          </div>

          {/* Bottom Brass Lock / Clasp */}
          <div className="w-full flex items-center justify-center pt-2">
            <div className="px-3 py-1 bg-[#211b15] rounded-full border border-[#d4af37]/80 text-[#d4af37] text-[10px] font-black flex items-center gap-1.5 shadow-md">
              <span>{stage === 'intro' ? '🔒' : '🔓'}</span>
              <span>{stage === 'intro' ? 'LOCKED' : 'OPENING...'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Proverb & Cold-Start Status */}
      <div className="relative z-10 w-full max-w-sm text-center space-y-3 mt-4">
        {/* Animated Proverb */}
        <div className="min-h-[36px] flex items-center justify-center">
          <p
            key={proverbIndex}
            className="text-xs sm:text-sm font-serif font-bold text-amber-200/90 tracking-wide transition-all duration-500 drop-shadow-sm px-4"
          >
            &ldquo;{PROVERBS[proverbIndex]}&rdquo;
          </p>
        </div>

        {/* Cold Start Indicator if taking longer than 3 seconds */}
        {elapsedSeconds >= 3 && isLoading && (
          <div className="bg-[#241710]/90 border border-[#d4af37]/40 rounded-xl p-2.5 text-[11px] text-amber-200/80 space-y-1.5 shadow-lg backdrop-blur-xs">
            <div className="flex items-center justify-between font-bold">
              <span>☕ Waking up secure cloud server...</span>
              <span className="font-mono text-amber-400">
                {Math.min(95, elapsedSeconds * 5)}%
              </span>
            </div>
            <div className="w-full bg-[#120a06] h-1.5 rounded-full overflow-hidden border border-amber-900/50">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(95, elapsedSeconds * 5)}%` }}
              />
            </div>
            <p className="text-[10px] text-stone-400 text-left">
              Render free tier boot takes ~20s. Cron job is now active to keep it warm!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
