import React, { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  Download,
  Bell,
  Sparkles,
  Shield,
  User,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Check,
  Calendar,
  CreditCard,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../router/RouterContext';
import { 
  subscribeToAdminNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../../lib/notificationService';
import type { AppNotification } from '../../types';

interface AdminHeaderProps {
  onToggleMobileSidebar: () => void;
  title: string;
  subtitle?: string;
  onExportCSV?: () => void;
  exportLabel?: string;
  onSearch?: (term: string) => void;
  searchTerm?: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onToggleMobileSidebar,
  title,
  subtitle,
  onExportCSV,
  exportLabel = 'Export CSV',
  onSearch,
  searchTerm = ''
}) => {
  const { user, role } = useAuth();
  const { navigate } = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const unsub = subscribeToAdminNotifications((items) => {
      setNotifications(items);
    });
    return () => unsub();
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(notifications);
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
      setShowNotifications(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'admin_new_demo_booking':
        return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'admin_new_enrollment':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'admin_teacher_assigned':
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      case 'admin_notification_failure':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      default:
        return <Bell className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Mobile trigger & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            aria-label="Open Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-left">
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-500 hidden sm:block mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Search, CSV Export, Live Site Link, Profile Status */}
        <div className="flex items-center gap-2.5 sm:gap-3 justify-end flex-wrap">
          {/* Global Filter/Search if handler supplied */}
          {onSearch && (
            <div className="relative min-w-[160px] sm:min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>
          )}

          {/* Export Button */}
          {onExportCSV && (
            <button
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">{exportLabel}</span>
            </button>
          )}

          {/* View Live Academy Button */}
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Live Academy</span>
          </button>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 relative cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-84 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 text-left">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Live Academy Alerts</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-bold text-amber-700 hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="py-2 space-y-2 max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No admin alerts right now.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          notif.isRead 
                            ? 'bg-slate-50 border-slate-100 opacity-75 hover:opacity-100' 
                            : 'bg-amber-50/50 border-amber-200'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 shrink-0">
                            {getAlertIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {notif.title}
                              </span>
                              <span className="text-[9px] text-slate-400 shrink-0">
                                {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-snug">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500">
                  <span>System Broadcasts Active</span>
                  <button 
                    onClick={() => {
                      navigate('/admin/announcements');
                      setShowNotifications(false);
                    }}
                    className="font-bold text-amber-700 hover:underline cursor-pointer"
                  >
                    Send Announcement &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
