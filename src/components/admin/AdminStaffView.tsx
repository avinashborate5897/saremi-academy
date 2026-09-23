import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  User,
  Shield,
  Trash2,
  Lock,
  Mail,
  AlertTriangle
} from 'lucide-react';
import {
  subscribeToAdminUsers,
  saveAdminUser,
  recordAuditLog
} from '../../lib/adminFirestoreService';
import { AdminUser, Role } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const AdminStaffView: React.FC = () => {
  const { user: currentAdmin, role: currentRole } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [newStaff, setNewStaff] = useState<Partial<AdminUser>>({
    email: '',
    name: '',
    role: 'admin',
    department: 'Academic Operations',
    active: true,
    permissions: ['manage_students', 'manage_classes', 'view_reports']
  });

  useEffect(() => {
    const unsub = subscribeToAdminUsers(setAdmins);
    return () => unsub();
  }, []);

  const filteredStaff = admins.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.email || !newStaff.name) return;

    const id = newStaff.id || `staff_${Date.now()}`;
    const staffData: AdminUser = {
      id,
      email: newStaff.email.trim(),
      name: newStaff.name.trim(),
      role: newStaff.role || 'admin',
      department: newStaff.department || 'Operations',
      active: newStaff.active !== false,
      permissions: newStaff.permissions || ['manage_students', 'manage_classes'],
      createdAt: new Date().toISOString()
    };

    await saveAdminUser(staffData);
    await recordAuditLog(
      {
        id: currentAdmin?.uid || 'admin',
        name: currentAdmin?.displayName || 'Admin',
        role: currentRole || 'admin'
      },
      'Created Staff Admin Account',
      'settings',
      id,
      `Granted ${staffData.role} permissions to ${staffData.name} (${staffData.email}) in ${staffData.department}`
    );

    setShowModal(false);
    setNewStaff({
      email: '',
      name: '',
      role: 'admin',
      department: 'Academic Operations',
      active: true,
      permissions: ['manage_students', 'manage_classes']
    });
  };

  const handleToggleActive = async (staff: AdminUser) => {
    const updated = { ...staff, active: !staff.active };
    await saveAdminUser(updated);
    await recordAuditLog(
      {
        id: currentAdmin?.uid || 'admin',
        name: currentAdmin?.displayName || 'Admin',
        role: currentRole || 'admin'
      },
      'Updated Staff Active Status',
      'settings',
      staff.id,
      `Toggled staff member ${staff.name} status to ${updated.active ? 'Active' : 'Suspended'}`
    );
  };

  return (
    <div className="space-y-6 text-left">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative min-w-[200px] sm:min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff by name, email, role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Staff Member & Email</th>
                <th className="py-3.5 px-4">Assigned Role (RBAC)</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-300 flex items-center justify-center font-bold text-xs">
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{staff.name}</div>
                        <div className="text-[11px] text-slate-500">{staff.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        staff.role === 'super_admin'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      <span>{staff.role === 'super_admin' ? 'Super Admin' : 'Staff Admin'}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">{staff.department || 'Operations'}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        staff.active !== false
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {staff.active !== false ? 'Authorized' : 'Suspended'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleToggleActive(staff)}
                      className={`text-xs font-bold ${
                        staff.active !== false ? 'text-red-600 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-700'
                      }`}
                    >
                      {staff.active !== false ? 'Revoke Access' : 'Restore Access'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-left border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-serif text-lg font-bold text-slate-900">Add Staff Administrator</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikramaditya Sen"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Academy Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. vikram@saremi.academy"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Staff Role (RBAC)</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                >
                  <option value="admin">Operations Admin</option>
                  <option value="super_admin">Super Administrator (Full Power)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Admissions / CRM / Finance"
                  value={newStaff.department}
                  onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800"
                >
                  Authorize Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
