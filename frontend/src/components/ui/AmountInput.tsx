import React from 'react';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoFocus?: boolean;
  label?: string;
  id?: string;
}

export function AmountInput({
  value,
  onChange,
  error,
  autoFocus = true,
  label = 'AMOUNT (₹)',
  id = 'amount-input',
}: AmountInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
      onChange(val);
    }
  }

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-black uppercase text-amber-900/80 mb-1.5 tracking-wider font-serif">
          {label}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 text-leather-950 font-black text-lg flex items-center justify-center border border-amber-200 shadow-md pointer-events-none">
          ₹
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder="0"
          autoFocus={autoFocus}
          className={`w-full bg-parchment-50 border-2 rounded-2xl pl-14 pr-4 py-4 text-3xl font-black text-forest-950 font-serif font-tabular focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all shadow-inner ${
            error ? 'border-rose-600 focus:ring-rose-500' : 'border-parchment-300'
          }`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-rose-700 font-bold mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
