import React, { useState } from 'react';
import {
  Compass,
  GraduationCap,
  Users,
  Shield,
  BookOpen,
  Music,
  User,
  ChevronDown,
  LogOut,
  Sparkles,
  Phone,
  Menu,
  X
} from 'lucide-react';
import { useRouter } from '../../router/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { getRoleLabel } from '../../lib/rbac';
import { Badge, Button } from '../../design-system';
import { NotificationCenter } from '../NotificationCenter';
import { SaremiLogo } from '../common/SaremiLogo';

interface PortalNavigationProps {
  onOpenAuth: () => void;
  onOpenBooking: () => void;
}

export const PortalNavigation: React.FC<PortalNavigationProps> = ({
  onOpenAuth,
  onOpenBooking
}) => {
  const { currentPath, portal, navigate } = useRouter();
  const { user, profile, role, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authoritative destination route based on genuine user role
  const userPortalRoute = (() => {
    if (role === 'admin' || role === 'super_admin' || user?.email === 'avinashborate5897@gmail.com') return '/admin';
    if (role === 'teacher') return '/teacher-app';
    return '/app';
  })();

  const userPortalLabel = (() => {
    if (role === 'admin' || role === 'super_admin') return 'Admin Console';
    if (role === 'teacher') return 'Faculty Studio';
    return 'Student Sanctuary';
  })();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EAE5DB]">
      {/* Top Utility Announcement Bar */}
      <div className="bg-[#121829] text-white px-4 py-1.5 text-xs flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
          <span className="text-[#D49A3D] font-mono uppercase text-[10px] font-bold tracking-widest flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Saremi Conservatory</span>
          </span>
          <span className="hidden sm:inline text-white/30">•</span>
          <span className="hidden sm:inline text-white/70 text-[11px]">
            Live 1:1 Vocal & Instrumental Mentorship
          </span>
        </div>

        {/* Read-only Authenticated User Status */}
        <div className="flex items-center gap-2">
          {user ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/10 text-white font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-white/70 hidden sm:inline">Role:</span>
              <span className="font-bold text-amber-300">{getRoleLabel(role)}</span>
            </span>
          ) : (
            <span className="text-[11px] text-white/60 font-medium hidden sm:inline">
              Admissions Open for 2026 Cohorts
            </span>
          )}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Portal Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 text-left group cursor-pointer hover:opacity-90 transition-opacity"
            >
              <SaremiLogo size="md" className="h-10 sm:h-11" alt="Saremi Academy Logo" />
            </button>
          </div>

          {/* Navigation Links / Portal Switcher (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {user ? (
              <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#EAE5DB]">
                <button
                  onClick={() => navigate('/')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    portal === 'public'
                      ? 'bg-white text-[#121829] shadow-xs font-bold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Public Website
                </button>
                <button
                  onClick={() => navigate(userPortalRoute)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    portal !== 'public'
                      ? 'bg-white text-[#121829] shadow-xs font-bold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {role === 'teacher' ? (
                    <Music className="w-3.5 h-3.5 text-emerald-600" />
                  ) : role === 'admin' || role === 'super_admin' ? (
                    <Shield className="w-3.5 h-3.5 text-[#D49A3D]" />
                  ) : (
                    <GraduationCap className="w-3.5 h-3.5 text-[#D49A3D]" />
                  )}
                  <span>{userPortalLabel}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-5 text-xs font-semibold text-gray-700">
                <button
                  onClick={() => navigate('/courses')}
                  className={`hover:text-[#8C6428] transition-colors cursor-pointer ${currentPath.startsWith('/course') ? 'text-[#8C6428] font-bold' : ''}`}
                >
                  Curriculum
                </button>
                <button
                  onClick={() => navigate('/pricing')}
                  className={`hover:text-[#8C6428] transition-colors cursor-pointer ${currentPath === '/pricing' ? 'text-[#8C6428] font-bold' : ''}`}
                >
                  Tuition
                </button>
                <button
                  onClick={() => navigate('/masterclasses')}
                  className={`hover:text-[#8C6428] transition-colors cursor-pointer ${currentPath === '/masterclasses' ? 'text-[#8C6428] font-bold' : ''}`}
                >
                  Masterclasses
                </button>
                <button
                  onClick={() => navigate('/tools')}
                  className={`hover:text-[#8C6428] transition-colors cursor-pointer ${currentPath === '/tools' ? 'text-[#8C6428] font-bold' : ''}`}
                >
                  Riyaaz Tools
                </button>
              </div>
            )}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Free Trial Button */}
            <Button
              variant="brass"
              size="sm"
              onClick={() => navigate('/free-trial')}
              className="hidden sm:inline-flex"
            >
              Book 1:1 Trial
            </Button>

            {/* 🛍️ Store Button */}
            <button
              onClick={() => navigate('/shop')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                currentPath === '/shop'
                  ? 'bg-[#121829] text-[#D49A3D] border-[#121829] shadow-xs'
                  : 'bg-white hover:bg-amber-50 text-[#121829] border-gray-200 hover:border-[#D49A3D]/60'
              }`}
            >
              <span className="text-sm">🛍️</span>
              <span>Store</span>
            </button>

            {/* Notification Center (if logged in) */}
            {user && <NotificationCenter />}

            {/* User Profile / Auth Button */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/app/profile')}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 text-left transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-[#121829] text-[#D49A3D] font-bold flex items-center justify-center text-xs">
                    {(profile?.name || user.displayName || 'U')[0].toUpperCase()}
                  </div>
                  <div className="hidden xl:block">
                    <span className="text-xs font-bold text-gray-900 block leading-none truncate max-w-[100px]">
                      {profile?.name || user.displayName || 'Learner'}
                    </span>
                    <span className="text-[10px] text-gray-400 capitalize block">
                      {role}
                    </span>
                  </div>
                </button>
                <button
                  onClick={logout}
                  className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={onOpenAuth}>
                Sign In
              </Button>
            )}

            {/* Mobile Navigation Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 lg:hidden cursor-pointer"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Public Sub-Navigation Bar (Desktop) */}
      {portal === 'public' && (
        <div className="hidden lg:block border-t border-gray-100 bg-[#FAF8F5]/80 py-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs font-semibold text-gray-600">
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
              <button
                onClick={() => navigate('/courses')}
                className={`hover:text-[#8C6428] transition-colors cursor-pointer ${currentPath.startsWith('/course') ? 'text-[#8C6428] font-bold' : ''}`}
              >
                Curriculum
              </button>
              <button
                onClick={() => navigate('/pricing')}
                className={`hover:text-[#8C6428] transition-colors cursor-pointer ${currentPath === '/pricing' ? 'text-[#8C6428] font-bold' : ''}`}
              >
                Tuition
              </button>
              <button
                onClick={() => navigate('/masterclasses')}
                className={`hover:text-[#8C6428] transition-colors cursor-pointer ${currentPath === '/masterclasses' ? 'text-[#8C6428] font-bold' : ''}`}
              >
                Masterclasses
              </button>
              <button
                onClick={() => navigate('/events')}
                className={`hover:text-[#8C6428] transition-colors cursor-pointer ${currentPath === '/events' ? 'text-[#8C6428] font-bold' : ''}`}
              >
                Recitals
              </button>
              <button
                onClick={() => navigate('/tools')}
                className={`hover:text-[#8C6428] transition-colors cursor-pointer ${currentPath === '/tools' ? 'text-[#8C6428] font-bold' : ''}`}
              >
                Riyaaz Studio
              </button>
              <button
                onClick={() => navigate('/shop')}
                className={`hover:text-[#8C6428] transition-colors cursor-pointer ${currentPath === '/shop' ? 'text-[#8C6428] font-bold' : ''}`}
              >
                Saremi Store
              </button>
              <button
                onClick={() => navigate('/certifications')}
                className={`hover:text-[#8C6428] transition-colors cursor-pointer ${currentPath === '/certifications' ? 'text-[#8C6428] font-bold' : ''}`}
              >
                Graded Diplomas
              </button>
              <button
                onClick={() => navigate('/blog')}
                className={`hover:text-[#8C6428] transition-colors cursor-pointer ${currentPath.startsWith('/blog') ? 'text-[#8C6428] font-bold' : ''}`}
              >
                Journal
              </button>
              <button
                onClick={() => navigate('/about')}
                className={`hover:text-[#8C6428] transition-colors cursor-pointer ${currentPath === '/about' ? 'text-[#8C6428] font-bold' : ''}`}
              >
                Our Story
              </button>
              <button
                onClick={() => navigate('/faq')}
                className={`hover:text-[#8C6428] transition-colors cursor-pointer ${currentPath === '/faq' ? 'text-[#8C6428] font-bold' : ''}`}
              >
                FAQ
              </button>
              <button
                onClick={() => navigate('/contact')}
                className={`hover:text-[#8C6428] transition-colors cursor-pointer ${currentPath === '/contact' ? 'text-[#8C6428] font-bold' : ''}`}
              >
                Contact
              </button>
            </div>
            <button
              onClick={() => navigate('/free-trial')}
              className="text-[#8C6428] hover:text-[#704f1e] font-bold flex items-center gap-1 cursor-pointer font-mono"
            >
              <span>1:1 Diagnostic Trial</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-4 animate-in slide-in-from-top duration-200">
          {/* Authenticated User Status or Sign In on Mobile */}
          {user ? (
            <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EAE5DB] space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-900 block truncate">
                    {profile?.name || user.displayName || 'Learner'}
                  </span>
                  <span className="text-[10px] text-amber-700 font-bold uppercase font-mono">
                    {getRoleLabel(role)}
                  </span>
                </div>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="px-2.5 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 pt-1">
                <button
                  onClick={() => { navigate(userPortalRoute); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#121829] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Open {userPortalLabel}</span>
                  <span>→</span>
                </button>
                {(role === 'admin' || role === 'super_admin') && currentPath !== '/admin' && (
                  <button
                    onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}
                    className="w-full py-2 px-3 text-xs font-bold rounded-xl border border-gray-300 text-gray-800 flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4 text-[#D49A3D]" />
                    <span>Open Admin Console</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { onOpenAuth(); setMobileMenuOpen(false); }}
                className="w-full py-2.5 min-h-[44px] text-xs font-bold cursor-pointer"
              >
                Sign In to Saremi
              </Button>
            </div>
          )}

          {/* Public Pages Sub-List on Mobile */}
          <div className="pt-2 border-t border-gray-100">
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold block mb-2">
              Public Conservatory Pages
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-xs text-gray-700">
              {[
                { label: 'Saremi Store', path: '/shop' },
                { label: 'Curriculum & Syllabi', path: '/courses' },
                { label: 'Tuition & Packages', path: '/pricing' },
                { label: 'Free Diagnostic Trial', path: '/free-trial' },
                { label: 'Maestro Masterclasses', path: '/masterclasses' },
                { label: 'Recitals & Concerts', path: '/events' },
                { label: 'Riyaaz Tools & Tanpura', path: '/tools' },
                { label: '4-Pillar Diplomas', path: '/certifications' },
                { label: 'Conservatory Journal', path: '/blog' },
                { label: 'Our Story & Heritage', path: '/about' },
                { label: 'Frequently Asked Questions', path: '/faq' },
                { label: 'Admissions Desk', path: '/contact' }
              ].map(item => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                  className="p-2 rounded-lg text-left hover:bg-[#FAF8F5] min-h-[44px] flex items-center cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
            <Button
              variant="brass"
              size="sm"
              onClick={() => { navigate('/free-trial'); setMobileMenuOpen(false); }}
              className="w-full min-h-[44px]"
            >
              Book 1:1 Diagnostic Trial
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
