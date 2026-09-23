import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Save,
  CheckCircle2,
  Sparkles,
  Plus,
  Trash2,
  Eye,
  Bell
} from 'lucide-react';
import {
  subscribeToCMSContent,
  saveCMSContent,
  recordAuditLog
} from '../../lib/adminFirestoreService';
import { CMSContent } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const AdminCMSView: React.FC = () => {
  const { user: currentAdmin, role } = useAuth();
  const [cms, setCms] = useState<CMSContent | null>(null);
  const [activeSection, setActiveSection] = useState<'hero' | 'announcements' | 'faqs' | 'stats'>('hero');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const unsub = subscribeToCMSContent(setCms);
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cms) return;

    setIsSaving(true);
    await saveCMSContent(cms);
    await recordAuditLog(
      {
        id: currentAdmin?.uid || 'admin',
        name: currentAdmin?.displayName || 'Admin',
        role: role || 'admin'
      },
      'Updated Website CMS Copy',
      'cms',
      'site_cms',
      'Modified live website hero copy, announcements, FAQs, and academy stats.'
    );

    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (!cms) {
    return <div className="p-8 text-center text-slate-400">Loading website CMS data...</div>;
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-slate-900">
            Website Content & CMS Engine
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Modify live landing copy, top bar alert ribbons, and student FAQs instantly.
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
              <span>Published to Website!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Publishing...' : 'Save & Publish Live'}</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold text-slate-500">
        <button
          onClick={() => setActiveSection('hero')}
          className={`py-3 border-b-2 transition-colors ${
            activeSection === 'hero' ? 'border-amber-500 text-slate-900' : 'border-transparent'
          }`}
        >
          Hero Banner & Tagline
        </button>
        <button
          onClick={() => setActiveSection('announcements')}
          className={`py-3 border-b-2 transition-colors ${
            activeSection === 'announcements' ? 'border-amber-500 text-slate-900' : 'border-transparent'
          }`}
        >
          Announcement Bar
        </button>
        <button
          onClick={() => setActiveSection('faqs')}
          className={`py-3 border-b-2 transition-colors ${
            activeSection === 'faqs' ? 'border-amber-500 text-slate-900' : 'border-transparent'
          }`}
        >
          Student FAQs ({cms.faqs?.length || 0})
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {activeSection === 'hero' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1 text-xs">Hero Headline *</label>
              <input
                type="text"
                value={cms.heroTitle || ''}
                onChange={(e) => setCms({ ...cms, heroTitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-serif font-bold text-base"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-xs">Hero Subtitle</label>
              <textarea
                rows={3}
                value={cms.heroSubtitle || ''}
                onChange={(e) => setCms({ ...cms, heroSubtitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>
        )}

        {activeSection === 'announcements' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="annActive"
                checked={cms.announcementBar?.enabled}
                onChange={(e) =>
                  setCms({
                    ...cms,
                    announcementBar: {
                      ...cms.announcementBar,
                      enabled: e.target.checked,
                      text: cms.announcementBar?.text || 'Admissions open for 2026 Batch',
                      link: cms.announcementBar?.link || '/trial'
                    }
                  })
                }
                className="rounded border-slate-300 text-amber-500"
              />
              <label htmlFor="annActive" className="text-xs font-bold text-slate-900">
                Enable Top Notification Banner across all pages
              </label>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-xs">Banner Message Text</label>
              <input
                type="text"
                value={cms.announcementBar?.text || ''}
                onChange={(e) =>
                  setCms({
                    ...cms,
                    announcementBar: {
                      ...cms.announcementBar,
                      enabled: cms.announcementBar?.enabled ?? true,
                      text: e.target.value,
                      link: cms.announcementBar?.link || '/trial'
                    }
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>
        )}

        {activeSection === 'faqs' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-serif text-sm font-bold text-slate-900">FAQ Question / Answer Pairs</h3>
              <button
                type="button"
                onClick={() =>
                  setCms({
                    ...cms,
                    faqs: [
                      ...(cms.faqs || []),
                      {
                        question: 'What is the format of 1:1 classes?',
                        answer: 'Classes are conducted live over our integrated Agora Live Conservatory Studio with pristine 48kHz high-fidelity studio audio.'
                      }
                    ]
                  })
                }
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                + Add FAQ
              </button>
            </div>

            <div className="space-y-3">
              {cms.faqs?.map((faq, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 text-xs">FAQ #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = cms.faqs.filter((_, i) => i !== idx);
                        setCms({ ...cms, faqs: updated });
                      }}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => {
                      const updated = [...cms.faqs];
                      updated[idx].question = e.target.value;
                      setCms({ ...cms, faqs: updated });
                    }}
                    placeholder="Question"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                  />
                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => {
                      const updated = [...cms.faqs];
                      updated[idx].answer = e.target.value;
                      setCms({ ...cms, faqs: updated });
                    }}
                    placeholder="Answer"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
