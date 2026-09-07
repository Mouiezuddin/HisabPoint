import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { useTheme } from '../../features/theme/ThemeContext';
import { InstallAppButton } from '../pwa/InstallAppButton';

interface DesktopHeaderProps {
  onOpenNewEntry?: () => void;
}

export function DesktopHeader({ onOpenNewEntry }: DesktopHeaderProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return `Good evening, ${user?.name?.split(' ')[0] || 'Shopkeeper'}`;
    if (path.startsWith('/customers/new')) return 'Add New Customer Record';
    if (path.startsWith('/customers')) return 'Customers Directory & Ledger';
    if (path.startsWith('/activity')) return 'Shop Activity Logbook';
    if (path.startsWith('/reports')) return 'Business Analytics & Reports';
    if (path.startsWith('/settings')) return 'Account & Ledger Settings';
    return 'HisabPoint Digital Ledger';
  };

  return (
    <header className="hidden md:flex items-center justify-between px-8 py-4 bg-gradient-to-b from-parchment-100 to-parchment-200 border-b-2 border-parchment-300 sticky top-0 z-20 shadow-sm">
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight font-serif">{getPageTitle()}</h1>
        <p className="text-xs font-bold text-amber-900/70 mt-0.5">
          📅 {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Search Input Trigger */}
        <div
          onClick={() => navigate('/customers')}
          className="flex items-center gap-2 bg-parchment-50 border border-parchment-300 text-stone-600 rounded-2xl px-4 py-2.5 text-xs font-semibold cursor-pointer shadow-inner hover:border-forest-500 transition-colors w-64"
        >
          <svg className="w-4 h-4 text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <span>Search customer in ledger...</span>
        </div>

        {/* PWA Install Button (automatically hidden if already installed) */}
        <InstallAppButton variant="outline" label="Install App" />

        {/* 1-Click Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Day Sunlight Mode' : 'Switch to Royal Night Mode'}
          className="p-2.5 bg-parchment-50 border border-parchment-300 rounded-2xl shadow-sm hover:border-amber-600 transition-all text-xs font-bold flex items-center justify-center cursor-pointer"
          id="btn-theme-toggle-desktop"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* 3D Tactile Action Button */}
        <button
          onClick={() => {
            if (onOpenNewEntry) onOpenNewEntry();
            else navigate('/customers');
          }}
          className="btn-forest text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
          id="btn-header-add-entry"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M12 5v14M5 12h14" />
          </svg>
          + Add Transaction
        </button>

        {/* Tactile Profile Badge */}
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2.5 bg-parchment-50 border border-parchment-300 rounded-2xl px-3.5 py-1.5 shadow-sm hover:border-forest-600 transition-all"
          id="btn-header-profile"
        >
          <div className="w-7 h-7 rounded-full bg-forest-900 text-gold-400 text-xs font-black flex items-center justify-center border border-gold-500/50 shadow-sm font-serif">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <span className="text-xs font-black text-stone-900 max-w-[100px] truncate font-serif">
            {user?.name?.split(' ')[0] || 'Shop'}
          </span>
        </button>
      </div>
    </header>
  );
}

