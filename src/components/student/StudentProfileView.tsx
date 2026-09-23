import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../router/RouterContext';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Lock, 
  Key, 
  Edit3, 
  Save, 
  Copy, 
  Check, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles,
  Globe
} from 'lucide-react';
import { SaremiCard } from '../common/SaremiUI';

export const StudentProfileView: React.FC = () => {
  const { user, profile, updateStudentProfile, sendResetEmail, changePassword, logout } = useAuth();
  const { navigate } = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Password / Security reset state
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [resetMessage, setResetMessage] = useState('');

  // Direct In-Place Password Change State
  const [showPasswordChangeForm, setShowPasswordChangeForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);

  // Form states for profile information
  const [name, setName] = useState(profile?.name || user?.displayName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [preferredInstrument, setPreferredInstrument] = useState(profile?.preferredInstrument || 'vocals');
  const [skillLevel, setSkillLevel] = useState(profile?.skillLevel || 'Beginner');
  const [bio, setBio] = useState(profile?.bio || '');
  const [timeZone, setTimeZone] = useState(profile?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata');

  // Synchronize state when profile loads asynchronously
  React.useEffect(() => {
    if (!isEditing && profile) {
      setName(profile.name || user?.displayName || '');
      setPhone(profile.phone || '');
      setPreferredInstrument(profile.preferredInstrument || 'vocals');
      setSkillLevel(profile.skillLevel || 'Beginner');
      setBio(profile.bio || '');
      if (profile.timeZone) {
        setTimeZone(profile.timeZone);
      }
    }
  }, [profile, user, isEditing]);

  const handleCopyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      await updateStudentProfile({
        name: name.trim(),
        phone: phone.trim(),
        preferredInstrument,
        skillLevel,
        bio: bio.trim(),
        timeZone
      });
      setSaveStatus('saved');
      setIsEditing(false);
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setSaveStatus('idle');
    }
  };

  const handleTriggerPasswordReset = async () => {
    if (!user?.email) return;
    setResetStatus('sending');
    try {
      await sendResetEmail(user.email);
      setResetStatus('sent');
      setResetMessage(`Password reset link dispatched to ${user.email}. Check your inbox.`);
      setTimeout(() => setResetStatus('idle'), 5000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setResetStatus('error');
      setResetMessage(err.message || 'Failed to send password reset email.');
      setTimeout(() => setResetStatus('idle'), 4000);
    }
  };

  const handleDirectPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError(null);

    if (newPassword.length < 6) {
      setPasswordChangeError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordChangeError('New passwords do not match. Please verify.');
      return;
    }

    try {
      setPasswordChangeStatus('saving');
      await changePassword(currentPassword, newPassword);
      setPasswordChangeStatus('saved');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordChangeStatus('idle');
        setShowPasswordChangeForm(false);
      }, 2500);
    } catch (err: any) {
      console.error('Direct password change error:', err);
      setPasswordChangeStatus('error');
      let msg = err.message || 'Failed to update password.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Incorrect current password. Please re-enter your existing password.';
      }
      setPasswordChangeError(msg);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* 1. HEADER & UNIQUE STUDENT IDENTIFIER */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-600 p-1 shadow-lg shrink-0">
              <div className="w-full h-full rounded-[22px] bg-white flex items-center justify-center text-3xl font-serif font-bold text-amber-700 overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={profile?.name || 'Student'} className="w-full h-full object-cover" />
                ) : (
                  profile?.name?.charAt(0).toUpperCase() || 'S'
                )}
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
                  {profile?.name || user?.displayName || 'Student Musician'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  Active Student
                </span>
              </div>
              
              <p className="text-xs sm:text-sm text-gray-500 font-mono mb-2">{user?.email}</p>
              
              {/* Unique Student User ID */}
              <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-xl text-xs font-mono text-gray-700 border border-gray-200">
                <span className="font-bold text-gray-400">UID:</span>
                <span className="select-all font-semibold">{user?.uid || 'Not Authenticated'}</span>
                <button
                  type="button"
                  onClick={handleCopyUid}
                  className="text-gray-400 hover:text-gray-900 transition-colors cursor-pointer ml-1"
                  title="Copy Unique Student ID"
                >
                  {copiedUid ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
            </button>

            <button
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {saveStatus === 'saved' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Profile details updated successfully in your permanent student record.</span>
          </motion.div>
        )}
      </div>

      {/* 2. EDITABLE PROFILE INFORMATION */}
      {isEditing ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-4">
          <h3 className="font-serif text-xl font-bold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-amber-600" />
            Edit Student Profile Information
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp / Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Primary Discipline</label>
                <select
                  value={preferredInstrument}
                  onChange={(e) => setPreferredInstrument(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:outline-none"
                >
                  <option value="vocals">Vocal (Hindustani Classical)</option>
                  <option value="guitar">Guitar (Acoustic / Classical)</option>
                  <option value="piano">Piano / Keyboard</option>
                  <option value="tabla">Tabla & Percussion</option>
                  <option value="flute">Bansuri / Flute</option>
                  <option value="violin">Violin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Experience Level</label>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:outline-none"
                >
                  <option value="Beginner">Beginner (Foundation)</option>
                  <option value="Intermediate">Intermediate (Developing)</option>
                  <option value="Advanced">Advanced (Proficient)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Musical Background & Goals</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your musical goals, prior training, or favourite ragas/genres..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveStatus === 'saving'}
                className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-4">
          <h3 className="font-serif text-xl font-bold text-gray-900">Personal & Contact Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <span className="text-gray-400 font-bold block mb-1">Email Address</span>
              <span className="font-bold text-gray-900">{profile?.email || user?.email}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <span className="text-gray-400 font-bold block mb-1">WhatsApp / Phone</span>
              <span className="font-bold text-gray-900">{profile?.phone || 'Not provided'}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <span className="text-gray-400 font-bold block mb-1">Primary Discipline</span>
              <span className="font-bold text-gray-900 capitalize">{profile?.preferredInstrument || 'Hindustani Vocals'}</span>
            </div>
          </div>
          {profile?.bio && (
            <div className="mt-4 p-4 bg-amber-50/40 rounded-2xl border border-amber-100 text-xs text-gray-700 leading-relaxed">
              <strong className="text-gray-900 block mb-1">Aspirations & Background:</strong>
              {profile.bio}
            </div>
          )}
        </div>
      )}

      {/* 3. PASSWORD & ACCOUNT SECURITY */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="font-serif text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            Password & Account Security
          </h3>
          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            Protected via Firebase Auth
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-gray-900">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Password Management</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordChangeForm(!showPasswordChangeForm)}
                className="text-amber-700 hover:text-amber-900 font-bold text-[11px] underline cursor-pointer"
              >
                {showPasswordChangeForm ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {showPasswordChangeForm ? (
              <form onSubmit={handleDirectPasswordChange} className="space-y-2.5 pt-1">
                {passwordChangeError && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px]">
                    {passwordChangeError}
                  </div>
                )}
                {passwordChangeStatus === 'saved' && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-[11px] font-bold">
                    ✓ Password successfully changed!
                  </div>
                )}

                <div>
                  <label className="block text-gray-600 font-bold text-[11px] mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 font-bold text-[11px] mb-1">New Password (min 6 chars)</label>
                  <input
                    type="password"
                    required
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 font-bold text-[11px] mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={passwordChangeStatus === 'saving'}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                  >
                    {passwordChangeStatus === 'saving' ? 'Updating...' : 'Save New Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordChangeForm(false)}
                    className="px-3 py-2 border border-gray-200 hover:bg-gray-100 text-gray-600 font-medium rounded-lg text-[11px] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="text-gray-500 leading-relaxed">
                  Update your credentials directly or dispatch a password recovery link to your registered email address.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => setShowPasswordChangeForm(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Change Password</span>
                  </button>
                  <button
                    onClick={handleTriggerPasswordReset}
                    disabled={resetStatus === 'sending'}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <Key className="w-3 h-3 text-amber-600" />
                    <span>{resetStatus === 'sending' ? 'Sending Link...' : 'Email Reset Link'}</span>
                  </button>
                </div>
                {resetStatus === 'sent' && (
                  <p className="text-emerald-700 font-bold text-[11px] mt-1">{resetMessage}</p>
                )}
                {resetStatus === 'error' && (
                  <p className="text-red-600 font-bold text-[11px] mt-1">{resetMessage}</p>
                )}
              </>
            )}
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
            <div className="flex items-center gap-2 font-bold text-gray-900">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>Active Session Information</span>
            </div>
            <div className="space-y-1 text-gray-600">
              <p>• Timezone: <strong className="text-gray-900">{timeZone}</strong></p>
              <p>• Authentication Provider: <strong className="text-gray-900">{user?.providerData[0]?.providerId === 'google.com' ? 'Google OAuth' : 'Email/Password'}</strong></p>
              <p>• Security Protocol: <strong className="text-gray-900">End-to-end Token Encryption</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
