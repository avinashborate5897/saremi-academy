import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  Filter,
  Plus,
  User,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Edit2,
  Trash2,
  ChevronRight,
  Shield,
  ShieldCheck,
  FileText,
  CreditCard,
  Key,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  AlertTriangle,
  Video,
  Sparkles,
  History,
  UserCheck,
  Compass,
  ChevronDown,
  CalendarDays,
  CheckCircle,
  ExternalLink,
  Layers,
  Activity
} from 'lucide-react';
import {
  subscribeToStudents,
  subscribeToTeachers,
  saveStudent,
  createStudentWithAccount,
  resetStudentPasswordService,
  recordAuditLog,
  exportToCSV
} from '../../lib/adminFirestoreService';
import {
  ACADEMIC_COURSES,
  OFFICIAL_PACKAGES,
  isTeacherDisciplineMatch,
  filterActiveTeachers,
  enrollStudentInCourse,
  reassignEnrollmentTeacher,
  updateEnrollmentStatus,
  subscribeToStudentEnrollments,
  subscribeToAllAcademyEnrollments
} from '../../lib/academicEnrollmentService';
import { UserProfile, TeacherProfile, Role, EnrollmentRecord, CourseLevel } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { AdminStudentAcademicTab } from './AdminStudentAcademicTab';
import { TeacherAssignmentControlModal } from './TeacherAssignmentControlModal';
import { getFriendlyAuthErrorMessage } from '../../lib/authErrorUtils';

function generateRandomStudentPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let pass = 'Saremi@';
  for (let i = 0; i < 6; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export const AdminStudentsView: React.FC = () => {
  const { user: currentAdmin, role } = useAuth();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState<string>('all');
  
  // 360° Drawer State
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'courses' | 'academic' | 'notes' | 'status'>('profile');
  const [newNoteInput, setNewNoteInput] = useState('');

  // Edit Student Modal State
  const [editingStudent, setEditingStudent] = useState<UserProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    status: 'active' as 'active' | 'inactive',
    courseTitle: '',
    level: 'Foundation',
    assignedTeacherName: '',
    notes: ''
  });

  // Create Student Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    initialCourse: 'Hindustani Classical Vocal',
    level: 'Foundation',
    assignedTeacherId: '',
    assignedTeacherName: 'Senior Conservatory Faculty',
    temporaryPassword: generateRandomStudentPassword(),
    requirePasswordChange: true,
    notes: ''
  });
  const [showTempPassword, setShowTempPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Success Credentials Modal (Created or Reset Password)
  const [credentialsModal, setCredentialsModal] = useState<{
    isOpen: boolean;
    title: string;
    studentName: string;
    email: string;
    studentId: string;
    temporaryPassword: string;
    copied: boolean;
  }>({
    isOpen: false,
    title: '',
    studentName: '',
    email: '',
    studentId: '',
    temporaryPassword: '',
    copied: false
  });

  // Reset Password Loading State
  const [isResetting, setIsResetting] = useState(false);

  // Academic Enrollments in 360 Drawer
  const [studentEnrollments, setStudentEnrollments] = useState<EnrollmentRecord[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);

  // Enroll Student in Course Modal State
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollForm, setEnrollForm] = useState<{
    courseId: string;
    level: CourseLevel;
    packageId: string;
    teacherId: string;
    startDate: string;
    notes: string;
  }>({
    courseId: 'singing',
    level: 'Foundation',
    packageId: 'pkg-std-1-1-4s-3m',
    teacherId: '',
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  // Reassign Teacher Modal State
  const [reassignTarget, setReassignTarget] = useState<EnrollmentRecord | null>(null);
  const [reassignTeacherId, setReassignTeacherId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);
  const [reassignError, setReassignError] = useState<string | null>(null);

  // Status Change Modal State
  const [statusTarget, setStatusTarget] = useState<EnrollmentRecord | null>(null);
  const [newStatus, setNewStatus] = useState<'active' | 'pending' | 'completed' | 'paused' | 'cancelled'>('active');
  const [statusReason, setStatusReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Global Academy Enrollments for Assignment Engine
  const [allEnrollments, setAllEnrollments] = useState<EnrollmentRecord[]>([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentTargetEnrollmentId, setAssignmentTargetEnrollmentId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const unsubStudents = subscribeToStudents(setStudents);
    const unsubTeachers = subscribeToTeachers(setTeachers);
    const unsubAllEnrollments = subscribeToAllAcademyEnrollments(setAllEnrollments);
    return () => {
      unsubStudents();
      unsubTeachers();
      unsubAllEnrollments();
    };
  }, []);

  // Real-time authoritative enrollments subscription for selected student
  useEffect(() => {
    if (!selectedStudent?.id) {
      setStudentEnrollments([]);
      return;
    }
    setEnrollmentsLoading(true);
    const unsub = subscribeToStudentEnrollments(
      selectedStudent.id,
      selectedStudent.email,
      (records) => {
        setStudentEnrollments(records);
        setEnrollmentsLoading(false);
      }
    );
    return () => unsub();
  }, [selectedStudent?.id, selectedStudent?.email]);

  const activeTeachers = filterActiveTeachers(teachers);

  const handleOpenEnrollModal = () => {
    if (!selectedStudent) return;
    const initialCourse = ACADEMIC_COURSES[0];
    const matchingTeacher = activeTeachers.find((t) => isTeacherDisciplineMatch(t, initialCourse)) || activeTeachers[0];

    setEnrollForm({
      courseId: initialCourse.id,
      level: 'Foundation',
      packageId: OFFICIAL_PACKAGES[0]?.id || 'pkg-std-1-1-4s-3m',
      teacherId: matchingTeacher?.id || '',
      startDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setEnrollError(null);
    setShowEnrollModal(true);
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setIsEnrolling(true);
    setEnrollError(null);
    try {
      await enrollStudentInCourse(
        {
          student: selectedStudent,
          courseId: enrollForm.courseId,
          level: enrollForm.level,
          packageId: enrollForm.packageId,
          teacherId: enrollForm.teacherId,
          startDate: enrollForm.startDate,
          notes: enrollForm.notes,
          adminUser: {
            id: currentAdmin?.uid,
            email: currentAdmin?.email || undefined,
            name: currentAdmin?.displayName || undefined
          }
        },
        activeTeachers
      );
      setShowEnrollModal(false);
    } catch (err: any) {
      console.error('Enrollment error:', err);
      setEnrollError(err.message || 'Failed to complete enrollment. Please check the details.');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleOpenReassignModal = (enr: EnrollmentRecord) => {
    setReassignTarget(enr);
    const defaultTeacher = activeTeachers.find((t) => t.id !== enr.teacherId) || activeTeachers[0];
    setReassignTeacherId(defaultTeacher?.id || '');
    setReassignReason('');
    setReassignError(null);
  };

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignTarget || !reassignTeacherId) return;
    setIsReassigning(true);
    setReassignError(null);
    try {
      await reassignEnrollmentTeacher(
        reassignTarget.id,
        reassignTeacherId,
        reassignReason,
        activeTeachers,
        {
          id: currentAdmin?.uid,
          email: currentAdmin?.email || undefined,
          name: currentAdmin?.displayName || undefined
        }
      );
      setReassignTarget(null);
    } catch (err: any) {
      console.error('Reassignment error:', err);
      setReassignError(err.message || 'Failed to reassign mentor.');
    } finally {
      setIsReassigning(false);
    }
  };

  const handleOpenStatusModal = (enr: EnrollmentRecord) => {
    setStatusTarget(enr);
    setNewStatus(enr.status as any);
    setStatusReason('');
    setStatusError(null);
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTarget) return;
    setIsUpdatingStatus(true);
    setStatusError(null);
    try {
      await updateEnrollmentStatus(
        statusTarget.id,
        newStatus,
        statusReason,
        {
          id: currentAdmin?.uid,
          email: currentAdmin?.email || undefined,
          name: currentAdmin?.displayName || undefined
        }
      );
      setStatusTarget(null);
    } catch (err: any) {
      console.error('Status update error:', err);
      setStatusError(err.message || 'Failed to update enrollment status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Filter students based on search term and filter option
  const filteredStudents = students.filter((std) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (std.name || '').toLowerCase().includes(term) ||
      (std.email || '').toLowerCase().includes(term) ||
      (std.studentId || '').toLowerCase().includes(term) ||
      (std.phone || '').toLowerCase().includes(term) ||
      (std.enrolledCourses?.some((c) => c.courseTitle.toLowerCase().includes(term)) ?? false) ||
      (std.preferredInstrument || '').toLowerCase().includes(term);

    const isEnrolled = std.enrolledCourses && std.enrolledCourses.length > 0;
    const isInactive = std.status === 'inactive' || std.role === 'visitor';

    let matchesFilter = true;
    if (filterOption === 'active') {
      matchesFilter = !isInactive;
    } else if (filterOption === 'inactive') {
      matchesFilter = isInactive;
    } else if (filterOption === 'enrolled') {
      matchesFilter = Boolean(isEnrolled && !isInactive);
    } else if (filterOption === 'leads') {
      matchesFilter = Boolean(!isEnrolled && !isInactive);
    }

    return matchesSearch && matchesFilter;
  });

  const handleExport = () => {
    const rows = filteredStudents.map((s) => ({
      StudentID: s.studentId || s.id,
      Name: s.name,
      Email: s.email,
      Phone: s.phone || 'N/A',
      Status: s.status === 'inactive' || s.role === 'visitor' ? 'Inactive' : 'Active',
      EnrolledCourses: s.enrolledCourses?.map((c) => c.courseTitle).join('; ') || 'None',
      AssignedTeacher: s.enrolledCourses?.[0]?.teacherName || 'Not Assigned',
      CreatedAt: s.createdAt
    }));
    exportToCSV('saremi_students_roster', rows);
  };

  // Open Create Student Modal
  const handleOpenCreateModal = () => {
    setCreateForm({
      name: '',
      email: '',
      phone: '',
      initialCourse: 'Hindustani Classical Vocal',
      level: 'Foundation',
      assignedTeacherId: teachers[0]?.id || '',
      assignedTeacherName: teachers[0]?.name || 'Senior Conservatory Faculty',
      temporaryPassword: generateRandomStudentPassword(),
      requirePasswordChange: true,
      notes: ''
    });
    setCreateError(null);
    setShowCreateModal(true);
  };

  // Submit Real Student Account Creation
  const handleCreateStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!currentAdmin) {
      setCreateError('You must be logged in as an administrator to create student accounts.');
      return;
    }

    try {
      setIsSubmitting(true);
      const idToken = await currentAdmin.getIdToken(true);

      const result = await createStudentWithAccount(idToken, {
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim(),
        initialCourse: createForm.initialCourse,
        level: createForm.level,
        assignedTeacherId: createForm.assignedTeacherId,
        assignedTeacherName: createForm.assignedTeacherName,
        temporaryPassword: createForm.temporaryPassword.trim(),
        requirePasswordChange: createForm.requirePasswordChange,
        notes: createForm.notes.trim()
      });

      setShowCreateModal(false);

      // Open Credentials Success Modal
      setCredentialsModal({
        isOpen: true,
        title: 'Student Account Successfully Created',
        studentName: result.student.name,
        email: result.student.email,
        studentId: result.student.studentId || result.student.id,
        temporaryPassword: result.student.temporaryPassword,
        copied: false
      });
    } catch (err: any) {
      console.error('[Create Student Error]', err);
      setCreateError(getFriendlyAuthErrorMessage(err) || err.message || 'Failed to create student account. Please verify details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger Reset Password for Student
  const handleResetStudentPassword = async (student: UserProfile) => {
    if (!currentAdmin) return;
    if (!confirm(`Generate a new temporary password for student ${student.name}? They will be required to change it upon next login.`)) {
      return;
    }

    try {
      setIsResetting(true);
      const idToken = await currentAdmin.getIdToken(true);
      const newPass = generateRandomStudentPassword();

      const result = await resetStudentPasswordService(idToken, student.id, newPass);

      setCredentialsModal({
        isOpen: true,
        title: 'Student Password Reset Successfully',
        studentName: student.name,
        email: student.email,
        studentId: student.studentId || student.id,
        temporaryPassword: result.temporaryPassword,
        copied: false
      });
    } catch (err: any) {
      console.error('[Reset Student Password Error]', err);
      alert(err.message || 'Failed to reset student password.');
    } finally {
      setIsResetting(false);
    }
  };

  // Toggle Activate / Deactivate Account Status
  const handleToggleAccountStatus = async (student: UserProfile) => {
    const isCurrentlyInactive = student.status === 'inactive' || student.role === 'visitor';
    const newStatus: 'active' | 'inactive' = isCurrentlyInactive ? 'active' : 'inactive';
    const newRole: Role = newStatus === 'active' ? 'student' : 'visitor';

    await saveStudent({
      id: student.id,
      status: newStatus,
      role: newRole
    });

    await recordAuditLog(
      {
        id: currentAdmin?.uid || 'admin',
        name: currentAdmin?.displayName || 'Admin',
        role: role || 'admin'
      },
      newStatus === 'active' ? 'Reactivated Student Account' : 'Deactivated Student Account',
      'student',
      student.id,
      `Changed account status of ${student.name} (${student.email}) to ${newStatus}`
    );

    if (selectedStudent?.id === student.id) {
      setSelectedStudent({ ...selectedStudent, status: newStatus, role: newRole });
    }
  };

  // Open Edit Student Modal
  const handleOpenEditModal = (student: UserProfile) => {
    const primaryCourse = student.enrolledCourses?.[0];
    setEditingStudent(student);
    setEditForm({
      name: student.name || '',
      phone: student.phone || '',
      status: student.status === 'inactive' || student.role === 'visitor' ? 'inactive' : 'active',
      courseTitle: primaryCourse?.courseTitle || 'Hindustani Classical Vocal',
      level: primaryCourse?.level || 'Foundation',
      assignedTeacherName: primaryCourse?.teacherName || '',
      notes: student.notes || ''
    });
    setShowEditModal(true);
  };

  // Save Edit Student Form
  const handleSaveEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const newStatus = editForm.status;
    const newRole: Role = newStatus === 'active' ? 'student' : 'visitor';

    // Update enrolled courses array if one exists
    let updatedCourses = editingStudent.enrolledCourses ? [...editingStudent.enrolledCourses] : [];
    if (updatedCourses.length > 0) {
      updatedCourses[0] = {
        ...updatedCourses[0],
        courseTitle: editForm.courseTitle,
        level: editForm.level as any,
        teacherName: editForm.assignedTeacherName || updatedCourses[0].teacherName
      };
    }

    const updatedProfile: Partial<UserProfile> & { id: string } = {
      id: editingStudent.id,
      name: editForm.name.trim(),
      phone: editForm.phone.trim(),
      whatsapp: editForm.phone.trim(),
      status: newStatus,
      role: newRole,
      notes: editForm.notes.trim(),
      enrolledCourses: updatedCourses
    };

    await saveStudent(updatedProfile);

    await recordAuditLog(
      {
        id: currentAdmin?.uid || 'admin',
        name: currentAdmin?.displayName || 'Admin',
        role: role || 'admin'
      },
      'Updated Student Details',
      'student',
      editingStudent.id,
      `Updated profile and academic details for student ${editForm.name.trim()}`
    );

    if (selectedStudent?.id === editingStudent.id) {
      setSelectedStudent({ ...selectedStudent, ...updatedProfile });
    }

    setShowEditModal(false);
    setEditingStudent(null);
  };

  // Add Internal Staff Note in 360° Drawer
  const handleAddStaffNote = async () => {
    if (!selectedStudent || !newNoteInput.trim()) return;
    const timestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const author = currentAdmin?.displayName || 'Admin';
    const noteEntry = `[${timestamp} by ${author}]: ${newNoteInput.trim()}`;
    const updatedNotes = selectedStudent.notes ? `${selectedStudent.notes}\n${noteEntry}` : noteEntry;

    await saveStudent({
      id: selectedStudent.id,
      notes: updatedNotes
    });

    setSelectedStudent({
      ...selectedStudent,
      notes: updatedNotes
    });
    setNewNoteInput('');
  };

  // Copy credentials helper
  const handleCopyCredentials = () => {
    const text = `Saremi Academy Student Login Credentials:
Name: ${credentialsModal.studentName}
Email: ${credentialsModal.email}
Student ID: ${credentialsModal.studentId}
Temporary Password: ${credentialsModal.temporaryPassword}
Student Portal URL: ${window.location.origin}/app
(Note: You will be required to choose your permanent private password upon first login)`;

    navigator.clipboard.writeText(text);
    setCredentialsModal((prev) => ({ ...prev, copied: true }));
    setTimeout(() => {
      setCredentialsModal((prev) => ({ ...prev, copied: false }));
    }, 2500);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative min-w-[200px] sm:min-w-[300px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, student ID, phone, course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Filter */}
          <select
            value={filterOption}
            onChange={(e) => setFilterOption(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Profiles ({students.length})</option>
            <option value="active">Active Students</option>
            <option value="inactive">Inactive / Deactivated</option>
            <option value="enrolled">Enrolled in Courses</option>
            <option value="leads">Registered Leads</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Faculty Assignment Engine Launcher */}
          <button
            onClick={() => {
              setAssignmentTargetEnrollmentId(undefined);
              setShowAssignmentModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer relative"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>Faculty Assignment</span>
            {allEnrollments.filter((e) => !e.teacherId || e.assignmentStatus === 'REASSIGNMENT_REQUIRED' || e.assignmentStatus === 'UNASSIGNED').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            )}
          </button>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Roster</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Student Account</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Student & ID</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Active Course & Level</th>
                <th className="py-3.5 px-4">Sessions</th>
                <th className="py-3.5 px-4">Assigned Guru</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No student records match the active filter or search term.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std) => {
                  const course = std.enrolledCourses?.[0];
                  const isInactive = std.status === 'inactive' || std.role === 'visitor';

                  return (
                    <tr
                      key={std.id}
                      onClick={() => setSelectedStudent(std)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      {/* Name & Student ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-200">
                            {std.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{std.name || 'Unnamed Student'}</div>
                            <span className="inline-block mt-0.5 text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              {std.studentId || 'SM-STU-REG'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium truncate max-w-[180px]">{std.email}</div>
                        {std.phone ? (
                          <div className="text-[11px] text-slate-400 font-mono">{std.phone}</div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">No phone</div>
                        )}
                      </td>

                      {/* Active Course */}
                      <td className="py-3.5 px-4">
                        {course ? (
                          <div>
                            <div className="font-bold text-slate-800 truncate max-w-[180px]">{course.courseTitle}</div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                              {course.level || 'Foundation'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No enrolled course</span>
                        )}
                      </td>

                      {/* Sessions */}
                      <td className="py-3.5 px-4">
                        {course ? (
                          <div>
                            <span className="font-bold text-slate-900">
                              {course.sessionsCompleted || 0} / {course.totalSessions || 16}
                            </span>
                            <div className="w-20 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                              <div
                                className="bg-amber-500 h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, ((course.sessionsCompleted || 0) / (course.totalSessions || 16)) * 100)}%`
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Assigned Guru */}
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {course?.teacherName || 'Unassigned'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                            isInactive
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isInactive ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                          <span>{isInactive ? 'Inactive' : 'Active'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedStudent(std)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-[11px] font-bold text-slate-700 cursor-pointer"
                          >
                            View 360°
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(std)}
                            className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-[11px] font-bold text-slate-700 cursor-pointer"
                            title="Edit student profile"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleResetStudentPassword(std)}
                            disabled={isResetting}
                            className="px-2 py-1 rounded-lg border border-amber-200 hover:bg-amber-50 text-[11px] font-bold text-amber-800 cursor-pointer"
                            title="Reset password and force first-login change"
                          >
                            <Key className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleToggleAccountStatus(std)}
                            className={`px-2 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors ${
                              isInactive
                                ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                : 'border-rose-200 text-rose-700 hover:bg-rose-50'
                            }`}
                            title={isInactive ? 'Reactivate Student' : 'Deactivate Student'}
                          >
                            {isInactive ? 'Activate' : 'Deactivate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 360° Student Details Drawer */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden text-left">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-200 text-amber-950 flex items-center justify-center font-bold text-base border border-amber-300">
                  {selectedStudent.name?.charAt(0) || 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg font-bold text-slate-900 leading-tight">
                      {selectedStudent.name}
                    </h3>
                    <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      {selectedStudent.studentId || 'SM-STU-REG'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{selectedStudent.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-slate-200 px-5 gap-4 text-xs font-bold text-slate-500">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-3 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'profile' ? 'border-amber-500 text-slate-900 font-bold' : 'border-transparent'
                }`}
              >
                Profile Info
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'courses' ? 'border-amber-500 text-slate-900 font-bold' : 'border-transparent'
                }`}
              >
                <span>Academic Enrollments</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono">
                  {studentEnrollments.filter((e) => e.status === 'active').length || selectedStudent.enrolledCourses?.length || 0}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('academic')}
                className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'academic' ? 'border-amber-500 text-slate-900 font-bold' : 'border-transparent'
                }`}
              >
                <span>Academic 360</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`py-3 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'notes' ? 'border-amber-500 text-slate-900 font-bold' : 'border-transparent'
                }`}
              >
                Staff Notes
              </button>
              <button
                onClick={() => setActiveTab('status')}
                className={`py-3 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'status' ? 'border-amber-500 text-slate-900 font-bold' : 'border-transparent'
                }`}
              >
                Security & Status
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {activeTab === 'profile' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Student ID</span>
                      <span className="font-mono font-bold text-slate-900">{selectedStudent.studentId || selectedStudent.id}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        selectedStudent.status === 'inactive' || selectedStudent.role === 'visitor'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {selectedStudent.status === 'inactive' || selectedStudent.role === 'visitor' ? 'Account Inactive' : 'Active Student'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Email</span>
                    <span className="font-bold text-slate-800">{selectedStudent.email}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone Number / WhatsApp</span>
                    <span className="font-bold text-slate-800">{selectedStudent.phone || 'Not provided'}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Account Created</span>
                    <span className="font-bold text-slate-800">
                      {selectedStudent.createdAt ? new Date(selectedStudent.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Preferred Instrument</span>
                    <span className="font-bold text-slate-800 capitalize">
                      {selectedStudent.preferredInstrument || selectedStudent.enrolledCourses?.[0]?.instrument || 'Vocals'}
                    </span>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => handleOpenEditModal(selectedStudent)}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 cursor-pointer text-xs"
                    >
                      Edit Student Details
                    </button>
                    <button
                      onClick={() => handleResetStudentPassword(selectedStudent)}
                      className="px-4 py-2 border border-amber-300 text-amber-800 bg-amber-50 rounded-xl font-bold hover:bg-amber-100 cursor-pointer text-xs"
                    >
                      Reset Temporary Password
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'courses' && (
                <div className="space-y-4 text-xs">
                  {/* Top Action Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-2xl">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <h4 className="font-bold text-slate-900 text-sm">Academic Course Enrollments</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Authoritative student-course relationships, mentor assignments, and syllabus tracking
                      </p>
                    </div>
                    <button
                      onClick={handleOpenEnrollModal}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Enroll in Course</span>
                    </button>
                  </div>

                  {enrollmentsLoading ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 text-amber-600 animate-spin" />
                      <span className="text-slate-500 font-medium text-xs">Loading academic enrollments...</span>
                    </div>
                  ) : (
                    <>
                      {/* Active Enrollments */}
                      {(() => {
                        const activeList = studentEnrollments.filter((e) => e.status === 'active' || !e.status);
                        const legacyUnmigrated = (selectedStudent.enrolledCourses || []).filter(
                          (c) => !studentEnrollments.some((e) => e.courseId === c.courseId || e.courseName === c.courseTitle)
                        );
                        const hasActive = activeList.length > 0 || legacyUnmigrated.length > 0;

                        if (!hasActive) {
                          return (
                            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                              <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                              <p className="font-bold text-slate-700">No Active Enrollments</p>
                              <p className="text-slate-500 text-[11px] max-w-sm mx-auto">
                                This student does not currently have any active course enrollments or assigned faculty gurus.
                              </p>
                              <button
                                onClick={handleOpenEnrollModal}
                                className="mt-2 px-3.5 py-1.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Enroll Student Now</span>
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-3.5">
                            {/* Render Authoritative Enrollments */}
                            {activeList.map((enr) => {
                              const totalSessions = enr.classesTotal || enr.totalSessions || 12;
                              const completedSessions = enr.classesCompleted || enr.sessionsCompleted || 0;
                              const remaining = enr.remainingSessions ?? Math.max(0, totalSessions - completedSessions);
                              const progressPct = Math.min(100, Math.round((completedSessions / totalSessions) * 100));

                              return (
                                <div
                                  key={enr.id}
                                  className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3 text-left"
                                >
                                  {/* Enrollment Title & Status Badge */}
                                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                                        <BookOpen className="w-4 h-4 text-amber-700" />
                                      </div>
                                      <div>
                                        <h5 className="font-bold text-slate-900 text-sm">
                                          {enr.courseName || enr.courseTitle}
                                        </h5>
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                          <span className="font-semibold text-slate-700">{enr.instrument || 'Classical Music'}</span>
                                          <span>•</span>
                                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                                            {enr.level || 'Foundation'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                                        {enr.status || 'Active'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Assigned Mentor Box */}
                                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                      <div>
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                                          Assigned Faculty Mentor
                                        </span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span className="font-bold text-slate-900 text-xs">
                                            {enr.teacherName || 'Faculty Guru Assigned'}
                                          </span>
                                          {enr.teacherIdentifier && (
                                            <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded border border-amber-200">
                                              {enr.teacherIdentifier}
                                            </span>
                                          )}
                                        </div>
                                        {enr.teacherSpecialization && (
                                          <span className="text-[10px] text-slate-500 block">
                                            Discipline: {enr.teacherSpecialization}
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                          onClick={() => handleOpenReassignModal(enr)}
                                          className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] cursor-pointer transition-colors"
                                        >
                                          Reassign Guru
                                        </button>
                                        <button
                                          onClick={() => handleOpenStatusModal(enr)}
                                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] cursor-pointer transition-colors"
                                        >
                                          Status
                                        </button>
                                      </div>
                                    </div>

                                    {/* Reassignment Audit History if exists */}
                                    {enr.teacherHistory && enr.teacherHistory.length > 0 && (
                                      <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 space-y-1">
                                        <div className="font-bold text-slate-600 flex items-center gap-1">
                                          <History className="w-3 h-3 text-slate-400" />
                                          <span>Faculty Reassignment History ({enr.teacherHistory.length})</span>
                                        </div>
                                        {enr.teacherHistory.slice(-2).map((hist, hIdx) => (
                                          <div key={hIdx} className="pl-3 border-l-2 border-amber-300 py-0.5 text-slate-600">
                                            <span>Previous: <strong>{hist.teacherName}</strong></span>
                                            <span className="text-slate-400"> ({new Date(hist.assignedAt).toLocaleDateString()})</span>
                                            {hist.reason && <span className="italic block text-slate-500">Reason: {hist.reason}</span>}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Pacing & Progress Bar */}
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-[11px] text-slate-600">
                                      <span>
                                        Sessions Completed: <strong>{completedSessions} / {totalSessions}</strong>
                                      </span>
                                      <span className="text-slate-500 font-medium">
                                        {remaining} sessions remaining
                                      </span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                                      <div
                                        className="h-full bg-amber-500 rounded-full transition-all duration-300"
                                        style={{ width: `${progressPct}%` }}
                                      />
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] text-slate-500">
                                      <span>
                                        Started: <strong>{enr.startDate ? new Date(enr.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</strong>
                                      </span>
                                      <span className="inline-flex items-center gap-1 font-mono font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                        <Video className="w-2.5 h-2.5 text-amber-600" />
                                        <span>Studio Room ({enr.roomId || 'saremi-room'})</span>
                                      </span>
                                    </div>
                                  </div>

                                  {/* Prepared Academic Readiness Structure */}
                                  <div className="pt-2 border-t border-slate-100">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-2">
                                      Academic Progression & Tracking Overview
                                    </span>
                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                                        <span className="text-slate-400 block font-semibold">Upcoming Sessions</span>
                                        <span className="font-bold text-slate-700">Scheduled by Faculty</span>
                                      </div>
                                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                                        <span className="text-slate-400 block font-semibold">Attendance Track</span>
                                        <span className="font-bold text-emerald-700">{completedSessions} Attended • 0 Missed</span>
                                      </div>
                                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                                        <span className="text-slate-400 block font-semibold">Syllabus Progress</span>
                                        <span className="font-bold text-slate-700">{enr.level || 'Foundation'} Track</span>
                                      </div>
                                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                                        <span className="text-slate-400 block font-semibold">Homework & Feedback</span>
                                        <span className="font-bold text-slate-700">Portal Active</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Render Legacy unmigrated user courses if present */}
                            {legacyUnmigrated.map((c, i) => (
                              <div key={i} className="p-4 rounded-2xl border border-dashed border-amber-300 bg-amber-50/40 space-y-2 text-left">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-900 text-sm">{c.courseTitle}</span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                                    {c.level || 'Foundation'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600">
                                  <span>Assigned Mentor: <strong>{c.teacherName || 'Conservatory Guru'}</strong></span>
                                  <button
                                    onClick={handleOpenEnrollModal}
                                    className="text-xs font-bold text-amber-700 hover:text-amber-900 cursor-pointer"
                                  >
                                    Migrate to Canonical Enrollment
                                  </button>
                                </div>
                                <div className="text-slate-600">
                                  Sessions Completed: <strong>{c.sessionsCompleted || 0} / {c.totalSessions || 16}</strong>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      {/* Historical / Concluded Enrollments if any */}
                      {(() => {
                        const historyList = studentEnrollments.filter((e) => e.status && e.status !== 'active');
                        if (historyList.length === 0) return null;

                        return (
                          <div className="pt-3 border-t border-slate-200 space-y-2 text-left">
                            <h5 className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                              <History className="w-3.5 h-3.5 text-slate-400" />
                              <span>Historical & Concluded Enrollments ({historyList.length})</span>
                            </h5>
                            <div className="space-y-2">
                              {historyList.map((hist) => (
                                <div
                                  key={hist.id}
                                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-800">{hist.courseName || hist.courseTitle}</span>
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase bg-slate-200 text-slate-700">
                                        {hist.status}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-slate-500 block">
                                      Mentor: {hist.teacherName} • Completed {hist.classesCompleted || hist.sessionsCompleted || 0} sessions
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleOpenStatusModal(hist)}
                                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold self-start sm:self-auto cursor-pointer"
                                  >
                                    Reactivate / Edit
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              )}

              {activeTab === 'academic' && (
                <AdminStudentAcademicTab
                  student={selectedStudent}
                  enrollments={studentEnrollments}
                  adminUser={currentAdmin as any}
                />
              )}

              {activeTab === 'notes' && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <h4 className="font-bold text-slate-900">Staff & Pedagogical Notes</h4>
                    {selectedStudent.notes ? (
                      <div className="p-3 bg-white rounded-lg border border-slate-200 whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-[11px]">
                        {selectedStudent.notes}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic text-[11px]">No notes logged yet for this student.</p>
                    )}

                    <div className="pt-2 space-y-2">
                      <textarea
                        rows={3}
                        value={newNoteInput}
                        onChange={(e) => setNewNoteInput(e.target.value)}
                        placeholder="Add internal observation, trial assessment notes, or learning milestones..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-amber-500/20"
                      />
                      <button
                        onClick={handleAddStaffNote}
                        disabled={!newNoteInput.trim()}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 cursor-pointer text-xs"
                      >
                        Append Note
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'status' && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <h4 className="font-bold text-slate-900">Account Access Management</h4>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Deactivating a student prevents them from logging into the student portal and joining live classes. All historical records, completed sessions, certificates, and payment invoices remain safely preserved in the database.
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <div>
                        <div className="font-bold text-slate-900">
                          Current Status: {selectedStudent.status === 'inactive' || selectedStudent.role === 'visitor' ? 'Inactive' : 'Active'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {selectedStudent.status === 'inactive' || selectedStudent.role === 'visitor'
                            ? 'Student is locked out of portal access'
                            : 'Student has authorized portal access'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleAccountStatus(selectedStudent)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                          selectedStudent.status === 'inactive' || selectedStudent.role === 'visitor'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        {selectedStudent.status === 'inactive' || selectedStudent.role === 'visitor'
                          ? 'Reactivate Account'
                          : 'Deactivate Account'}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 space-y-2">
                    <h4 className="font-bold text-amber-900">Credential Reset</h4>
                    <p className="text-amber-800 text-[11px]">
                      Generate a new temporary password for this student. The system will mandate a password update on their next login attempt.
                    </p>
                    <button
                      onClick={() => handleResetStudentPassword(selectedStudent)}
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

      {/* CREATE STUDENT ACCOUNT MODAL */}
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
                    Create New Student Account
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Provisions authenticated student access, Student ID, and initial enrollment
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

            <form onSubmit={handleCreateStudentSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Radhika Sharma"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Student Login Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. radhika@gmail.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Phone / WhatsApp Number</label>
                <input
                  type="text"
                  placeholder="+91 98200 12345"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                />
              </div>

              {/* Temporary Password Box */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-amber-900 font-bold">
                    Initial Temporary Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, temporaryPassword: generateRandomStudentPassword() })}
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
                  <span>Force student to change password on first login (Recommended)</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Initial Course Enrollment</label>
                  <select
                    value={createForm.initialCourse}
                    onChange={(e) => setCreateForm({ ...createForm, initialCourse: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none"
                  >
                    <option value="Hindustani Classical Vocal">🎤 Hindustani Classical Vocal</option>
                    <option value="Kids Vocal Foundation">🎤 Kids Vocal Foundation</option>
                    <option value="Acoustic Guitar Mastery">🎸 Acoustic Guitar Mastery</option>
                    <option value="Western Keyboard & Piano">🎹 Western Keyboard & Piano</option>
                    <option value="Tabla Rhythm & Bols">🪘 Tabla Rhythm & Bols</option>
                    <option value="Classical Violin Mastery">🎻 Classical Violin Mastery</option>
                    <option value="Indian Classical Bamboo Flute">🪈 Indian Classical Bamboo Flute</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Level</label>
                  <select
                    value={createForm.level}
                    onChange={(e) => setCreateForm({ ...createForm, level: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none"
                  >
                    <option value="Foundation">Foundation (Beginner)</option>
                    <option value="Developing">Developing (Intermediate)</option>
                    <option value="Proficient">Proficient</option>
                    <option value="Advanced">Advanced (Maestro Grade)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Assigned Faculty Mentor</label>
                <select
                  value={createForm.assignedTeacherId}
                  onChange={(e) => {
                    const selectedGuru = teachers.find((t) => t.id === e.target.value);
                    setCreateForm({
                      ...createForm,
                      assignedTeacherId: e.target.value,
                      assignedTeacherName: selectedGuru ? selectedGuru.name : 'Senior Conservatory Faculty'
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none"
                >
                  <option value="">-- Select Faculty Guru --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.specialization}) {t.teacherId ? `[${t.teacherId}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Pedagogical Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Completed vocal audition, wants to specialize in Raga Yaman..."
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Create & Enroll Student</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STUDENT MODAL */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl text-left border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900">
                  Edit Student Profile
                </h3>
                <p className="text-[11px] text-slate-500">
                  ID: {editingStudent.studentId || editingStudent.id} • {editingStudent.email}
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditStudent} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Account Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium"
                  >
                    <option value="active">Active (Access Granted)</option>
                    <option value="inactive">Inactive (Portal Access Blocked)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Course</label>
                  <input
                    type="text"
                    value={editForm.courseTitle}
                    onChange={(e) => setEditForm({ ...editForm, courseTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Level</label>
                  <select
                    value={editForm.level}
                    onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900"
                  >
                    <option value="Foundation">Foundation</option>
                    <option value="Developing">Developing</option>
                    <option value="Proficient">Proficient</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Assigned Guru</label>
                <select
                  value={editForm.assignedTeacherName}
                  onChange={(e) => setEditForm({ ...editForm, assignedTeacherName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900"
                >
                  <option value="">-- Select Guru --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs"
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
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDENTIALS SUCCESS POPUP MODAL */}
      {credentialsModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl text-left border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 mb-1">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold text-slate-900">
                {credentialsModal.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Share these official credentials with the student. A mandatory password update is enforced upon their initial sign in.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-600 border-b border-slate-200/60 pb-1.5">
                <span className="font-sans text-[11px] text-slate-400">Student Name:</span>
                <span className="font-bold text-slate-900 font-sans">{credentialsModal.studentName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 border-b border-slate-200/60 pb-1.5">
                <span className="font-sans text-[11px] text-slate-400">Student ID:</span>
                <span className="font-bold text-amber-900">{credentialsModal.studentId}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 border-b border-slate-200/60 pb-1.5">
                <span className="font-sans text-[11px] text-slate-400">Login Email:</span>
                <span className="font-bold text-slate-900">{credentialsModal.email}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 border-b border-slate-200/60 pb-1.5">
                <span className="font-sans text-[11px] text-slate-400">Temporary Password:</span>
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {credentialsModal.temporaryPassword}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 pt-0.5">
                <span className="font-sans text-[11px] text-slate-400">Portal URL:</span>
                <span className="text-[11px] text-indigo-600 font-semibold">{window.location.origin}/app</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <Key className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>First-login security:</strong> The student must submit their personal private password before accessing courses or scheduling sessions.
              </span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={handleCopyCredentials}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                {credentialsModal.copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Full Onboarding Info</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setCredentialsModal((prev) => ({ ...prev, isOpen: false }))}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ENROLL STUDENT IN COURSE MODAL */}
      {showEnrollModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl text-left border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-900">
                    Enroll Student in Course
                  </h3>
                  <p className="text-xs text-slate-500">
                    Assign a course curriculum, package, and dedicated mentor
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEnrollModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Student Context Bar */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Student</span>
                <span className="font-bold text-slate-900">{selectedStudent.name}</span>
                <span className="text-slate-500 ml-1">({selectedStudent.studentId || selectedStudent.id})</span>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">{selectedStudent.email}</span>
            </div>

            {enrollError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{enrollError}</span>
              </div>
            )}

            <form onSubmit={handleEnrollSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Academic Course *</label>
                <select
                  value={enrollForm.courseId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    const selCourse = ACADEMIC_COURSES.find((c) => c.id === cId) || ACADEMIC_COURSES[0];
                    const matchedGuru = activeTeachers.find((t) => isTeacherDisciplineMatch(t, selCourse)) || activeTeachers[0];
                    setEnrollForm({
                      ...enrollForm,
                      courseId: cId,
                      teacherId: matchedGuru ? matchedGuru.id : enrollForm.teacherId
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-amber-500/20"
                >
                  {ACADEMIC_COURSES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.title} ({c.instrument})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Learning Stage / Level *</label>
                  <select
                    value={enrollForm.level}
                    onChange={(e) => setEnrollForm({ ...enrollForm, level: e.target.value as CourseLevel })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="Foundation">Foundation (Initial)</option>
                    <option value="Developing">Developing (Intermediate)</option>
                    <option value="Proficient">Proficient (Advanced)</option>
                    <option value="Advanced">Advanced / Riaz Masterclass</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={enrollForm.startDate}
                    onChange={(e) => setEnrollForm({ ...enrollForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Applicable Plan / Package *</label>
                <select
                  value={enrollForm.packageId}
                  onChange={(e) => setEnrollForm({ ...enrollForm, packageId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500/20"
                >
                  {OFFICIAL_PACKAGES.map((pkg) => {
                    const label = pkg.name || (pkg.learningMode === 'one_to_one' ? '1:1 Standard' : pkg.learningMode === 'premium_one_to_one' ? '1:1 Master' : 'Group Cohort');
                    const sessionCount = pkg.sessions || (pkg.sessionsPerMonth * pkg.durationMonths);
                    const formattedPrice = typeof pkg.price === 'string' ? pkg.price : `₹${pkg.totalPrice.toLocaleString('en-IN')}`;
                    return (
                      <option key={pkg.id} value={pkg.id}>
                        {label} — {sessionCount} Sessions • {pkg.durationMonths} Mo ({formattedPrice})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Assign Dedicated Faculty Guru *
                </label>
                <select
                  required
                  value={enrollForm.teacherId}
                  onChange={(e) => setEnrollForm({ ...enrollForm, teacherId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="">-- Choose Active Faculty Guru --</option>
                  {activeTeachers.map((t) => {
                    const selCourse = ACADEMIC_COURSES.find((c) => c.id === enrollForm.courseId);
                    const isMatch = selCourse ? isTeacherDisciplineMatch(t, selCourse) : false;
                    return (
                      <option key={t.id} value={t.id}>
                        {isMatch ? '★ RECOMMENDED: ' : ''}{t.name} ({t.teacherId || 'SM-TEA'}) — {t.specialization}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Only active faculty accounts are eligible. Teachers matching the course discipline are starred.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Internal Pedagogical Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Trial observations, vocal range, or specific learning goals..."
                  value={enrollForm.notes}
                  onChange={(e) => setEnrollForm({ ...enrollForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEnrolling || !enrollForm.teacherId}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isEnrolling ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Confirming Enrollment...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Confirm Enrollment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REASSIGN TEACHER MODAL */}
      {reassignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl text-left border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-900 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-900">
                    Reassign Faculty Guru
                  </h3>
                  <p className="text-xs text-slate-500">
                    Change assigned mentor while preserving audit history
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReassignTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Current Context */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Course:</span>
                <span className="font-bold text-slate-900">{reassignTarget.courseName || reassignTarget.courseTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Mentor:</span>
                <span className="font-bold text-slate-800">{reassignTarget.teacherName || 'Assigned Guru'}</span>
              </div>
            </div>

            {reassignError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{reassignError}</span>
              </div>
            )}

            <form onSubmit={handleReassignSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select New Faculty Guru *</label>
                <select
                  required
                  value={reassignTeacherId}
                  onChange={(e) => setReassignTeacherId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">-- Select Active Guru --</option>
                  {activeTeachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.teacherId || 'SM-TEA'}) — {t.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason for Reassignment *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule adjustment, student request, advanced specialization"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReassignTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReassigning || !reassignTeacherId || !reassignReason.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isReassigning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Reassigning...</span>
                    </>
                  ) : (
                    <span>Save Reassignment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE ENROLLMENT STATUS MODAL */}
      {statusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl text-left border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <Activity className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-900">
                    Update Enrollment Status
                  </h3>
                  <p className="text-xs text-slate-500">
                    Set academic enrollment state
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStatusTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Course</span>
              <span className="font-bold text-slate-900">{statusTarget.courseName || statusTarget.courseTitle}</span>
            </div>

            {statusError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{statusError}</span>
              </div>
            )}

            <form onSubmit={handleStatusSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Enrollment State *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-900"
                >
                  <option value="active">Active (Ongoing learning)</option>
                  <option value="paused">Paused (Student requested temporary leave)</option>
                  <option value="completed">Completed (Package/course syllabus concluded)</option>
                  <option value="cancelled">Cancelled (Terminated)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Status Note / Reason</label>
                <input
                  type="text"
                  placeholder="Optional context for status change..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStatusTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isUpdatingStatus ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Update Status</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Automated & Controlled Faculty Assignment Control Center */}
      <TeacherAssignmentControlModal
        isOpen={showAssignmentModal}
        onClose={() => {
          setShowAssignmentModal(false);
          setAssignmentTargetEnrollmentId(undefined);
        }}
        teachers={teachers}
        enrollments={allEnrollments}
        currentUser={currentAdmin ? {
          id: currentAdmin.uid,
          email: currentAdmin.email || undefined,
          name: currentAdmin.displayName || undefined,
          role: 'admin'
        } as any : null}
        targetEnrollmentId={assignmentTargetEnrollmentId}
      />
    </div>
  );
};
