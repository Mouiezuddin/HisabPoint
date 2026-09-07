import React from 'react';

export function IOSInstallInstructions() {
  return (
    <div className="space-y-4 text-left">
      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 text-xs">
        <p className="font-bold font-serif">📱 Apple iPhone / iPad Installation</p>
        <p className="text-[11px] mt-0.5 text-stone-700">
          Safari on iOS doesn't support 1-tap installation prompts, but you can easily add HisabPoint to your home screen in 3 quick taps:
        </p>
      </div>

      <ol className="space-y-3 text-xs text-stone-800 font-medium">
        <li className="flex items-start gap-3 bg-white p-3 rounded-xl border border-parchment-300 shadow-xs">
          <span className="w-6 h-6 rounded-full bg-forest-900 text-gold-300 font-bold flex items-center justify-center flex-shrink-0 text-xs font-serif">
            1
          </span>
          <div className="flex-1">
            <p className="font-bold text-stone-900">Tap the Share Button</p>
            <p className="text-[11px] text-stone-600 mt-0.5 flex items-center gap-1.5">
              Look at the bottom toolbar in Safari and tap the Share icon
              <span className="inline-flex p-1 bg-stone-100 rounded-md border border-stone-300 text-blue-600">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </span>
            </p>
          </div>
        </li>

        <li className="flex items-start gap-3 bg-white p-3 rounded-xl border border-parchment-300 shadow-xs">
          <span className="w-6 h-6 rounded-full bg-forest-900 text-gold-300 font-bold flex items-center justify-center flex-shrink-0 text-xs font-serif">
            2
          </span>
          <div className="flex-1">
            <p className="font-bold text-stone-900">Select "Add to Home Screen"</p>
            <p className="text-[11px] text-stone-600 mt-0.5 flex items-center gap-1.5">
              Scroll down the menu and tap
              <span className="inline-flex items-center gap-1 font-bold px-1.5 py-0.5 bg-stone-100 rounded-md border border-stone-300 text-stone-900">
                <svg className="w-3 h-3 text-stone-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
                Add to Home Screen
              </span>
            </p>
          </div>
        </li>

        <li className="flex items-start gap-3 bg-white p-3 rounded-xl border border-parchment-300 shadow-xs">
          <span className="w-6 h-6 rounded-full bg-forest-900 text-gold-300 font-bold flex items-center justify-center flex-shrink-0 text-xs font-serif">
            3
          </span>
          <div className="flex-1">
            <p className="font-bold text-stone-900">Tap "Add" at the Top Right</p>
            <p className="text-[11px] text-stone-600 mt-0.5">
              Confirm by tapping <strong>Add</strong> in the top-right corner. HisabPoint will now appear on your home screen like an installed app!
            </p>
          </div>
        </li>
      </ol>
    </div>
  );
}
