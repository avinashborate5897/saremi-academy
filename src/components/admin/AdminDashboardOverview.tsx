import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  CreditCard,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Radio,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  DollarSign,
  Video
} from 'lucide-react';
import {
  AdminDashboardStats,
  subscribeToAdminStats,
  subscribeToAuditLogs,
  subscribeToLiveClasses,
  exportToCSV
} from '../../lib/adminFirestoreService';
import { subscribeToTrialBookings } from '../../lib/courseCrmService';
import { AuditLog, ClassSession, TrialBookingRecord } from '../../types';
import { useRouter } from '../../router/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { SuperAdminSandboxBanner } from './SuperAdminSandboxBanner';

export const AdminDashboardOverview: React.FC = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [todayClasses, setTodayClasses] = useState<ClassSession[]>([]);
  const [allTrials, setAllTrials] = useState<TrialBookingRecord[]>([]);
  const { navigate } = useRouter();

  useEffect(() => {
    if (authLoading || !user || !isAdmin) return;

    const unsubStats = subscribeToAdminStats(setStats);
    const unsubLogs = subscribeToAuditLogs((logs) => setRecentLogs(logs.slice(0, 6)));
    const unsubClasses = subscribeToLiveClasses((classes) => {
      setTodayClasses(classes.filter((c) => c.status === 'scheduled' || c.status === 'live').slice(0, 4));
    });
    const unsubTrials = subscribeToTrialBookings((trials) => {
      setAllTrials(trials);
    });

    return () => {
      unsubStats();
      unsubLogs();
      unsubClasses();
      unsubTrials();
    };
  }, [user, isAdmin, authLoading]);

  // Compute live classes right now & attention needed items
  const activeLiveClasses = todayClasses.filter(c => c.status === 'live');
  const trialsNeedingAttention = allTrials.filter(
    t => t.needsAdminAttention || (!t.teacherId && t.status !== 'completed' && t.status !== 'cancelled')
  );

  const statCards = [
    {
      title: 'Total Enrolled Students',
      value: stats?.totalStudents ?? '...',
      sub: `${stats?.activeStudents ?? 0} active learning`,
      icon: <GraduationCap className="w-5 h-5 text-indigo-600" />,
      bg: 'bg-indigo-50 border-indigo-100',
      action: () => navigate('/admin/students')
    },
    {
      title: 'Monthly Revenue (MTD)',
      value: `₹${(stats?.monthlyRevenue ?? 0).toLocaleString('en-IN')}`,
      sub: `₹${(stats?.totalRevenue ?? 0).toLocaleString('en-IN')} all-time`,
      icon: <CreditCard className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50 border-emerald-100',
      action: () => navigate('/admin/payments')
    },
    {
      title: 'Upcoming Classes Today',
      value: stats?.todayClasses ?? '...',
      sub: `${stats?.upcomingClasses ?? 0} scheduled this week`,
      icon: <Calendar className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-50 border-amber-100',
      action: () => navigate('/admin/classes')
    },
    {
      title: 'Pending Trial Bookings',
      value: stats?.pendingTrials ?? '...',
      sub: `${stats?.newLeads ?? 0} new leads in pipeline`,
      icon: <Radio className="w-5 h-5 text-rose-600" />,
      bg: 'bg-rose-50 border-rose-100',
      action: () => navigate('/admin/trials')
    },
    {
      title: 'Certified Conservatory Gurus',
      value: stats?.totalTeachers ?? 0,
      sub: 'Banaras, Maihar, Trinity faculty',
      icon: <Users className="w-5 h-5 text-purple-600" />,
      bg: 'bg-purple-50 border-purple-100',
      action: () => navigate('/admin/teachers')
    },
    {
      title: 'Active Pricing Packages',
      value: stats?.activePackagesCount ?? 0,
      sub: 'Standard 1:1, Group, Premium 1:1',
      icon: <DollarSign className="w-5 h-5 text-cyan-600" />,
      bg: 'bg-cyan-50 border-cyan-100',
      action: () => navigate('/admin/pricing')
    }
  ];

  const handleExportSummary = () => {
    if (!stats) return;
    exportToCSV('saremi_executive_summary', [
      {
        Report: 'Saremi Academy Executive KPI Snapshot',
        GeneratedAt: new Date().toISOString(),
        TotalStudents: stats.totalStudents,
        ActiveStudents: stats.activeStudents,
        MonthlyRevenueINR: stats.monthlyRevenue,
        TotalRevenueINR: stats.totalRevenue,
        UpcomingClasses: stats.upcomingClasses,
        PendingTrials: stats.pendingTrials,
        NewLeads: stats.newLeads,
        ActivePackages: stats.activePackagesCount
      }
    ]);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Super Admin Sandbox Control (Only visible to avinashborate5897@gmail.com) */}
      <SuperAdminSandboxBanner />

      {/* Top Banner / Welcome */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-slate-700">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-mono font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>EXECUTIVE COMMAND SYSTEM</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold">
            Saremi Academy Operations Center
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Live synchronization with admissions CRM, faculty calendars, Razorpay transaction gateway, and student progress engines.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/admin/pricing')}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Manage Pricing
          </button>
          <button
            onClick={handleExportSummary}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Download Summary
          </button>
        </div>
      </div>

      {/* Live Operations & Automation Center Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Live Classes Now */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activeLiveClasses.length > 0 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-slate-900 text-sm">Live Classes In Session</span>
                {activeLiveClasses.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                    🔴 {activeLiveClasses.length} Active Now
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeLiveClasses.length > 0
                  ? `${activeLiveClasses[0].studentName} with ${activeLiveClasses[0].teacherName}`
                  : 'No active Agora live classes streaming right now.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/classes')}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Live Monitor
          </button>
        </div>

        {/* Attention Needed / Automation Health */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${trialsNeedingAttention.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {trialsNeedingAttention.length > 0 ? <AlertCircle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-slate-900 text-sm">
                  {trialsNeedingAttention.length > 0 ? 'Manual Attention Needed' : 'Automation Engine Active'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${trialsNeedingAttention.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {trialsNeedingAttention.length > 0 ? `${trialsNeedingAttention.length} Pending` : '100% Automated'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {trialsNeedingAttention.length > 0
                  ? `${trialsNeedingAttention[0].studentName} (${trialsNeedingAttention[0].courseName}) needs teacher assignment`
                  : 'All trials & enrollments auto-assigned and provisioned.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/trials')}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors"
          >
            {trialsNeedingAttention.length > 0 ? 'Step In & Assign' : 'View Pipeline'}
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => (
          <div
            key={card.title || `kpi-${idx}`}
            onClick={card.action}
            className={`p-5 rounded-2xl border bg-white shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </p>
                <div className="text-2xl sm:text-3xl font-serif font-extrabold text-slate-900 mt-1">
                  {card.value}
                </div>
              </div>
              <div className={`p-3 rounded-xl ${card.bg}`}>
                {card.icon}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">{card.sub}</span>
              <span className="text-amber-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Manage <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Two Columns: Live Class Schedule + Quick Action CRM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Class Schedule Today */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-900">
                Live & Upcoming Sessions
              </h3>
              <p className="text-xs text-slate-500">
                Next scheduled 1:1 masterclasses and faculty sessions
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/classes')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              Open Full Scheduler →
            </button>
          </div>

          <div className="space-y-3">
            {todayClasses.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No active classes scheduled for the immediate window.
              </div>
            ) : (
              todayClasses.map((cls, idx) => (
                <div
                  key={cls.id ? `${cls.id}-${idx}` : `cls-${idx}`}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold font-serif shrink-0">
                      ♫
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{cls.courseTitle}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">
                          {cls.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Student: <strong className="text-slate-900">{cls.studentName}</strong> • Guru: {cls.teacherName}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(cls.scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        <span>• {cls.durationMinutes} mins</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {cls.roomId && (
                      <div className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold inline-flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5" />
                        <span>Video Ready</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Navigation Shortcuts & Audit Trail */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-serif text-lg font-bold text-slate-900">
              Audit Stream & Security
            </h3>
            <p className="text-xs text-slate-500">
              Immutable log of administrative operations
            </p>
          </div>

          <div className="space-y-2.5">
            {recentLogs.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs">
                No recent audit log entries recorded.
              </div>
            ) : (
              recentLogs.map((log, idx) => (
                <div
                  key={log.id ? `${log.id}-${idx}` : `log-${idx}`}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5 text-[11px] line-clamp-1">{log.details}</p>
                  <div className="mt-1 text-[10px] font-mono text-slate-400">
                    by {log.actorName} ({log.actorRole})
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate('/admin/audit-logs')}
              className="w-full py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 text-center transition-colors"
            >
              View Complete Audit Trail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
