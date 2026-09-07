import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { useTheme } from '../features/theme/ThemeContext';
import { usePWA } from '../features/pwa/usePWA';
import { InstallAppModal } from '../components/pwa/InstallAppModal';
import { ConfirmDialog } from '../components/ui/Modal';
import { showToast } from '../components/ui/Toast';

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isInstalled, isIOS, promptInstall } = usePWA();
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      showToast('Could not log out. Please try again.', 'error');
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-black font-serif text-stone-900 tracking-tight">Settings</h1>

      {/* User Profile Card */}
      <div className="bg-parchment-50 rounded-2xl p-6 border-2 border-parchment-300 shadow-md space-y-4 text-center bg-paper-lines">
        <div className="w-16 h-16 rounded-full bg-forest-900 text-gold-300 font-serif font-black text-2xl flex items-center justify-center border-2 border-gold-500/50 shadow-md mx-auto">
          {user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'HP'}
        </div>

        <div>
          <h2 className="text-xl font-black font-serif text-stone-900">{user?.name || 'Shopkeeper'}</h2>
          {user?.phone ? (
            <p className="text-xs font-mono text-stone-600 mt-0.5">{user.phone}</p>
          ) : null}
          <p className="text-xs text-stone-500 font-medium">{user?.email || ''}</p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => showToast('Password change form active.', 'info')}
            className="w-full sm:w-auto btn-parchment-bevel px-6 py-2.5 text-xs font-bold rounded-xl"
          >
            Change Password
          </button>

          <button
            onClick={() => setShowLogout(true)}
            className="w-full sm:w-auto btn-forest px-6 py-2.5 text-xs font-bold rounded-xl text-white"
            id="logout-btn"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Settings Navigation List matching Screen 16 */}
      <div className="bg-parchment-50 rounded-2xl border-2 border-parchment-300 shadow-md divide-y divide-parchment-200 overflow-hidden bg-paper-lines">
        {/* PWA App Install or Status */}
        {!isInstalled ? (
          <SettingsRow
            icon="📱"
            title="Install HisabPoint App"
            subtitle={isIOS ? "Tap for iPhone 'Add to Home Screen' instructions" : "Install on your home screen or desktop for 1-tap khata"}
            onClick={async () => {
              if (isIOS) {
                setShowInstallModal(true);
              } else {
                const res = await promptInstall();
                if (res.outcome === 'manual') {
                  setShowInstallModal(true);
                }
              }
            }}
          />
        ) : (
          <SettingsRow
            icon="✅"
            title="HisabPoint Installed"
            subtitle="Running as an installed application on your device"
            onClick={() => showToast('HisabPoint is running in installed standalone mode.', 'info')}
          />
        )}
        <SettingsRow
          icon="🏪"
          title="Business Profile"
          subtitle="Shop name, address, and GSTIN details"
          onClick={() => navigate('/settings/business')}
        />
        <SettingsRow
          icon={theme === 'dark' ? '☀️' : '🌙'}
          title={`Appearance (${theme === 'dark' ? 'Royal Dark' : 'Day Sunlight'})`}
          subtitle="Click to switch between Day Sunlight & Royal Night mode"
          onClick={() => {
            toggleTheme();
            showToast(`Switched to ${theme === 'dark' ? 'Day Sunlight' : 'Royal Night'} mode`, 'success');
          }}
        />
        <SettingsRow
          icon="👤"
          title="Profile & Account"
          subtitle="Manage personal contact and login options"
          onClick={() => showToast('Profile info displayed above.', 'info')}
        />
        <SettingsRow
          icon="🔒"
          title="Security"
          subtitle="Password and session security"
          onClick={() => showToast('Account security active.', 'info')}
        />
        <SettingsRow
          icon="🔔"
          title="App Notifications"
          subtitle="Daily summary and due payment alerts"
          onClick={() => showToast('Notifications enabled.', 'info')}
        />
        <SettingsRow
          icon="🌐"
          title="Language"
          subtitle="English / हिन्दी"
          onClick={() => showToast('Language set to English / Hindi.', 'info')}
        />
        <SettingsRow
          icon="❓"
          title="Help & Support"
          subtitle="FAQ and customer care contact"
          onClick={() => showToast('HisabPoint Support: support@hisabpoint.com', 'info')}
        />
      </div>

      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />

      <ConfirmDialog
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={handleLogout}
        loading={loggingOut}
        title="Log out?"
        message="You'll need to log in again to access your ledger."
        confirmLabel="Log Out"
        confirmVariant="danger"
      />
    </div>
  );
}

function SettingsRow({ icon, title, subtitle, onClick }: { icon: string; title: string; subtitle: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="p-4 hover:bg-parchment-100 cursor-pointer flex items-center justify-between transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="font-bold text-stone-900 text-sm font-serif">{title}</p>
          <p className="text-xs text-stone-500">{subtitle}</p>
        </div>
      </div>
      <span className="text-stone-400 font-bold">→</span>
    </div>
  );
}
