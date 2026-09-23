import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, Eye, EyeOff, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../router/RouterContext';

export const FirstLoginPasswordModal: React.FC = () => {
  const { user, profile, completePasswordChange, logout } = useAuth();
  const { navigate } = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // If not requiring password change or no user, do not render
  if (!user || !profile?.requiresPasswordChange) {
    return null;
  }

  const passwordLengthValid = newPassword.length >= 6;
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!passwordLengthValid) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMsg('Passwords do not match. Please verify and try again.');
      return;
    }

    try {
      setLoading(true);
      await completePasswordChange(newPassword);
      setSuccess(true);
      setTimeout(() => {
        if (profile.role === 'teacher') {
          navigate('/teacher-app');
        } else if (profile.role === 'admin' || profile.role === 'super_admin') {
          navigate('/admin');
        } else {
          navigate('/app');
        }
      }, 1200);
    } catch (err: any) {
      console.error('[First Login Password Change Error]', err);
      let msg = err.message || 'Failed to update password. Please try again.';
      if (err.code === 'auth/requires-recent-login') {
        msg = 'Your temporary session has expired. Please log out and sign in again to set your new password.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-200/60 overflow-hidden relative"
      >
        {/* Top Gold Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700" />

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-700 shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-amber-700 uppercase bg-amber-100/60 px-3 py-1 rounded-full border border-amber-200 inline-block mb-2">
            First-Time Faculty Login
          </span>
          <h2 className="font-serif text-2xl font-bold text-slate-900">
            Set Your Secure Password
          </h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Namaste, <strong className="text-slate-900">{profile?.name || 'Guru'}</strong>! You are logging in with a temporary password provided by academy administration. Please establish a private password to secure your Faculty Studio.
          </p>
        </div>

        {profile?.teacherId && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 mb-5 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Faculty Identifier:</span>
            <span className="font-mono font-bold text-amber-700">{profile.teacherId}</span>
          </div>
        )}

        {success ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-slate-900">Password Established!</h3>
            <p className="text-xs text-slate-500">
              Your faculty account is now fully secured. Launching your Faculty Studio...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                New Personal Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-1 py-1 text-[11px] text-slate-500">
              <div className={`flex items-center gap-1.5 ${passwordLengthValid ? 'text-emerald-600 font-semibold' : ''}`}>
                <span className="text-xs">{passwordLengthValid ? '✓' : '•'}</span>
                <span>At least 6 characters</span>
              </div>
              <div className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-600 font-semibold' : ''}`}>
                <span className="text-xs">{passwordsMatch ? '✓' : '•'}</span>
                <span>Passwords match</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !passwordLengthValid || !passwordsMatch}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Securing Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Update Password & Enter Studio</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out and return home</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
