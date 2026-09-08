import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { DesktopHeader } from './DesktopHeader';
import { QuickTransactionModal } from '../ui/QuickTransactionModal';
import { useAuth } from '../../features/auth/AuthContext';
import { useTheme } from '../../features/theme/ThemeContext';
import { InstallAppBanner } from '../pwa/InstallAppBanner';
import { PWAUpdateToast } from '../pwa/PWAUpdateToast';
import { NetworkStatusIndicator } from '../pwa/NetworkStatusIndicator';

// Clean 4-item list designed around the central thumb '+' floating action button
const mobileNavItemsLeft = [
  {
    to: '/dashboard',
    label: 'Home',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-gold-400 font-bold' : 'text-amber-200/60'}`} viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/customers',
    label: 'Customers',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-gold-400 font-bold' : 'text-amber-200/60'}`} viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
];

const mobileNavItemsRight = [
  {
    to: '/activity',
    label: 'Activity',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-gold-400 font-bold' : 'text-amber-200/60'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-gold-400 font-bold' : 'text-amber-200/60'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

export function BottomNav({ onOpenNewEntry }: { onOpenNewEntry: () => void }) {
  return (
    <nav
      className="bottom-nav border-t-2 border-gold-500/60 bg-gradient-to-t from-leather-950 via-leather-900 to-leather-950 md:hidden z-40 shadow-2xl safe-bottom"
      aria-label="Mobile navigation"
    >
      {/* Left 2 items */}
      {mobileNavItemsLeft.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `nav-item font-bold transition-all min-h-[48px] min-w-[48px] ${
              isActive ? 'text-gold-400 font-black scale-105' : 'text-amber-200/60 hover:text-amber-200'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {item.icon(isActive)}
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}

      {/* Central Tactile Floating Action Button (FAB) for Given / Payment */}
      <button
        onClick={onOpenNewEntry}
        className="-mt-7 bg-gradient-to-b from-emerald-400 via-emerald-600 to-emerald-800 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-skeuo-green active:scale-95 transition-all border-2 border-amber-200 flex-shrink-0 cursor-pointer"
        aria-label="Add Credit or Payment"
        id="btn-mobile-nav-add"
      >
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {/* Right 2 items */}
      {mobileNavItemsRight.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `nav-item font-bold transition-all min-h-[48px] min-w-[48px] ${
              isActive ? 'text-gold-400 font-black scale-105' : 'text-amber-200/60 hover:text-amber-200'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {item.icon(isActive)}
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [quickTxnOpen, setQuickTxnOpen] = useState(false);
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh flex flex-col md:flex-row w-full text-stone-900 selection:bg-gold-500 selection:text-forest-950 bg-wood-desk overflow-x-hidden">
      {/* Real-time Network Status (Online / Offline warning) */}
      <NetworkStatusIndicator />

      {/* PWA Safe Version Update Toast */}
      <PWAUpdateToast />

      {/* Desktop Sidebar */}
      <Sidebar onOpenNewEntry={() => setQuickTxnOpen(true)} />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-parchment-100/90 shadow-2xl">
        {/* Desktop Header */}
        <DesktopHeader onOpenNewEntry={() => setQuickTxnOpen(true)} />

        {/* Mobile Header with Safe Area Support */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-gradient-to-r from-forest-950 via-forest-900 to-forest-950 text-white border-b-2 border-gold-500/50 sticky top-0 z-30 shadow-md leather-stitch pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <img
              src="/logo-mark.png"
              alt="HisabPoint Logo"
              className="w-8 h-8 rounded-lg object-contain shadow-sm border border-gold-500/40 bg-[#f7f4ea] flex-shrink-0"
            />
            <span className="text-xl font-black font-serif gold-emboss tracking-tight">HisabPoint</span>
            <span className="text-xs font-black bg-gold-500 text-forest-950 px-2 py-0.5 rounded-sm">
              खाता
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 min-h-[40px] min-w-[40px] bg-forest-900/90 border border-gold-500/50 rounded-full text-xs font-bold text-gold-300 flex items-center justify-center cursor-pointer active:scale-95"
              title={theme === 'dark' ? 'Day Sunlight Mode' : 'Night Mode'}
              id="btn-theme-toggle-mobile"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 bg-forest-900/90 border border-gold-500/50 px-3 py-1.5 min-h-[40px] rounded-full text-xs font-bold text-gold-300 cursor-pointer active:scale-95"
            >
              <span className="max-w-[80px] truncate">{user?.name?.split(' ')[0] || 'Shop'}</span>
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-forest-950 text-[10px] font-black flex items-center justify-center font-serif">
                {user?.name?.charAt(0).toUpperCase() || 'S'}
              </div>
            </button>
          </div>
        </header>

        {/* Main Content Body with Safe Bottom Padding for Mobile Nav */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav onOpenNewEntry={() => setQuickTxnOpen(true)} />

      {/* Non-intrusive PWA Install Banner */}
      <InstallAppBanner />

      {/* Global Quick Transaction Modal */}
      <QuickTransactionModal
        isOpen={quickTxnOpen}
        onClose={() => setQuickTxnOpen(false)}
      />
    </div>
  );
}

