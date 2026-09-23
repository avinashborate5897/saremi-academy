import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  Calendar, 
  BookOpen, 
  CreditCard, 
  Award, 
  Video, 
  Clock, 
  AlertTriangle, 
  Megaphone, 
  ExternalLink 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../router/RouterContext';
import { 
  subscribeToUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../lib/notificationService';
import type { AppNotification } from '../types';

export const NotificationCenter: React.FC = () => {
  const { user, loading, isProfileReady } = useAuth();
  const { navigate } = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (loading || !user?.uid || !isProfileReady) return;
    const unsubscribe = subscribeToUserNotifications(user.uid, (notifs) => {
      setNotifications(notifs);
    });
    return () => unsubscribe();
  }, [user?.uid, loading, isProfileReady]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await markNotificationAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead(notifications);
  };

  const handleClickNotification = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id);
    }
    if (notif.link) {
      if (notif.link.startsWith('http')) {
        window.open(notif.link, '_blank');
      } else {
        navigate(notif.link);
      }
      setIsOpen(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'student_demo_booking_confirmation':
      case 'class_reminder':
      case 'student_class_booking':
        return <Calendar className="w-4 h-4 text-amber-600" />;
      case 'student_enrollment_confirmation':
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'student_class_meet_link':
        return <Video className="w-4 h-4 text-blue-600" />;
      case 'student_class_rescheduled':
      case 'student_class_reminder':
        return <Clock className="w-4 h-4 text-purple-600" />;
      case 'student_class_cancelled':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'admin_announcement':
        return <Megaphone className="w-4 h-4 text-amber-600" />;
      case 'assignment':
        return <BookOpen className="w-4 h-4 text-indigo-500" />;
      case 'feedback':
        return <Award className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-amber-600" />;
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-600 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50 text-left">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-[#FAF8F5]">
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-gray-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {unreadCount} New
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-amber-700 font-semibold hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                No notifications right now.
              </div>
            ) : notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => handleClickNotification(notif)}
                className={`p-3 flex gap-3 rounded-xl transition-all cursor-pointer ${
                  notif.isRead 
                    ? 'opacity-75 hover:opacity-100 bg-transparent hover:bg-gray-50' 
                    : 'bg-amber-50/40 hover:bg-amber-50/70 border border-amber-100/60'
                }`}
              >
                <div className="mt-0.5 p-1.5 rounded-lg bg-white shadow-2xs shrink-0 h-fit">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-gray-900 leading-tight truncate">
                      {notif.title}
                    </h4>
                    {!notif.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-600 leading-snug mt-0.5 line-clamp-2">
                    {notif.message}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-gray-400 block">
                      {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : 'Just now'}
                    </span>
                    {notif.link && (
                      <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-0.5">
                        Open <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>
                {!notif.isRead && (
                  <button 
                    onClick={(e) => handleMarkAsRead(notif.id, e)} 
                    className="text-gray-400 hover:text-emerald-600 p-1 cursor-pointer shrink-0"
                    title="Mark as read"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
