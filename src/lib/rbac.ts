import { Role, Permission } from '../types';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  visitor: ['view_public'],
  student: [
    'view_public',
    'access_student_portal'
  ],
  parent: [
    'view_public'
  ],
  teacher: [
    'view_public',
    'access_teacher_portal',
    'manage_classes'
  ],
  academic_coordinator: [
    'view_public',
    'access_student_portal',
    'access_teacher_portal',
    'access_admin_panel',
    'manage_students',
    'manage_teachers',
    'manage_curriculum',
    'manage_classes',
    'manage_reports'
  ],
  sales: [
    'view_public',
    'access_admin_panel',
    'manage_leads'
  ],
  finance: [
    'view_public',
    'access_admin_panel',
    'manage_payments',
    'manage_reports'
  ],
  admin: [
    'view_public',
    'access_student_portal',
    'access_teacher_portal',
    'access_admin_panel',
    'manage_students',
    'manage_teachers',
    'manage_curriculum',
    'manage_classes',
    'manage_payments',
    'manage_leads',
    'manage_events',
    'manage_reports'
  ],
  super_admin: [
    'view_public',
    'access_student_portal',
    'access_teacher_portal',
    'access_admin_panel',
    'manage_students',
    'manage_teachers',
    'manage_curriculum',
    'manage_classes',
    'manage_payments',
    'manage_leads',
    'manage_events',
    'manage_reports',
    'manage_system_settings'
  ]
};

/**
 * Checks if a given role possesses a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Validates if user can navigate to a specific root route
 */
export function canAccessRoute(role: Role, pathname: string): boolean {
  if (pathname.startsWith('/admin')) {
    return hasPermission(role, 'access_admin_panel');
  }
  if (pathname.startsWith('/teacher-app')) {
    return hasPermission(role, 'access_teacher_portal');
  }
  if (pathname.startsWith('/app')) {
    return hasPermission(role, 'access_student_portal');
  }
  return true; // Public routes are accessible to all
}

/**
 * Role display label helper
 */
export function getRoleLabel(role: Role): string {
  switch (role) {
    case 'super_admin': return 'Super Administrator';
    case 'admin': return 'Staff Administrator';
    case 'academic_coordinator': return 'Academic Coordinator';
    case 'finance': return 'Finance & Billing Lead';
    case 'sales': return 'Admissions & Sales';
    case 'teacher': return 'Conservatory Guru / Mentor';
    case 'parent': return 'Parent / Guardian';
    case 'student': return 'Enrolled Student';
    case 'visitor': return 'Academy Guest';
    default: return 'User';
  }
}
