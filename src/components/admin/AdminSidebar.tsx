import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Sparkles,
  UserCheck,
  CreditCard,
  Tag,
  FileText,
  Award,
  Radio,
  Video,
  FileCode,
  Image as ImageIcon,
  Bell,
  HelpCircle,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  Settings,
  ChevronRight,
  LogOut,
  Sliders,
  DollarSign,
  ClipboardList,
  Layers
} from 'lucide-react';
import { Role } from '../../types';
import { hasPermission } from '../../lib/rbac';
import { useAuth } from '../../context/AuthContext';
import { SaremiLogo } from '../common/SaremiLogo';

interface AdminSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavGroup {
  label: string;
  items: {
    path: string;
    label: string;
    icon: React.ReactNode;
    requiredPermission?: string;
    badge?: string;
  }[];
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentPath,
  onNavigate,
  isMobileOpen,
  onCloseMobile
}) => {
  const { user, role, logout } = useAuth();

  const navGroups: NavGroup[] = [
    {
      label: 'Executive',
      items: [
        { path: '/admin', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
        { path: '/admin/analytics', label: 'Revenue & Analytics', icon: <TrendingUp className="w-4 h-4" /> },
        { path: '/admin/audit-logs', label: 'Audit Trail', icon: <ShieldAlert className="w-4 h-4" /> }
      ]
    },
    {
      label: 'Academic Operations',
      items: [
        { path: '/admin/students', label: 'Students Roster', icon: <GraduationCap className="w-4 h-4" /> },
        { path: '/admin/teachers', label: 'Faculty & Gurus', icon: <Users className="w-4 h-4" /> },
        { path: '/admin/courses', label: 'Courses & Modes', icon: <BookOpen className="w-4 h-4" /> },
        { path: '/admin/classes', label: 'Class Scheduler', icon: <Calendar className="w-4 h-4" /> },
        { path: '/admin/attendance', label: 'Attendance Log', icon: <UserCheck className="w-4 h-4" /> },
        { path: '/admin/resources', label: 'Resources & Material', icon: <FileText className="w-4 h-4" /> },
        { path: '/admin/certificates', label: 'Certificates Authority', icon: <Award className="w-4 h-4" /> }
      ]
    },
    {
      label: 'Admissions & CRM',
      items: [
        { path: '/admin/leads', label: 'Leads & CRM', icon: <Sparkles className="w-4 h-4" />, badge: 'Live' },
        { path: '/admin/trials', label: 'Trial Bookings', icon: <Radio className="w-4 h-4" /> },
        { path: '/admin/coupons', label: 'Coupons & Offers', icon: <Tag className="w-4 h-4" /> }
      ]
    },
    {
      label: 'Commerce & Ledger',
      items: [
        { path: '/admin/pricing', label: 'Pricing Matrix', icon: <DollarSign className="w-4 h-4" /> },
        { path: '/admin/packages', label: 'Subscription Packages', icon: <Layers className="w-4 h-4" /> },
        { path: '/admin/payments', label: 'Razorpay Ledger', icon: <CreditCard className="w-4 h-4" /> }
      ]
    },
    {
      label: 'Events & CMS',
      items: [
        { path: '/admin/content', label: 'Site CMS & Copy', icon: <FileCode className="w-4 h-4" /> }
      ]
    },
    {
      label: 'Governance',
      items: [
        { path: '/admin/admins', label: 'Staff Roles & RBAC', icon: <ShieldCheck className="w-4 h-4" /> },
        { path: '/admin/settings', label: 'Academy Settings', icon: <Settings className="w-4 h-4" /> }
      ]
    }
  ];

  const handleItemClick = (path: string) => {
    onNavigate(path);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-slate-950 text-slate-300 flex flex-col z-50 transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/95 px-2.5 py-1 rounded-xl shadow-xs">
              <SaremiLogo size="sm" className="h-7 sm:h-8" alt="Saremi Academy" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold text-amber-400 tracking-wider uppercase">
                Staff Console
              </div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
          >
            ✕
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                {group.label}
              </div>
              {group.items.map((item) => {
                const isActive =
                  currentPath === item.path ||
                  (item.path !== '/admin' && currentPath.startsWith(item.path));

                return (
                  <button
                    key={item.path}
                    onClick={() => handleItemClick(item.path)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isActive ? 'text-slate-950' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-400/30">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Footer & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="truncate text-left">
                <div className="text-xs font-bold text-white truncate">
                  {user?.displayName || 'Admin'}
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate">
                  {role === 'super_admin' ? 'Super Admin' : 'Staff Admin'}
                </div>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
