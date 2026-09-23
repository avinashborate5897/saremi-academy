import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Star,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Download,
  Mail,
  Video,
  Key,
  Shield,
  ShieldCheck,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Phone,
  AlertCircle,
  GraduationCap,
  History,
  UserCheck,
  Sliders,
  Sparkles
} from 'lucide-react';
import {
  subscribeToTeachers,
  saveTeacher,
  createTeacherWithAccount,
  resetTeacherPasswordService,
  recordAuditLog,
  exportToCSV
} from '../../lib/adminFirestoreService';
import { subscribeToTeacherEnrollments, subscribeToAllAcademyEnrollments } from '../../lib/academicEnrollmentService';
import { TeacherProfile, EnrollmentRecord } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { TeacherAvailabilityManager } from '../teacher/TeacherAvailabilityManager';
import { TeacherAssignmentControlModal } from './TeacherAssignmentControlModal';
import { getFriendlyAuthErrorMessage } from '../../lib/authErrorUtils';

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let pass = 'Saremi@';
  for (let i = 0; i < 6; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export const AdminTeachersView: React.FC = () => {
  const { user: currentAdmin, role } = useAuth();
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 360° Profile Drawer
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherProfile | null>(null);
  const [activeTeacherTab, setActiveTeacherTab] = useState<'overview' | 'curriculum' | 'students' | 'availability' | 'access'>('overview');
  const [teacherEnrollments, setTeacherEnrollments] = useState<EnrollmentRecord[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [studentRosterFilter, setStudentRosterFilter] = useState<'active' | 'all'>('active');

  // Edit Profile Modal
  const [editingTeacher, setEditingTeacher] = useState<TeacherProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // New Account & Profile Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    temporaryPassword: generateRandomPassword(),
    phone: '',
    specialization: 'Hindustani Classical Vocals',
    title: 'Senior Conservatory Guru',
    experience: 8,
    languages: 'Hindi, English',
    courses: 'Hindustani Classical Vocals',
    bio: '',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    requirePasswordChange: true
  });
  const [showTempPassword, setShowTempPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Success Credentials Modal (After creating account or resetting password)
  const [credentialsModal, setCredentialsModal] = useState<{
    isOpen: boolean;
    title: string;
    teacherName: string;
    email: string;
    teacherId: string;
    temporaryPassword: string;
    copied: boolean;
  }>({
    isOpen: false,
    title: '',
    teacherName: '',
    email: '',
    teacherId: '',
    temporaryPassword: '',
    copied: false
  });

  // Reset Password Action State
  const [resettingTeacher, setResettingTeacher] = useState<TeacherProfile | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Global Academy Enrollments & Assignment Control Center
  const [allEnrollments, setAllEnrollments] = useState<EnrollmentRecord[]>([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  useEffect(() => {
    const unsubTeachers = subscribeToTeachers(setTeachers);
    const unsubAllEnrollments = subscribeToAllAcademyEnrollments(setAllEnrollments);
    return () => {
      unsubTeachers();
      unsubAllEnrollments();
    };
  }, []);

  // Real-time authoritative student enrollments for selected teacher
  useEffect(() => {
    if (!selectedTeacher?.id) {
      setTeacherEnrollments([]);
      return;
    }
    setEnrollmentsLoading(true);
    const unsub = subscribeToTeacherEnrollments(
      selectedTeacher.id,
      selectedTeacher.teacherId,
      (records) => {
        setTeacherEnrollments(records);
        setEnrollmentsLoading(false);
      }
    );
    return () => unsub();
  }, [selectedTeacher?.id, selectedTeacher?.teacherId]);

  const filteredTeachers = teachers.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.teacherId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.specialization || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (Array.isArray(t.courses) ? t.courses.some((c) => c.toLowerCase().includes(searchTerm.toLowerCase())) : false)
  );

  const handleExport = () => {
    const rows = filteredTeachers.map((t) => ({
      ID: t.id,
      TeacherCode: t.teacherId || 'N/A',
      Name: t.name,
      Email: t.email || 'N/A',
      Specialization: t.specialization,
      ExperienceYears: t.experience,
      Languages: Array.isArray(t.languages) ? t.languages.join('; ') : '',
      Rating: t.rating,
      Active: t.active !== false ? 'Active' : 'Inactive'
    }));
    exportToCSV('saremi_faculty_roster', rows);
  };

  // Open Create Account Modal
  const handleOpenCreateModal = () => {
    setCreateForm({
      name: '',
      email: '',
      temporaryPassword: generateRandomPassword(),
      phone: '',
      specialization: 'Hindustani Classical Vocals',
      title: 'Senior Conservatory Guru',
      experience: 8,
      languages: 'Hindi, English',
      courses: 'Hindustani Classical Vocals',
      bio: '',
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      requirePasswordChange: true
    });
    setCreateError(null);
    setShowCreateModal(true);
  };

  // Submit New Teacher Account
  const handleCreateTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!currentAdmin) {
      setCreateError('You must be authenticated as an administrator to create faculty accounts.');
      return;
    }

    try {
      setIsSubmitting(true);
      const idToken = await currentAdmin.getIdToken(true);

      const parsedLanguages = createForm.languages
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      const parsedCourses = createForm.courses
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const result = await createTeacherWithAccount(idToken, {
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        temporaryPassword: createForm.temporaryPassword.trim(),
        phone: createForm.phone.trim(),
        specialization: createForm.specialization.trim(),
        title: createForm.title.trim(),
        experience: Number(createForm.experience) || 5,
        languages: parsedLanguages.length ? parsedLanguages : ['Hindi', 'English'],
        courses: parsedCourses.length ? parsedCourses : ['Hindustani Classical Vocals'],
        bio: createForm.bio.trim(),
        photo: createForm.photo.trim(),
        requirePasswordChange: createForm.requirePasswordChange
      });

      setShowCreateModal(false);

      // Open Credentials Success Modal
      setCredentialsModal({
        isOpen: true,
        title: 'Faculty Account Successfully Created',
        teacherName: result.teacher.name,
        email: result.teacher.email,
        teacherId: result.teacher.teacherId,
        temporaryPassword: result.teacher.temporaryPassword,
        copied: false
      });
    } catch (err: any) {
      console.error('[Create Teacher Error]', err);
      setCreateError(getFriendlyAuthErrorMessage(err) || err.message || 'Failed to create teacher account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger Reset Password for Existing Teacher
  const handleResetTeacherPassword = async (teacher: TeacherProfile) => {
    if (!currentAdmin) return;
    if (!confirm(`Generate a new temporary password for Guru ${teacher.name}? They will be required to change it upon their next login.`)) {
      return;
    }

    try {
      setIsResetting(true);
      const idToken = await currentAdmin.getIdToken(true);
      const newPass = generateRandomPassword();

      const result = await resetTeacherPasswordService(idToken, teacher.id, newPass);

      setCredentialsModal({
        isOpen: true,
        title: 'Faculty Password Reset Successfully',
        teacherName: teacher.name,
        email: teacher.email || 'N/A',
        teacherId: teacher.teacherId || teacher.id,
        temporaryPassword: result.temporaryPassword,
        copied: false
      });
    } catch (err: any) {
      console.error('[Reset Password Error]', err);
      alert(err.message || 'Failed to reset faculty password');
    } finally {
      setIsResetting(false);
      setResettingTeacher(null);
    }
  };

  // Save changes to existing teacher profile
  const handleSaveEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    await saveTeacher(editingTeacher);
    await recordAuditLog(
      {
        id: currentAdmin?.uid || 'admin',
        name: currentAdmin?.displayName || 'Admin',
        role: role || 'admin'
      },
      'Updated Faculty Profile',
      'teacher',
      editingTeacher.id,
      `Saved profile details for Guru ${editingTeacher.name}`
    );

    setShowEditModal(false);
    setEditingTeacher(null);
  };

  // Copy credentials helper
  const handleCopyCredentials = () => {
    const text = `Saremi Academy Faculty Login Credentials:
Name: ${credentialsModal.teacherName}
Email: ${credentialsModal.email}
Faculty ID: ${credentialsModal.teacherId}
Temporary Password: ${credentialsModal.temporaryPassword}
Login URL: ${window.location.origin}/teacher-app
(Note: You will be required to establish a private password on first login)`;

    navigator.clipboard.writeText(text);
    setCredentialsModal((prev) => ({ ...prev, copied: true }));
    setTimeout(() => {
      setCredentialsModal((prev) => ({ ...prev, copied: false }));
    }, 2500);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative min-w-[200px] sm:min-w-[320px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search faculty by name, email, ID, discipline..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAssignmentModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Capacity & Assignment Matrix</span>
          </button>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Roster</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Faculty Account</span>
          </button>
        </div>
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.map((teacher) => (
          <div
            key={teacher.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              {/* Header */}
              <div 
                onClick={() => setSelectedTeacher(teacher)}
                className="flex items-start gap-4 cursor-pointer hover:opacity-95 transition-opacity"
              >
                <img
                  src={teacher.photo || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'}
                  alt={teacher.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-amber-200 shadow-2xs shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80">
                      {teacher.teacherId || 'FACULTY'}
                    </span>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span className="text-xs font-bold text-slate-900">{teacher.rating || '5.0'}</span>
                    </div>
                  </div>
                  <h3 className="font-serif font-bold text-slate-900 text-base leading-snug truncate hover:text-amber-700 transition-colors">
                    {teacher.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">{teacher.title || teacher.specialization}</p>
                  {teacher.email && (
                    <p className="text-[11px] text-slate-400 font-mono truncate flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span>{teacher.email}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Bio */}
              <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                {teacher.bio || 'Faculty member at Saremi Academy.'}
              </p>

              {/* Tags & Metadata */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">Experience:</span>
                  <span className="font-bold text-slate-900">{teacher.experience || 5} Years</span>
                </div>
                {teacher.phone && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Phone / WhatsApp:</span>
                    <span className="font-medium text-slate-800">{teacher.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">Languages:</span>
                  <span className="font-semibold text-slate-800">
                    {Array.isArray(teacher.languages) ? teacher.languages.join(', ') : 'Hindi, English'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {Array.isArray(teacher.courses) && teacher.courses.map((c, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 text-[10px] font-bold border border-amber-200"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    teacher.active !== false
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {teacher.active !== false ? 'Active Faculty' : 'Inactive'}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedTeacher(teacher)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>View Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      const updated = { ...teacher, active: teacher.active === false ? true : false };
                      saveTeacher(updated).catch(console.error);
                    }}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                      teacher.active !== false 
                        ? 'border-rose-200 text-rose-700 hover:bg-rose-50' 
                        : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {teacher.active !== false ? 'Deactivate' : 'Activate'}
                  </button>

                  <button
                    onClick={() => handleResetTeacherPassword(teacher)}
                    disabled={isResetting}
                    title="Generate new temporary password for this teacher"
                    className="px-2.5 py-1 rounded-lg border border-amber-200 hover:bg-amber-50 text-amber-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Key className="w-3 h-3" />
                    <span>Reset Pass</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingTeacher(teacher);
                      setShowEditModal(true);
                    }}
                    className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Edit profile"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE TEACHER ACCOUNT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl text-left border border-slate-200 max-h-[92vh] overflow-y-auto relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-900">
                    Create Faculty Member Account
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Provisions real authenticated access, Faculty ID, and temporary login credentials
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTeacherSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Guru Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pandit Ronu Majumdar"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Faculty Login Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. guru.ronu@saremi.academy"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 text-slate-900 font-medium"
                  />
                </div>
              </div>

              {/* Temporary Password Row */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-amber-900 font-bold">
                    Initial Temporary Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, temporaryPassword: generateRandomPassword() })}
                    className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate New</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showTempPassword ? 'text' : 'password'}
                    required
                    value={createForm.temporaryPassword}
                    onChange={(e) => setCreateForm({ ...createForm, temporaryPassword: e.target.value })}
                    className="w-full pl-3 pr-10 py-2 rounded-xl border border-amber-300 bg-white font-mono text-sm text-slate-900 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTempPassword(!showTempPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showTempPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <label className="flex items-center gap-2 pt-1 text-[11px] text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createForm.requirePasswordChange}
                    onChange={(e) => setCreateForm({ ...createForm, requirePasswordChange: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span>Force teacher to change password upon first login (Recommended)</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">WhatsApp / Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Primary Discipline / Instrument *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hindustani Classical Vocals"
                    value={createForm.specialization}
                    onChange={(e) => setCreateForm({ ...createForm, specialization: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Title & Gharana</label>
                  <input
                    type="text"
                    placeholder="Banaras Gharana Guru"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={createForm.experience}
                    onChange={(e) => setCreateForm({ ...createForm, experience: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Languages (comma-sep)</label>
                  <input
                    type="text"
                    placeholder="Hindi, English, Marathi"
                    value={createForm.languages}
                    onChange={(e) => setCreateForm({ ...createForm, languages: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Photo Image URL</label>
                <input
                  type="url"
                  value={createForm.photo}
                  onChange={(e) => setCreateForm({ ...createForm, photo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Musical Heritage & Bio</label>
                <textarea
                  rows={2}
                  placeholder="Musical background, lineage, performances, and teaching philosophy..."
                  value={createForm.bio}
                  onChange={(e) => setCreateForm({ ...createForm, bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Provisioning Faculty Account...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Create Account & Issue Credentials</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDENTIALS SUCCESS MODAL */}
      {credentialsModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl text-left border border-amber-200 relative">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-slate-900">
                {credentialsModal.title}
              </h3>
              <p className="text-xs text-slate-500">
                Share these secure credentials with Guru <strong>{credentialsModal.teacherName}</strong>.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans font-bold">Faculty Identifier</span>
                <span className="text-slate-900 font-bold">{credentialsModal.teacherId}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans font-bold">Login Email</span>
                <span className="text-slate-900 font-bold">{credentialsModal.email}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans font-bold">Temporary Password</span>
                <span className="text-amber-700 font-bold text-sm bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block mt-0.5">
                  {credentialsModal.temporaryPassword}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans font-bold">Portal Access Link</span>
                <span className="text-slate-600 break-all text-[11px]">{window.location.origin}/teacher-app</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
              ℹ️ The teacher will be prompted to set their own permanent password immediately upon logging in for the first time.
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleCopyCredentials}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                {credentialsModal.copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Credentials Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Full Credentials Message</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setCredentialsModal((prev) => ({ ...prev, isOpen: false }))}
                className="w-full py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {showEditModal && editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-left border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-serif text-lg font-bold text-slate-900">
                Edit Profile: {editingTeacher.name}
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditTeacher} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Guru Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingTeacher.name}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Title & Gharana</label>
                  <input
                    type="text"
                    value={editingTeacher.title || ''}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, title: e.target.value })}
                    placeholder="e.g. Senior Guru"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Specialization</label>
                  <input
                    type="text"
                    value={editingTeacher.specialization || ''}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, specialization: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    value={editingTeacher.experience}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, experience: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={editingTeacher.rating}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Phone / WhatsApp</label>
                <input
                  type="text"
                  value={editingTeacher.phone || ''}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Photo Image URL</label>
                <input
                  type="url"
                  value={editingTeacher.photo}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, photo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Bio / Musical Heritage</label>
                <textarea
                  rows={3}
                  value={editingTeacher.bio}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 360° TEACHER PROFILE DRAWER */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden text-left">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedTeacher.photo || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'}
                  alt={selectedTeacher.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-amber-300 shadow-2xs shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg font-bold text-slate-900 leading-tight">
                      {selectedTeacher.name}
                    </h3>
                    <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      {selectedTeacher.teacherId || 'SM-TEA-REG'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{selectedTeacher.title || selectedTeacher.specialization}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTeacher(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-slate-200 px-5 gap-4 text-xs font-bold text-slate-500">
              <button
                onClick={() => setActiveTeacherTab('overview')}
                className={`py-3 border-b-2 transition-colors cursor-pointer ${
                  activeTeacherTab === 'overview' ? 'border-amber-500 text-slate-900 font-bold' : 'border-transparent'
                }`}
              >
                Profile Overview
              </button>
              <button
                onClick={() => setActiveTeacherTab('curriculum')}
                className={`py-3 border-b-2 transition-colors cursor-pointer ${
                  activeTeacherTab === 'curriculum' ? 'border-amber-500 text-slate-900 font-bold' : 'border-transparent'
                }`}
              >
                Curriculum & Schedule
              </button>
              <button
                onClick={() => setActiveTeacherTab('students')}
                className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTeacherTab === 'students' ? 'border-amber-500 text-slate-900 font-bold' : 'border-transparent'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>Assigned Students</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 font-mono">
                  {teacherEnrollments.filter((e) => e.status === 'active' || !e.status).length}
                </span>
              </button>
              <button
                onClick={() => setActiveTeacherTab('availability')}
                className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTeacherTab === 'availability' ? 'border-amber-500 text-slate-900 font-bold' : 'border-transparent'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Working Hours & Leaves</span>
              </button>
              <button
                onClick={() => setActiveTeacherTab('access')}
                className={`py-3 border-b-2 transition-colors cursor-pointer ${
                  activeTeacherTab === 'access' ? 'border-amber-500 text-slate-900 font-bold' : 'border-transparent'
                }`}
              >
                Security & Access
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {activeTeacherTab === 'overview' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Faculty Identifier</span>
                      <span className="font-mono font-bold text-slate-900">{selectedTeacher.teacherId || selectedTeacher.id}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        selectedTeacher.active !== false
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {selectedTeacher.active !== false ? 'Active Faculty' : 'Inactive Account'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Official Login Email</span>
                    <span className="font-bold text-slate-800">{selectedTeacher.email || 'Email not linked'}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone / WhatsApp Number</span>
                    <span className="font-bold text-slate-800">{selectedTeacher.phone || 'Not provided'}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Discipline & Specialization</span>
                    <span className="font-bold text-slate-800">{selectedTeacher.specialization || 'Classical Music'}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Experience</span>
                    <span className="font-bold text-slate-800">{selectedTeacher.experience || 5} Years Teaching & Performance</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Gharana Heritage & Biography</span>
                    <p className="mt-1 text-slate-700 leading-relaxed text-[11px] whitespace-pre-wrap font-sans">
                      {selectedTeacher.bio || 'Renowned guru at Saremi Academy.'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Languages Spoken</span>
                    <span className="font-bold text-slate-800">
                      {Array.isArray(selectedTeacher.languages) ? selectedTeacher.languages.join(', ') : 'Hindi, English'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Academic Qualifications</span>
                    <span className="font-bold text-slate-800">
                      {Array.isArray(selectedTeacher.qualifications) ? selectedTeacher.qualifications.join(' • ') : 'Sangeet Praveen'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Academy Join Date</span>
                    <span className="font-bold text-slate-800">
                      {selectedTeacher.createdAt ? new Date(selectedTeacher.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'August 2026'}
                    </span>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => {
                        setEditingTeacher(selectedTeacher);
                        setShowEditModal(true);
                      }}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 cursor-pointer text-xs"
                    >
                      Edit Faculty Profile
                    </button>
                    <button
                      onClick={() => handleResetTeacherPassword(selectedTeacher)}
                      disabled={isResetting}
                      className="px-4 py-2 border border-amber-300 text-amber-800 bg-amber-50 rounded-xl font-bold hover:bg-amber-100 cursor-pointer text-xs"
                    >
                      Reset Password
                    </button>
                  </div>
                </div>
              )}

              {activeTeacherTab === 'curriculum' && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <h4 className="font-bold text-slate-900">Assigned Courses & Disciplines</h4>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {Array.isArray(selectedTeacher.courses) && selectedTeacher.courses.length > 0 ? (
                        selectedTeacher.courses.map((c, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200"
                          >
                            {c}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">No courses tagged yet.</span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <h4 className="font-bold text-slate-900">Teaching Availability Timetable</h4>
                    {Array.isArray(selectedTeacher.availability) && selectedTeacher.availability.length > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        {selectedTeacher.availability.map((slot, i) => (
                          <div key={i} className="flex items-center gap-2 text-slate-700 bg-white p-2 rounded-lg border border-slate-100">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="font-medium">{slot}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic text-[11px]">Flexible availability by appointment.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTeacherTab === 'students' && (
                <div className="space-y-4 text-xs text-left">
                  {/* Assigned Students Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-amber-600" />
                        <span>Assigned Student Roster</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Authoritative student-teacher links established via course enrollments
                      </p>
                    </div>

                    {/* Filter active vs all */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-amber-200/60 shrink-0">
                      <button
                        onClick={() => setStudentRosterFilter('active')}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition-colors ${
                          studentRosterFilter === 'active'
                            ? 'bg-amber-600 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Active ({teacherEnrollments.filter((e) => e.status === 'active' || !e.status).length})
                      </button>
                      <button
                        onClick={() => setStudentRosterFilter('all')}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition-colors ${
                          studentRosterFilter === 'all'
                            ? 'bg-amber-600 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        All ({teacherEnrollments.length})
                      </button>
                    </div>
                  </div>

                  {enrollmentsLoading ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 text-amber-600 animate-spin" />
                      <span className="text-slate-500 font-medium text-xs">Loading assigned student roster...</span>
                    </div>
                  ) : (() => {
                    const displayed = studentRosterFilter === 'active'
                      ? teacherEnrollments.filter((e) => e.status === 'active' || !e.status)
                      : teacherEnrollments;

                    if (displayed.length === 0) {
                      return (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                          <GraduationCap className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="font-bold text-slate-700">No Assigned Students</p>
                          <p className="text-slate-500 text-[11px] max-w-sm mx-auto">
                            {studentRosterFilter === 'active'
                              ? 'This faculty mentor currently has no active student course assignments. When you enroll students in courses from the Student Management console, assign this mentor to populate their teaching roster.'
                              : 'No historical or active student enrollments on record for this faculty profile.'}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {displayed.map((enr) => {
                          const total = enr.classesTotal || enr.totalSessions || 12;
                          const completed = enr.classesCompleted || enr.sessionsCompleted || 0;
                          const progressPct = Math.min(100, Math.round((completed / total) * 100));

                          return (
                            <div
                              key={enr.id}
                              className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2.5"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
                                    {(enr.studentName || 'S').charAt(0)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-900 text-xs">{enr.studentName}</span>
                                      {enr.studentIdentifier && (
                                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                                          {enr.studentIdentifier}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] text-slate-500 font-mono">{enr.studentEmail}</span>
                                  </div>
                                </div>

                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    enr.status === 'active' || !enr.status
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : enr.status === 'completed'
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                      : enr.status === 'paused'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                                  }`}
                                >
                                  {enr.status || 'Active'}
                                </span>
                              </div>

                              {/* Course & Level Info */}
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div className="space-y-0.5">
                                  <span className="font-bold text-slate-800 text-xs">
                                    {enr.courseName || enr.courseTitle}
                                  </span>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                    <span>{enr.instrument || 'Classical'}</span>
                                    <span>•</span>
                                    <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                                      {enr.level || 'Foundation'}
                                    </span>
                                    {enr.packageName && (
                                      <>
                                        <span>•</span>
                                        <span className="text-slate-600">{enr.packageName}</span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  <Video className="w-2.5 h-2.5 text-amber-600" />
                                  <span>Room: {enr.roomId || 'saremi-room'}</span>
                                </span>
                              </div>

                              {/* Pacing & Progress */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[10px] text-slate-600">
                                  <span>Sessions: <strong>{completed} / {total} Completed</strong></span>
                                  <span>{Math.max(0, total - completed)} remaining</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                                  <div
                                    className="h-full bg-amber-500 rounded-full"
                                    style={{ width: `${progressPct}%` }}
                                  />
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                                  <span>Started: {enr.startDate ? new Date(enr.startDate).toLocaleDateString() : 'N/A'}</span>
                                  <span>Teaching Roster Synced</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {activeTeacherTab === 'availability' && (
                <div className="space-y-4">
                  <TeacherAvailabilityManager
                    teacherId={selectedTeacher.id}
                    teacherName={selectedTeacher.name}
                    actor={{
                      id: currentAdmin?.uid || 'admin',
                      name: currentAdmin?.displayName || currentAdmin?.email || 'Academy Administrator',
                      role: 'admin'
                    }}
                    isAdminMode={true}
                  />
                </div>
              )}

              {activeTeacherTab === 'access' && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <h4 className="font-bold text-slate-900">Account Access Management</h4>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Deactivating a faculty account prevents login to the Faculty Studio and Agora classrooms while maintaining all historical class logs, student feedback, and audit history intact.
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <div>
                        <div className="font-bold text-slate-900">
                          Current Status: {selectedTeacher.active !== false ? 'Active Faculty' : 'Deactivated'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {selectedTeacher.active !== false ? 'Teacher has full studio access' : 'Teacher access is suspended'}
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          const updated = { ...selectedTeacher, active: selectedTeacher.active === false ? true : false };
                          await saveTeacher(updated);
                          setSelectedTeacher(updated);
                          await recordAuditLog(
                            {
                              id: currentAdmin?.uid || 'admin',
                              name: currentAdmin?.displayName || 'Admin',
                              role: role || 'admin'
                            },
                            updated.active ? 'Reactivated Faculty Account' : 'Deactivated Faculty Account',
                            'teacher',
                            selectedTeacher.id,
                            `Changed status of Guru ${selectedTeacher.name} to ${updated.active ? 'Active' : 'Inactive'}`
                          );
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                          selectedTeacher.active === false
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        {selectedTeacher.active === false ? 'Reactivate Account' : 'Deactivate Account'}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 space-y-2">
                    <h4 className="font-bold text-amber-900">Credential Reset</h4>
                    <p className="text-amber-800 text-[11px]">
                      Generate a new temporary password for this faculty member. They will be mandated to set a personal password upon their next login.
                    </p>
                    <button
                      onClick={() => handleResetTeacherPassword(selectedTeacher)}
                      disabled={isResetting}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Issue Temporary Password</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Automated & Controlled Faculty Assignment Control Center */}
      <TeacherAssignmentControlModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        teachers={teachers}
        enrollments={allEnrollments}
        currentUser={currentAdmin ? {
          id: currentAdmin.uid,
          email: currentAdmin.email || undefined,
          name: currentAdmin.displayName || undefined,
          role: 'admin'
        } as any : null}
      />
    </div>
  );
};
