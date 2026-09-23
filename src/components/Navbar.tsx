import React, { useState } from 'react';
import { useRouter } from '../router/RouterContext';
import { useAuth } from '../context/AuthContext';
import { Menu, X, User, Music } from 'lucide-react';
import { Button } from '../design-system';
import { AuthModal } from './AuthModal';

interface NavbarProps {
  onOpenBooking: () => void;
  onExploreCourses: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenBooking, onExploreCourses }) => {
  const { currentPath, navigate } = useRouter();
  const { user, profile, role } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b-2 border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[72px]">
            
            {/* Logo */}
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate('/');
              }}
            >
              <div className="w-12 h-12 rounded-[16px] bg-saremi-primary flex items-center justify-center text-white shadow-sm group-hover:scale-105 group-hover:rotate-6 transition-transform">
                <Music className="w-6 h-6 fill-current" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-2xl tracking-tight text-gray-900 group-hover:text-saremi-primary transition-colors leading-none">
                  Saremi
                </span>
                <span className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mt-1">
                  Music Academy
                </span>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <nav className="flex items-center gap-6">
                <button onClick={() => navigate('/')} className="text-sm font-bold text-gray-600 hover:text-saremi-primary">Home</button>
                <button onClick={() => navigate('/shop')} className="text-sm font-bold text-gray-600 hover:text-saremi-primary">Store</button>
                <button onClick={onExploreCourses} className="text-sm font-bold text-gray-600 hover:text-saremi-primary">Courses</button>
              </nav>

              <div className="flex items-center gap-4 border-l-2 border-gray-100 pl-8">
                {user ? (
                   <>
                    {(role === 'admin' || role === 'super_admin') ? (
                      <Button variant="primary" onClick={() => navigate('/admin')} leftIcon={<User className="w-4 h-4"/>}>
                        Admin Console
                      </Button>
                    ) : role === 'teacher' ? (
                      <Button variant="primary" onClick={() => navigate('/faculty')} leftIcon={<User className="w-4 h-4"/>}>
                        Faculty Portal
                      </Button>
                    ) : (
                      <Button variant="primary" onClick={() => navigate('/app')} leftIcon={<User className="w-4 h-4"/>}>
                        {profile?.name ? profile.name.split(' ')[0] : 'My Portal'}
                      </Button>
                    )}
                   </>
                ) : (
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => setIsAuthOpen(true)}>Log in</Button>
                    <Button variant="outline" onClick={() => setIsAuthOpen(true)}>Sign Up</Button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="flex items-center gap-4 md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-500 hover:text-gray-900 p-2 bg-gray-100 rounded-full"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t-2 border-gray-100 px-4 pt-4 pb-8 space-y-4 shadow-xl">
             <button 
              onClick={() => { setIsMobileMenuOpen(false); navigate('/'); }}
              className="block w-full text-left px-4 py-3 text-base font-bold text-gray-900 bg-gray-50 rounded-xl"
            >
              Home
            </button>
            <button 
              onClick={() => { setIsMobileMenuOpen(false); navigate('/shop'); }}
              className="block w-full text-left px-4 py-3 text-base font-bold text-gray-900 bg-gray-50 rounded-xl"
            >
              Store
            </button>
            <button 
              onClick={() => { setIsMobileMenuOpen(false); onExploreCourses(); }}
              className="block w-full text-left px-4 py-3 text-base font-bold text-gray-900 bg-gray-50 rounded-xl"
            >
              Courses
            </button>
            
            <div className="pt-4 border-t-2 border-gray-100">
              {user ? (
                 <>
                  {(role === 'admin' || role === 'super_admin') ? (
                    <Button variant="primary" className="w-full justify-center" onClick={() => { setIsMobileMenuOpen(false); navigate('/admin'); }}>
                      Admin Console
                    </Button>
                  ) : role === 'teacher' ? (
                    <Button variant="primary" className="w-full justify-center" onClick={() => { setIsMobileMenuOpen(false); navigate('/faculty'); }}>
                      Faculty Portal
                    </Button>
                  ) : (
                    <Button variant="primary" className="w-full justify-center" onClick={() => { setIsMobileMenuOpen(false); navigate('/app'); }}>
                      Go to Portal
                    </Button>
                  )}
                 </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="justify-center" onClick={() => { setIsMobileMenuOpen(false); setIsAuthOpen(true); }}>Log in</Button>
                  <Button variant="primary" className="justify-center" onClick={() => { setIsMobileMenuOpen(false); setIsAuthOpen(true); }}>Sign Up</Button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};
