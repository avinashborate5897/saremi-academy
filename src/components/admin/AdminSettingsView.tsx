import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Shield,
  Building,
  CreditCard,
  Bell,
  Mail,
  Lock
} from 'lucide-react';
import {
  subscribeToAcademySettings,
  saveAcademySettings,
  recordAuditLog
} from '../../lib/adminFirestoreService';
import { AcademySettings } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const AdminSettingsView: React.FC = () => {
  const { user: currentAdmin, role } = useAuth();
  const [settings, setSettings] = useState<AcademySettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAcademySettings(setSettings);
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    await saveAcademySettings(settings);
    await recordAuditLog(
      {
        id: currentAdmin?.uid || 'admin',
        name: currentAdmin?.displayName || 'Admin',
        role: role || 'admin'
      },
      'Updated Academy Global Settings',
      'settings',
      'academy_settings',
      'Updated academy business contact, support email, and operational policies.'
    );

    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (!settings) {
    return <div className="p-8 text-center text-slate-400">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-slate-900">
            Academy Configuration & Security
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage institutional profile, payment credentials, and operational policies.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Saved Successfully!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Institutional Profile */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Building className="w-4 h-4 text-slate-700" />
            <h3 className="font-serif text-base font-bold text-slate-900">
              Institutional Profile
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Academy Name</label>
              <input
                type="text"
                value={settings.academyName || 'Saremi Academy of Classical Arts'}
                onChange={(e) => setSettings({ ...settings, academyName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Official Support Email</label>
              <input
                type="email"
                value={settings.supportEmail || 'support@saremi.academy'}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Official Admissions Hotline</label>
              <input
                type="text"
                value={settings.supportPhone || '+91 98200 12345'}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Registered Address / Head Office</label>
              <input
                type="text"
                value={settings.businessAddress || 'Saremi House, Mumbai & Varanasi, India'}
                onChange={(e) => setSettings({ ...settings, businessAddress: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Security & Access Policies */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Shield className="w-4 h-4 text-slate-700" />
            <h3 className="font-serif text-base font-bold text-slate-900">
              Security & Policy Enforcement
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <strong className="block text-slate-900 font-bold">Enforce Dual-Factor Authorization for Refunds</strong>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Requires Super Admin authorization logging before Razorpay refunds are initiated.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                Enforced (Active)
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <strong className="block text-slate-900 font-bold">Automatic Conflict Detection in Scheduler</strong>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Prevents double-booking same faculty guru across simultaneous 1:1 sessions.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                Enabled
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
