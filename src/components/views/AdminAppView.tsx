import React, { useState } from 'react';
import { useRouter } from '../../router/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { AdminSidebar } from '../admin/AdminSidebar';
import { AdminHeader } from '../admin/AdminHeader';
import { AdminDashboardOverview } from '../admin/AdminDashboardOverview';
import { AdminStudentsView } from '../admin/AdminStudentsView';
import { AdminTeachersView } from '../admin/AdminTeachersView';
import { AdminClassesView } from '../admin/AdminClassesView';
import { AdminTrialsView } from '../admin/AdminTrialsView';
import { AdminPaymentsView } from '../admin/AdminPaymentsView';
import { AdminPricingView } from '../admin/AdminPricingView';
import { AdminCouponsView } from '../admin/AdminCouponsView';
import { AdminCertificatesView } from '../admin/AdminCertificatesView';
import { AdminAuditLogsView } from '../admin/AdminAuditLogsView';
import { AdminStaffView } from '../admin/AdminStaffView';
import { AdminCMSView } from '../admin/AdminCMSView';
import { AdminAnnouncementsView } from '../admin/AdminAnnouncementsView';
import { AdminSettingsView } from '../admin/AdminSettingsView';
import { LeadManagementCRM } from '../admin/LeadManagementCRM';
import { AdminRevenueReports } from '../admin/AdminRevenueReports';
import { AdminResourcesView } from '../admin/AdminResourcesView';
import { AdminCoursesView } from '../admin/AdminCoursesView';
import { AdminPricingManagement } from '../admin/AdminPricingManagement';
import { AdminAttendanceView } from '../admin/AdminAttendanceView';
import { getFriendlyAuthErrorMessage } from '../../lib/authErrorUtils';
import { exportToCSV } from '../../lib/adminFirestoreService';
import { ShieldAlert, LogIn, Sparkles } from 'lucide-react';
import { SaremiLogo } from '../common/SaremiLogo';

export const AdminAppView: React.FC = () => {
  const { currentPath, navigate } = useRouter();
  const { user, role, loading: authLoading, signInWithEmail, sendResetEmail, logout } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Admin sign-in state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Authentication & Admin Authorization Gate
  const isAdmin = role === 'admin' || role === 'super_admin';

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      setLoginLoading(true);
      await signInWithEmail(adminEmail.trim(), adminPassword);
    } catch (err: any) {
      console.warn('Admin login notice:', err?.message || err);
      setLoginError(getFriendlyAuthErrorMessage(err));
    } finally {
      setLoginLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-slate-50 text-center">
        <div>
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium text-sm">Loading Admin Console...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-slate-50 text-left">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6 text-center">
          <div className="flex justify-center mb-2">
            <SaremiLogo size="md" className="h-10" alt="Saremi Academy" />
          </div>

          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 inline-flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Admin Authorization Required</span>
            </span>
            <h2 className="font-serif text-2xl font-bold text-slate-900 mt-2">
              Saremi Staff Operations Console
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              This protected portal requires verified staff or super admin credentials.
            </p>
          </div>

          {!user ? (
            <form onSubmit={handleAdminSignIn} className="space-y-3.5 text-left pt-2">
              {loginError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {loginError}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Staff / Admin Email</label>
                <input
                  type="email"
                  required
                  placeholder="admin@saremi.academy"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!adminEmail.trim()) {
                        setLoginError('Please enter your Staff / Admin email above first to receive a password reset link.');
                        return;
                      }
                      try {
                        await sendResetEmail(adminEmail.trim());
                        setLoginError(null);
                        alert(`Password reset link dispatched to ${adminEmail.trim()}. Please check your inbox.`);
                      } catch (err: any) {
                        setLoginError(getFriendlyAuthErrorMessage(err));
                      }
                    }}
                    className="text-[11px] text-amber-700 hover:text-amber-800 font-medium cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    {showAdminPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loginLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Admin Console</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Return to Academy Home
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-left text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-rose-900">
                  <span>Current Access Level:</span>
                  <span className="uppercase font-mono">{role}</span>
                </div>
                <p className="text-[11px] text-rose-700">
                  You are currently logged in as <strong>{user.email}</strong>. This account does not possess administrator permissions.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => navigate('/app')}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Return to Student Portal
                </button>
                <button
                  onClick={async () => {
                    await logout();
                  }}
                  className="w-full py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Log Out & Switch Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Determine Title & Subtitle based on Route
  const getRouteMeta = () => {
    switch (currentPath) {
      case '/admin':
        return {
          title: 'Operations Command Center',
          subtitle: 'Real-time telemetry for admissions, live classes, faculty schedules, and transactions.'
        };
      case '/admin/analytics':
        return {
          title: 'Revenue & Performance Analytics',
          subtitle: 'Financial insights, cohort retention metrics, and enrollment velocity.'
        };
      case '/admin/students':
        return {
          title: 'Student Roster & Profiles',
          subtitle: 'Active student registry, course progression, 360° student drawer, and contact data.'
        };
      case '/admin/teachers':
        return {
          title: 'Faculty & Guru Directory',
          subtitle: 'Conservatory faculty credentials, gharana lineages, ratings, and active batch loads.'
        };
      case '/admin/courses':
        return {
          title: 'Course & Program Management',
          subtitle: 'Create and manage academy courses and syllabi.'
        };
      case '/admin/packages':
        return {
          title: 'Package Management',
          subtitle: 'Manage learning modes, session counts, and subscription packages.'
        };
      case '/admin/pricing':
        return {
          title: 'Pricing Engine & Package Matrix',
          subtitle: 'Live package tariffs for 1:1 Individual, Small Group, and Multi-month tiers.'
        };
      case '/admin/classes':
        return {
          title: 'Class Scheduler & Video Links',
          subtitle: 'Conflict-checked schedule builder, live Agora classrooms, and status toggles.'
        };
      case '/admin/attendance':
        return {
          title: 'Attendance & Corrective Logging',
          subtitle: 'Monitor and update class attendance for past sessions.'
        };
      case '/admin/resources':
        return {
          title: 'Study Materials & Resources',
          subtitle: 'Upload, manage, and share practice recordings, PDFs, and notations.'
        };
      case '/admin/trials':
        return {
          title: 'Trial Bookings Pipeline',
          subtitle: '1-on-1 audition and trial assessment scheduler with 1-click enrollment conversion.'
        };
      case '/admin/leads':
        return {
          title: 'Admissions & CRM Pipeline',
          subtitle: 'Manage prospective student inquiries, follow-up stages, and counselor notes.'
        };
      case '/admin/coupons':
        return {
          title: 'Coupons & Discount Engine',
          subtitle: 'Promotional discount codes, percentage / flat reductions, and redemption limits.'
        };
      case '/admin/payments':
      case '/admin/invoices':
        return {
          title: 'Razorpay Transaction Ledger',
          subtitle: 'Audited financial ledger, payment settlement statuses, and refund authorization.'
        };
      case '/admin/certificates':
        return {
          title: 'Certificate Authority & Diplomas',
          subtitle: 'Issue, view, and cryptographically verify graduation diplomas.'
        };
      case '/admin/audit-logs':
        return {
          title: 'System Audit Trail',
          subtitle: 'Immutable record of staff actions, refund authorizations, and state updates.'
        };
      case '/admin/content':
      case '/admin/announcements':
        return {
          title: 'Website CMS & Copywriting',
          subtitle: 'Edit live website hero headlines, alert ribbons, student FAQs, and testimonials.'
        };
      case '/admin/admins':
        return {
          title: 'Staff Roles & Access Control',
          subtitle: 'Manage administrative accounts, role delegation, and RBAC permissions.'
        };
      case '/admin/settings':
        return {
          title: 'Academy Institutional Settings',
          subtitle: 'Legal entity details, GSTIN tax identifiers, and security policies.'
        };
      default:
        return {
          title: 'Admin Operations',
          subtitle: 'Saremi Academy Administrative Console'
        };
    }
  };

  const routeMeta = getRouteMeta();

  // Render Subview
  const renderCurrentView = () => {
    switch (currentPath) {
      case '/admin':
        return <AdminDashboardOverview />;
      case '/admin/analytics':
      case '/admin/reports':
        return <AdminRevenueReports />;
      case '/admin/students':
        return <AdminStudentsView />;
      case '/admin/teachers':
        return <AdminTeachersView />;
      case '/admin/courses':
        return <AdminCoursesView />;
      case '/admin/packages':
        return <AdminPricingManagement />;
      case '/admin/pricing':
        return <AdminPricingView />;
      case '/admin/classes':
        return <AdminClassesView />;
      case '/admin/attendance':
        return <AdminAttendanceView />;
      case '/admin/resources':
        return <AdminResourcesView />;
      case '/admin/trials':
        return <AdminTrialsView />;
      case '/admin/leads':
        return <LeadManagementCRM />;
      case '/admin/coupons':
        return <AdminCouponsView />;
      case '/admin/payments':
      case '/admin/invoices':
        return <AdminPaymentsView />;
      case '/admin/certificates':
        return <AdminCertificatesView />;
      case '/admin/audit-logs':
        return <AdminAuditLogsView />;
      case '/admin/content':
        return <AdminCMSView />;
      case '/admin/announcements':
        return <AdminAnnouncementsView />;
      case '/admin/admins':
        return <AdminStaffView />;
      case '/admin/settings':
        return <AdminSettingsView />;
      default:
        return <AdminDashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex text-left font-sans antialiased text-slate-800">
      {/* Admin Sidebar Navigation */}
      <AdminSidebar
        currentPath={currentPath}
        onNavigate={(path) => navigate(path)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <AdminHeader
          title={routeMeta.title}
          subtitle={routeMeta.subtitle}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* View Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
};
