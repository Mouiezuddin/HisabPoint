import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, isMenuOpen }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold text-blue-600">हिसाब</div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Hisab Ledger</h1>
            <p className="text-xs text-gray-500">Shopkeeper's Ledger</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium transition">
            Dashboard
          </Link>
          <Link to="/customers" className="text-gray-600 hover:text-gray-900 font-medium transition">
            Customers
          </Link>
          <Link to="/add-entry" className="text-gray-600 hover:text-gray-900 font-medium transition">
            Add Entry
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3">
            {user && (
              <span className="text-sm text-gray-600">
                {user.first_name || user.username}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>

          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <nav className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-2">
            <Link
              to="/"
              className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition"
            >
              Dashboard
            </Link>
            <Link
              to="/customers"
              className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition"
            >
              Customers
            </Link>
            <Link
              to="/add-entry"
              className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition"
            >
              Add Entry
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition flex items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </nav>
      )}
    </header>
  );
};
