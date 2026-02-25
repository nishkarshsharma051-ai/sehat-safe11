import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Heart, LogOut, User, Sun, Moon, Menu, X, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-green-500 p-2 rounded-xl">
              <Heart className="w-6 h-6 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Sehat Safe
              </h1>
              <p className="text-xs text-gray-600">Health Portal</p>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-3">
            {(user as any)?.role === 'admin' && (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-200/50">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Admin</span>
              </div>
            )}

            <button
              onClick={toggleTheme}
              className="relative p-2.5 rounded-xl bg-white/50 dark:bg-white/10 hover:bg-white/70 dark:hover:bg-white/20 transition-all duration-300 group"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-500 theme-toggle-icon" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700 theme-toggle-icon" />
              )}
            </button>

            <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/50 dark:bg-white/10">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full" />
              ) : (
                <User className="w-4 h-4 text-gray-600" />
              )}
              <span className="text-sm font-medium text-gray-700">
                {user?.displayName || 'User'}
              </span>
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl bg-white/50 dark:bg-white/10 hover:bg-white/70 transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="md:hidden border-t border-white/20 bg-white/95 dark:bg-black/95 backdrop-blur-xl overflow-hidden shadow-2xl"
          >
            <div className="px-4 pt-2 pb-6 space-y-3">
              {/* Mobile User Profile */}
              <div className="flex items-center space-x-4 px-4 py-4 rounded-2xl bg-indigo-500/5 dark:bg-white/5 border border-indigo-500/10 active:scale-[0.98] transition-transform">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full ring-2 ring-indigo-500/20" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-indigo-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                      {user?.displayName || 'User'}
                    </p>
                    {(user as any)?.role === 'admin' && (
                      <Shield className="w-3.5 h-3.5 text-purple-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>

              {/* Mobile Actions */}
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center space-x-3 px-4 py-4 rounded-2xl hover:bg-white/50 dark:hover:bg-white/10 active:bg-indigo-500/5 transition-all text-left group"
                >
                  <div className={`p-2 rounded-xl scale-110 ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-600'}`}>
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    </span>
                    <p className="text-[10px] text-gray-400 font-medium">Brightness preferences</p>
                  </div>
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-4 py-4 rounded-2xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 active:scale-[0.98] transition-all text-left"
                >
                  <div className="p-2 bg-red-500/10 rounded-xl">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold">Sign Out</span>
                    <p className="text-[10px] text-red-400 font-medium">End your session</p>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
