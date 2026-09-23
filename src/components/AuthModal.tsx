import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, AlertCircle, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from '@/src/router/RouterContext';
import { SaremiLogo } from './common/SaremiLogo';
import { getFriendlyAuthErrorMessage } from '../lib/authErrorUtils';

interface AuthModalProps {
  onClose: () => void;
  initialMode?: 'signin' | 'signup' | 'reset';
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, initialMode = 'signin' }) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, sendResetEmail, isAdmin } = useAuth();
  const { navigate } = useRouter();

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const routeByRole = (userProfile: any, userEmail?: string | null) => {
    const userRole = userProfile?.role?.toLowerCase();
    const email = (userEmail || userProfile?.email || '').toLowerCase();

    // Automatic role-based routing from users/{uid} profile
    if (email === 'avinashborate5897@gmail.com' || userRole === 'super_admin' || userRole === 'admin') {
      navigate('/admin');
    } else if (userRole === 'teacher') {
      navigate('/teacher-app');
    } else {
      // Default: Student dashboard
      navigate('/app');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const syncedProfile = await signInWithEmail(email.trim(), password);
        onClose();
        routeByRole(syncedProfile, email.trim());
      } else if (mode === 'signup') {
        if (!fullName.trim()) {
          setErrorMsg('Please provide your full name.');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters.');
          setIsLoading(false);
          return;
        }
        await signUpWithEmail(email.trim(), password, fullName.trim(), phone.trim());
        onClose();
        // Student flow: Sign Up -> Student Account -> Student Dashboard
        navigate('/app');
      } else if (mode === 'reset') {
        await sendResetEmail(email.trim());
        setResetSuccess(true);
      }
    } catch (err: any) {
      console.warn('Auth notice:', err?.message || err);
      setErrorMsg(getFriendlyAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const syncedProfile = await signInWithGoogle();
      if (!syncedProfile) {
        // User closed or cancelled popup window
        setIsLoading(false);
        return;
      }
      onClose();
      routeByRole(syncedProfile, syncedProfile?.email);
    } catch (err: any) {
      console.warn('Google Sign In notice:', err?.message || err);
      let msg = err.message || 'Google sign-in was cancelled or encountered an error.';
      if (err.code === 'auth/operation-not-allowed') {
        msg = 'Google Sign-in is not yet enabled in your Firebase Console. Please enable "Google" under Firebase Authentication -> Sign-in method.';
      } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setIsLoading(false);
        return;
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 relative text-left shadow-2xl animate-in fade-in zoom-in-95 border border-amber-100/60 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold transition-colors cursor-pointer"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="mb-4">
          <SaremiLogo size="md" className="h-9 sm:h-10 mb-2" alt="Saremi Academy" />
        </div>

        {/* Mode Switcher Tabs */}
        {mode !== 'reset' && (
          <div className="flex bg-gray-100 p-1 rounded-2xl mb-5">
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setMode('signin');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setMode('signup');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#121829]">
          {mode === 'signin' && 'Welcome Back'}
          {mode === 'signup' && 'Create Student Account'}
          {mode === 'reset' && 'Reset Password'}
        </h3>
        <p className="text-xs text-[#5F667B] mt-1">
          {mode === 'signin' && 'Sign in to access your portal, classes, and dashboard.'}
          {mode === 'signup' && 'Register as a student to begin your 1:1 mentorship and track your practice.'}
          {mode === 'reset' && 'Enter your registered email address to receive password reset instructions.'}
        </p>

        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-50 text-red-700 text-xs flex items-start gap-2.5 border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {resetSuccess ? (
          <div className="mt-6 p-5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs space-y-3 border border-emerald-200 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="font-bold text-sm text-emerald-900">Password Reset Link Sent</p>
            <p className="text-emerald-700 leading-relaxed">
              We have dispatched instructions to <strong>{email}</strong>. Check your inbox and follow the link to set a new password.
            </p>
            <button
              onClick={() => {
                setResetSuccess(false);
                setMode('signin');
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              <span>Back to Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ananya Sharma"
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#121829] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp / Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#121829] focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@domain.com"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#121829] focus:outline-none"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-gray-700">Password</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg(null);
                        setMode('reset');
                      }}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-900 cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#121829] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#121829] hover:bg-[#1D2640] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                'Processing...'
              ) : mode === 'signin' ? (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : mode === 'signup' ? (
                <>
                  <span>Create Student Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : (
                <span>Send Password Reset Link</span>
              )}
            </button>
          </form>
        )}

        {mode !== 'reset' && (
          <>
            <div className="relative my-5 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <span className="relative bg-white px-3 text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                or continue with
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-2.5 border-2 border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign In with Google</span>
            </button>
          </>
        )}

        <div className="mt-5 text-center text-xs text-gray-500">
          {mode === 'reset' && (
            <p>
              Remember your credentials?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setMode('signin');
                }}
                className="font-bold text-[#121829] hover:underline cursor-pointer"
              >
                Return to sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
