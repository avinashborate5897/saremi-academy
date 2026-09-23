import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Tag,
  Save,
  CheckCircle2,
  Sparkles,
  Sliders,
  Award,
  Layers,
  Info
} from 'lucide-react';
import {
  subscribeToAcademySettings,
  saveAcademySettings,
  recordAuditLog
} from '../../lib/adminFirestoreService';
import { AcademySettings } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const AdminPricingView: React.FC = () => {
  const { user: currentAdmin, role } = useAuth();
  const [settings, setSettings] = useState<AcademySettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAcademySettings((s) => {
      setSettings(s);
    });
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
      'Updated Academy Pricing Matrix',
      'pricing',
      'academy_settings',
      'Updated live course pricing, format package tariffs, and GST rates.'
    );

    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (!settings) {
    return <div className="p-8 text-center text-slate-400">Loading live pricing configuration...</div>;
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-slate-900">
            Course Pricing Matrix & Format Tariffs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure live fees for 1:1 Individual, Small Group, and Premium Guru formats.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Saved Live to Database!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save & Publish Matrix'}</span>
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Format 1: 1:1 Live Personal Mentorship */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-900 font-bold">1:1</div>
              <div>
                <h3 className="font-serif text-base font-bold text-slate-900">
                  1-on-1 Individual Mentorship (Standard)
                </h3>
                <p className="text-xs text-slate-500">Dedicated guru, custom raga pacing (45 min sessions)</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
              Most Popular
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">1 Month (4 Weeks / 8 Sessions)</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  value={settings.pricingPackages?.standard1on1?.oneMonth || 4499}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pricingPackages: {
                        ...settings.pricingPackages,
                        standard1on1: {
                          ...settings.pricingPackages?.standard1on1,
                          oneMonth: Number(e.target.value)
                        }
                      }
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-900 text-sm"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">3 Months (12 Weeks / 24 Sessions)</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  value={settings.pricingPackages?.standard1on1?.threeMonth || 11997}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pricingPackages: {
                        ...settings.pricingPackages,
                        standard1on1: {
                          ...settings.pricingPackages?.standard1on1,
                          threeMonth: Number(e.target.value)
                        }
                      }
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-900 text-sm"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">6 Months (24 Weeks / 48 Sessions)</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  value={settings.pricingPackages?.standard1on1?.sixMonth || 24999}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pricingPackages: {
                        ...settings.pricingPackages,
                        standard1on1: {
                          ...settings.pricingPackages?.standard1on1,
                          sixMonth: Number(e.target.value)
                        }
                      }
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-900 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Format 2: Small Group Batches */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-900 font-bold">Group</div>
              <div>
                <h3 className="font-serif text-base font-bold text-slate-900">
                  Interactive Small Group Batches (Max 4 Students)
                </h3>
                <p className="text-xs text-slate-500">Peer practice, rhythm synchronization (60 min sessions)</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">1 Month (8 Sessions)</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  value={settings.pricingPackages?.groupBatch?.oneMonth || 1899}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pricingPackages: {
                        ...settings.pricingPackages,
                        groupBatch: {
                          ...settings.pricingPackages?.groupBatch,
                          oneMonth: Number(e.target.value)
                        }
                      }
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-900 text-sm"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">3 Months (24 Sessions)</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  value={settings.pricingPackages?.groupBatch?.threeMonth || 4842}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pricingPackages: {
                        ...settings.pricingPackages,
                        groupBatch: {
                          ...settings.pricingPackages?.groupBatch,
                          threeMonth: Number(e.target.value)
                        }
                      }
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-900 text-sm"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">6 Months (48 Sessions)</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  value={settings.pricingPackages?.groupBatch?.sixMonth || 14999}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pricingPackages: {
                        ...settings.pricingPackages,
                        groupBatch: {
                          ...settings.pricingPackages?.groupBatch,
                          sixMonth: Number(e.target.value)
                        }
                      }
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-900 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Global Taxes & Surcharge */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-serif text-base font-bold text-slate-900">
              Tax & Invoicing Configuration
            </h3>
            <p className="text-xs text-slate-500">Government GST and Academy registration details</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Applicable GST Rate (%)</label>
              <input
                type="number"
                value={settings.gstRate || 18}
                onChange={(e) => setSettings({ ...settings, gstRate: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">GSTIN Number</label>
              <input
                type="text"
                value={settings.gstinNumber || '27AABCS1429B1Z8'}
                onChange={(e) => setSettings({ ...settings, gstinNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Default Currency</label>
              <input
                type="text"
                value={settings.currency || 'INR'}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold uppercase"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
