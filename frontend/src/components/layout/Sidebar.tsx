import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

interface SidebarProps {
  onOpenNewEntry?: () => void;
}

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    to: '/customers',
    label: 'Customer Ledger',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    to: '/activity',
    label: 'Activity Log',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    to: '/reports',
    label: 'Khata Reports',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

export function Sidebar({ onOpenNewEntry }: SidebarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-gradient-to-b from-forest-950 via-forest-900 to-forest-950 text-amber-100 flex flex-col justify-between flex-shrink-0 border-r-4 border-gold-600/40 shadow-2xl hidden md:flex sticky top-0 h-dvh leather-stitch z-30">
      <div>
        {/* Skeuomorphic Leather Bahi Khata Brand Header */}
        <div className="p-6 border-b-2 border-gold-600/30 bg-forest-950/80 shadow-inner">
          <div className="cursor-pointer space-y-1" onClick={() => navigate('/dashboard')}>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black font-serif gold-emboss tracking-tight">HisabPoint</span>
              <span className="text-xs font-black bg-gold-500 text-forest-950 px-2 py-0.5 rounded-sm shadow-sm border border-amber-300">
                खाता
              </span>
            </div>
            <p className="text-[10px] font-bold text-gold-400/90 tracking-widest uppercase">
              📖 DIGITAL BAHI KHATA
            </p>
          </div>
        </div>

        {/* Tactile 3D Action Button */}
        <div className="p-4">
          <button
            onClick={() => {
              if (onOpenNewEntry) onOpenNewEntry();
              else navigate('/customers');
            }}
            className="w-full btn-forest text-white font-black py-3.5 px-4 rounded-2xl shadow-skeuo-forest transition-all flex items-center justify-center gap-2 text-sm"
            id="sidebar-btn-new-entry"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M12 5v14M5 12h14" />
            </svg>
            + Add Transaction
          </button>
        </div>

        {/* Skeuomorphic Raised Navigation Links */}
        <nav className="px-3 space-y-2 mt-2" aria-label="Desktop navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                  isActive
                    ? 'bg-forest-900 text-gold-300 border-2 border-gold-500/80 shadow-inner font-black'
                    : 'text-amber-100/70 hover:bg-forest-900/50 hover:text-gold-300 border border-transparent'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Info Bottom Leather Badge */}
      <div className="p-4 border-t-2 border-gold-600/30 bg-forest-950/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-forest-950 font-black text-base flex items-center justify-center flex-shrink-0 border-2 border-amber-200 shadow-md">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-gold-400 truncate skeuo-text-emboss font-serif">{user?.name || 'Shopkeeper'}</p>
            <p className="text-[11px] font-semibold text-amber-200/70 truncate">{user?.email || 'Active Account'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
