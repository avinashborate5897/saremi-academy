import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Users, 
  User, 
  Mail, 
  MessageSquare, 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Smartphone, 
  Search,
  Check,
  RefreshCw,
  Megaphone
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { sendAdminAnnouncement, subscribeToAdminNotifications } from '../../lib/notificationService';
import type { AppNotification } from '../../types';

interface UserContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'student' | 'teacher';
}

export const AdminAnnouncementsView: React.FC = () => {
  // Form State
  const [audience, setAudience] = useState<'all_students' | 'all_teachers' | 'one_student' | 'one_teacher' | 'selected_users'>('all_students');
  const [selectedSingleUserId, setSelectedSingleUserId] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [channels, setChannels] = useState<('in_app' | 'email' | 'whatsapp')[]>(['in_app', 'email', 'whatsapp']);

  // Data State
  const [students, setStudents] = useState<UserContact[]>([]);
  const [teachers, setTeachers] = useState<UserContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Dispatch Status
  const [isSending, setIsSending] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{ success: boolean; message: string } | null>(null);

  // Past Announcements Feed
  const [pastAnnouncements, setPastAnnouncements] = useState<AppNotification[]>([]);

  // Load Contact Directory
  useEffect(() => {
    const loadDirectory = async () => {
      try {
        setIsLoadingContacts(true);
        // Load Students
        const studentsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student'), limit(200)));
        const loadedStudents: UserContact[] = studentsSnap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.name || 'Student Learner',
            email: d.email || '',
            phone: d.phone || d.whatsapp || '',
            role: 'student'
          };
        });
        setStudents(loadedStudents);

        // Load Teachers
        const teachersSnap = await getDocs(collection(db, 'teachers'));
        const loadedTeachers: UserContact[] = teachersSnap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.name || 'Faculty Maestro',
            email: d.email || '',
            phone: d.phone || d.whatsapp || '',
            role: 'teacher'
          };
        });
        setTeachers(loadedTeachers);
      } catch (err) {
        console.warn('Failed to load contacts directory:', err);
      } finally {
        setIsLoadingContacts(false);
      }
    };

    loadDirectory();
  }, []);

  // Subscribe to past announcements
  useEffect(() => {
    const unsub = subscribeToAdminNotifications((items) => {
      const announcements = items.filter(i => i.type === 'admin_announcement');
      setPastAnnouncements(announcements);
    });
    return () => unsub();
  }, []);

  const toggleChannel = (channel: 'in_app' | 'email' | 'whatsapp') => {
    if (channels.includes(channel)) {
      if (channels.length === 1) return; // Must keep at least one channel
      setChannels(channels.filter(c => c !== channel));
    } else {
      setChannels([...channels, channel]);
    }
  };

  const toggleSelectUser = (id: string) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter(uid => uid !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setDispatchResult({ success: false, message: 'Please enter both an announcement title and message body.' });
      return;
    }

    if (audience === 'one_student' && !selectedSingleUserId) {
      setDispatchResult({ success: false, message: 'Please select a student recipient.' });
      return;
    }
    if (audience === 'one_teacher' && !selectedSingleUserId) {
      setDispatchResult({ success: false, message: 'Please select a teacher recipient.' });
      return;
    }
    if (audience === 'selected_users' && selectedUserIds.length === 0) {
      setDispatchResult({ success: false, message: 'Please select at least one recipient.' });
      return;
    }

    setIsSending(true);
    setDispatchResult(null);

    try {
      const res = await sendAdminAnnouncement({
        audience,
        targetUserId: (audience === 'one_student' || audience === 'one_teacher') ? selectedSingleUserId : undefined,
        targetUserIds: audience === 'selected_users' ? selectedUserIds : undefined,
        title: title.trim(),
        message: message.trim(),
        link: link.trim() || undefined,
        channels
      });

      if (res.success) {
        setDispatchResult({ 
          success: true, 
          message: `Announcement successfully dispatched to ${res.count || 'recipients'} via ${channels.join(', ')}.` 
        });
        // Reset message form
        setTitle('');
        setMessage('');
        setLink('');
        setSelectedUserIds([]);
        setSelectedSingleUserId('');
      } else {
        setDispatchResult({ success: false, message: res.error || 'Failed to dispatch announcement.' });
      }
    } catch (err: any) {
      setDispatchResult({ success: false, message: err.message || 'Network error occurred.' });
    } finally {
      setIsSending(false);
    }
  };

  // Filterable contacts for selection
  const candidateList = audience === 'one_teacher' 
    ? teachers 
    : audience === 'one_student' 
    ? students 
    : [...students, ...teachers];

  const filteredCandidates = candidateList.filter(c => 
    c.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(userSearchTerm))
  );

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold uppercase tracking-wider">
              Academy Communication Engine
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-slate-900">
            Announcements & Notifications
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Broadcast messages or send direct alerts to Students and Faculty across In-App, Email, and WhatsApp.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSend} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Megaphone className="w-5 h-5 text-amber-600" />
              <h3 className="font-serif font-bold text-slate-900 text-base">
                Create New Announcement
              </h3>
            </div>

            {/* Target Audience Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                1. Select Target Audience
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'all_students', label: 'All Students', icon: Users, desc: `${students.length} Learners` },
                  { id: 'all_teachers', label: 'All Faculty', icon: Users, desc: `${teachers.length} Gurus` },
                  { id: 'one_student', label: 'One Student', icon: User, desc: 'Direct 1:1 Alert' },
                  { id: 'one_teacher', label: 'One Teacher', icon: User, desc: 'Direct 1:1 Alert' },
                  { id: 'selected_users', label: 'Selected Users', icon: Users, desc: 'Multi-recipient' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = audience === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setAudience(item.id as any);
                        setSelectedSingleUserId('');
                        setSelectedUserIds([]);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-700' : 'text-slate-500'}`} />
                        <span className={`text-xs font-bold ${isSelected ? 'text-amber-950' : 'text-slate-800'}`}>
                          {item.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direct Recipient Picker for Single / Selected */}
            {(audience === 'one_student' || audience === 'one_teacher' || audience === 'selected_users') && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    {audience === 'one_student' && 'Select Student Recipient'}
                    {audience === 'one_teacher' && 'Select Teacher Recipient'}
                    {audience === 'selected_users' && `Select Specific Recipients (${selectedUserIds.length} chosen)`}
                  </span>
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search name, phone, email..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {filteredCandidates.length === 0 ? (
                    <div className="text-xs text-slate-400 p-2 text-center">No contacts matched your search.</div>
                  ) : (
                    filteredCandidates.map((c) => {
                      const isSingleSelected = selectedSingleUserId === c.id;
                      const isMultiSelected = selectedUserIds.includes(c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            if (audience === 'selected_users') {
                              toggleSelectUser(c.id);
                            } else {
                              setSelectedSingleUserId(c.id);
                            }
                          }}
                          className={`p-2 rounded-lg border flex items-center justify-between transition-colors cursor-pointer text-xs ${
                            isSingleSelected || isMultiSelected
                              ? 'bg-amber-100/60 border-amber-400 text-amber-950 font-bold'
                              : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          <div>
                            <span className="font-semibold">{c.name}</span>
                            <span className="text-[10px] text-slate-500 ml-2">
                              {c.email || 'No email'} • {c.phone ? `WhatsApp: ${c.phone}` : 'No phone'}
                            </span>
                          </div>
                          <div className="shrink-0">
                            {isSingleSelected || isMultiSelected ? (
                              <CheckCircle2 className="w-4 h-4 text-amber-700" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-300" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Announcement Subject */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                2. Announcement Title / Subject
              </label>
              <input
                type="text"
                placeholder="e.g. Masterclass with Pandit Vidyadhar / Holiday Studio Schedule"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                required
              />
            </div>

            {/* Announcement Message */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                3. Message Content
              </label>
              <textarea
                rows={4}
                placeholder="Type the announcement details here. This message will be sent in-app, via email, and formatted for WhatsApp."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                required
              />
            </div>

            {/* Optional Link */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                4. Action Link / Classroom URL (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. /live/room_masterclass or /student/classes"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800"
              />
            </div>

            {/* Dispatch Channels */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                5. Communication Channels
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  { id: 'in_app', label: 'In-App Bell & Inbox', icon: Bell },
                  { id: 'email', label: 'Transactional Email', icon: Mail },
                  { id: 'whatsapp', label: 'WhatsApp Mobile Alert', icon: Smartphone }
                ].map((ch) => {
                  const Icon = ch.icon;
                  const isChecked = channels.includes(ch.id as any);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => toggleChannel(ch.id as any)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{ch.label}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 ml-1 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status Alert */}
            {dispatchResult && (
              <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 font-medium ${
                dispatchResult.success 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' 
                  : 'bg-rose-50 border border-rose-200 text-rose-900'
              }`}>
                {dispatchResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{dispatchResult.message}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSending}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Dispatching Announcement...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Announcement Now</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar: Past Announcements & Channel Readiness */}
        <div className="space-y-6">
          {/* Channel Readiness Status */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <h3 className="font-serif font-bold text-slate-900 text-sm">
              Delivery Channels Health
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800">In-App Notifications</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900">
                  Live & Realtime
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-800">Transactional Email</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                  Server Integrated
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800">WhatsApp Business</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  Meta API Ready
                </span>
              </div>
            </div>
          </div>

          {/* Past Announcements History */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <h3 className="font-serif font-bold text-slate-900 text-sm flex items-center justify-between">
              <span>Recent Announcements</span>
              <span className="text-[10px] text-slate-400 font-normal">Live Log</span>
            </h3>

            {pastAnnouncements.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No past announcements logged yet. Sent announcements will display here.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {pastAnnouncements.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 line-clamp-1">{item.title}</span>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] line-clamp-2 leading-relaxed">{item.message}</p>
                    <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-500">
                      <span className="font-semibold text-slate-700">To: {item.recipientRole || item.userId}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
