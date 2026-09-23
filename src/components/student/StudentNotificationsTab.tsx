import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Clock, Calendar, AlertCircle, Info, Sparkles, Video, ArrowRight, Smartphone, ShieldCheck, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../router/RouterContext';
import { subscribeToUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../lib/notificationService';
import type { AppNotification } from '../../types';
import { SaremiEmptyState, SaremiCard, SaremiBadge } from '../common/SaremiUI';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export const StudentNotificationsTab: React.FC = () => {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const { isSupported, isGranted, requestPermission, sendLocalReminder } = usePushNotifications();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsub = subscribeToUserNotifications(user.uid, 'student', (items) => {
      setNotifications(items);
      setLoading(false);
    });

    return () => {
      if (unsub) unsub();
    };
  }, [user?.uid]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filtered = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  const handleMarkAllRead = async () => {
    if (!user?.uid) return;
    await markAllNotificationsAsRead(user.uid);
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-1">
            <Bell className="w-3.5 h-3.5 text-amber-700" />
            Academy Alerts
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">Notifications</h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
            Class schedules, teacher feedback notes, practice assignments, and administrative updates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold text-gray-600">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filter === 'all' ? 'bg-white text-gray-900 shadow-xs' : ''
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filter === 'unread' ? 'bg-white text-gray-900 shadow-xs' : ''
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {/* PUSH NOTIFICATION OPT-IN BANNER FOR MOBILE CLASS REMINDERS */}
      {isSupported && (
        <div className={`p-5 sm:p-6 rounded-3xl border transition-all ${
          isGranted
            ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-100'
            : 'bg-gradient-to-r from-amber-900 via-stone-900 to-slate-900 border-amber-500/40 text-white shadow-xl'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                isGranted
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              }`}>
                {isGranted ? <ShieldCheck className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isGranted ? 'bg-emerald-500/30 text-emerald-300' : 'bg-amber-500/30 text-amber-300'
                  }`}>
                    {isGranted ? 'Mobile Push Reminders Active' : 'Home Screen Push Notifications'}
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold">
                  {isGranted
                    ? 'Instant Class Reminders Enabled 🎵'
                    : 'Get 1:1 Live Class Reminders Directly on Your Phone'}
                </h3>
                <p className="text-xs text-gray-300 mt-0.5 max-w-xl leading-relaxed">
                  {isGranted
                    ? 'Your service worker is configured to alert you 15 minutes before every live 1:1 mentorship class and when your guru posts feedback.'
                    : 'Never miss a live lesson or guru feedback update. Receive instant native push alerts even when the app is closed.'}
                </p>
              </div>
            </div>

            {isGranted ? (
              <button
                onClick={() => sendLocalReminder('🎵 Test 1:1 Class Reminder', 'Your Hindustani Vocal mentorship session starts in 15 minutes!')}
                className="px-4 py-2.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/40 transition-all cursor-pointer shrink-0 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Send Test Alert</span>
              </button>
            ) : (
              <button
                onClick={requestPermission}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-xl cursor-pointer shrink-0 flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                <span>Enable Mobile Reminders</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-7 h-7 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-xs font-medium">Checking your notification alerts...</p>
        </div>
      ) : filtered.length === 0 ? (
        <SaremiEmptyState
          icon="🔔"
          title={filter === 'unread' ? 'No unread notifications' : 'You are all caught up!'}
          description="Class reminders, teacher evaluations, homework updates, and academy announcements will appear here."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((notif) => {
            const isUnread = !notif.isRead;
            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                  isUnread
                    ? 'bg-amber-50/40 border-amber-200/90 shadow-xs hover:border-amber-400'
                    : 'bg-white border-gray-100 hover:border-gray-200 shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      notif.type === 'class_reminder' || notif.type === 'class_scheduled'
                        ? 'bg-indigo-100 text-indigo-700'
                        : notif.type === 'notes_added' || notif.type === 'homework_assigned'
                        ? 'bg-amber-100 text-amber-800'
                        : notif.type === 'payment_success' || notif.type === 'enrollment_active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {notif.type === 'class_reminder' || notif.type === 'class_scheduled' ? (
                      <Calendar className="w-5 h-5" />
                    ) : notif.type === 'notes_added' || notif.type === 'homework_assigned' ? (
                      <Sparkles className="w-5 h-5" />
                    ) : notif.type === 'payment_success' || notif.type === 'enrollment_active' ? (
                      <Sparkles className="w-5 h-5" />
                    ) : (
                      <Info className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-bold ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notif.title}
                      </h4>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-amber-600 inline-block" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notif.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {notif.link && (
                        <span className="text-amber-700 font-semibold flex items-center gap-0.5 hover:underline">
                          View details <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isUnread && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await markNotificationAsRead(notif.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-100/50 rounded-lg transition-colors cursor-pointer text-xs shrink-0"
                    title="Mark as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
