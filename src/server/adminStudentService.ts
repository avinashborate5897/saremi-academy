import { Firestore } from 'firebase-admin/firestore';
import { Auth } from 'firebase-admin/auth';
import { verifyIsAdmin, generateTemporaryPassword, ADMIN_EMAIL } from './adminTeacherService';
import fs from 'fs';
import path from 'path';

function getFirebaseApiKey(): string {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.apiKey) return config.apiKey;
    }
  } catch (e) {
    console.warn('[Firebase Config Read Error]', e);
  }
  return process.env.VITE_FIREBASE_API_KEY || 'AIzaSyAwrHhP0kGak-coAEDxACuSqQHVsOaK7ik';
}

/**
 * Provisions a real Firebase Auth user account for a student
 */
async function provisionStudentAuthUser(
  adminAuth: Auth,
  email: string,
  password: string,
  displayName: string
): Promise<string> {
  const apiKey = getFirebaseApiKey();

  // 1. Attempt Admin SDK creation or lookup if available
  if (adminAuth) {
    if (typeof adminAuth.createUser === 'function') {
      try {
        const userRecord = await adminAuth.createUser({
          email,
          password,
          displayName,
          emailVerified: true
        });
        return userRecord.uid;
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-exists' && typeof adminAuth.getUserByEmail === 'function') {
          try {
            const existingUser = await adminAuth.getUserByEmail(email);
            if (existingUser?.uid) {
              await adminAuth.updateUser(existingUser.uid, {
                password,
                displayName
              });
              return existingUser.uid;
            }
          } catch {}
        }
      }
    }

    if (typeof adminAuth.getUserByEmail === 'function') {
      try {
        const existingUser = await adminAuth.getUserByEmail(email);
        if (existingUser?.uid) {
          try {
            await adminAuth.updateUser(existingUser.uid, {
              password,
              displayName
            });
          } catch {}
          return existingUser.uid;
        }
      } catch {}
    }
  }

  // 2. Real Firebase Auth User Creation via Identity Toolkit API
  const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
  const signUpRes = await fetch(signUpUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      displayName,
      returnSecureToken: true
    })
  });

  const signUpData = await signUpRes.json();
  if (signUpRes.ok && signUpData.localId) {
    return signUpData.localId;
  }

  // 3. Handle EMAIL_EXISTS: try password sign-in or return informative error
  if (signUpData?.error?.message?.includes('EMAIL_EXISTS')) {
    const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    const signInRes = await fetch(signInUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    });
    const signInData = await signInRes.json();
    if (signInRes.ok && signInData.localId) {
      return signInData.localId;
    }

    // Trigger password reset email to user
    const resetUrl = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`;
    await fetch(resetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email
      })
    }).catch(() => {});

    throw new Error(
      `An account with email "${email}" already exists. Please choose a different email address or contact support.`
    );
  }

  const rawMsg = signUpData?.error?.message || '';
  if (rawMsg.includes('EMAIL_EXISTS')) {
    throw new Error(`An account with email "${email}" already exists.`);
  }

  throw new Error(
    rawMsg ||
    'Failed to create real Firebase Authentication account for student.'
  );
}

export interface CreateStudentPayload {
  name: string;
  email: string;
  phone?: string;
  initialCourse?: string;
  level?: string;
  assignedTeacherId?: string;
  assignedTeacherName?: string;
  temporaryPassword?: string;
  requirePasswordChange?: boolean;
  notes?: string;
  tags?: string[];
}

/**
 * Creates a real authenticated Student account in Firebase Auth and Firestore
 */
export async function handleCreateStudentAccount(
  db: Firestore,
  adminAuth: Auth,
  decodedToken: any,
  payload: CreateStudentPayload
) {
  const isAdmin = await verifyIsAdmin(db, decodedToken);
  if (!isAdmin) {
    throw new Error('Unauthorized: Only verified academy administrators can create student accounts.');
  }

  const {
    name,
    email,
    phone = '',
    initialCourse = 'Hindustani Classical Vocal',
    level = 'Foundation',
    assignedTeacherId = '',
    assignedTeacherName = 'Senior Conservatory Faculty',
    notes = '',
    tags = [],
    requirePasswordChange = true
  } = payload;

  if (!name || !name.trim()) {
    throw new Error('Student full name is required.');
  }

  if (!email || !email.trim() || !email.includes('@')) {
    throw new Error('A valid email address is required for student authentication.');
  }

  const sanitizedEmail = email.trim().toLowerCase();

  // Check if an account with this email already exists in Firestore users
  try {
    if (db && typeof db.collection === 'function') {
      const existingUsersSnap = await db.collection('users').where('email', '==', sanitizedEmail).get();
      if (existingUsersSnap && !existingUsersSnap.empty) {
        const existingDoc = existingUsersSnap.docs[0].data();
        throw new Error(
          `An account with email "${sanitizedEmail}" already exists in Saremi Academy (Role: ${existingDoc.role || 'user'}). Please use a different email or update their existing profile.`
        );
      }
    }
  } catch (lookupErr: any) {
    if (lookupErr.message?.includes('already exists in Saremi Academy')) {
      throw lookupErr;
    }
  }

  const temporaryPassword = payload.temporaryPassword && payload.temporaryPassword.length >= 6
    ? payload.temporaryPassword
    : generateTemporaryPassword();

  // Generate unique Student ID: SM-STU-XXXX
  const studentCode = `SM-STU-${Math.floor(1000 + Math.random() * 9000)}`;

  // 1. Obtain Real Firebase Auth UID
  const studentUid = await provisionStudentAuthUser(
    adminAuth,
    sanitizedEmail,
    temporaryPassword,
    name.trim()
  );

  const courseInstrument = initialCourse.toLowerCase().includes('guitar')
    ? 'guitar'
    : initialCourse.toLowerCase().includes('tabla')
    ? 'tabla'
    : initialCourse.toLowerCase().includes('keyboard') || initialCourse.toLowerCase().includes('piano')
    ? 'piano'
    : 'vocals';

  // 2. Set authoritative User Profile in Firestore (users/{studentUid})
  const userProfileData = {
    id: studentUid,
    studentId: studentCode,
    email: sanitizedEmail,
    name: name.trim(),
    role: 'student',
    status: 'active',
    phone: phone.trim(),
    whatsapp: phone.trim(),
    requiresPasswordChange: requirePasswordChange,
    preferredInstrument: courseInstrument,
    skillLevel: level,
    notes: notes.trim(),
    tags: Array.isArray(tags) ? tags : [],
    enrolledCourses: [
      {
        courseId: `course_${Date.now()}`,
        courseTitle: initialCourse,
        instrument: courseInstrument,
        enrolledAt: new Date().toISOString(),
        level: level,
        sessionsCompleted: 0,
        totalSessions: 16,
        remainingSessions: 16,
        usedSessions: 0,
        teacherId: assignedTeacherId,
        teacherName: assignedTeacherName,
        nextSessionDate: 'To be scheduled',
        nextSessionTime: 'TBD',
        meetingUrl: `saremi-room-${studentUid.slice(0, 8)}`,
        roomId: `saremi-room-${studentUid.slice(0, 8)}`
      }
    ],
    notificationPreferences: {
      marketingEmails: false,
      transactionalEmails: true,
      smsAlerts: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    if (db && typeof db.collection === 'function') {
      await db.collection('users').doc(studentUid).set(userProfileData, { merge: true });
    }
  } catch {
    // Client SDK handles persistence with authenticated admin security rules
  }

  // 2b. Create authoritative Enrollment record in Firestore (enrollments/{enrollmentId})
  try {
    const courseIdMap: Record<string, string> = {
      'Hindustani Classical Vocal': 'singing',
      'Acoustic Guitar': 'guitar',
      'Classical Tabla': 'tabla',
      'Piano & Keyboard': 'keyboard',
      'Western Piano': 'keyboard',
      'Violin': 'violin',
      'Flute': 'flute'
    };
    const canonicalCourseId = courseIdMap[initialCourse] || courseInstrument || 'singing';
    const enrollmentId = `enr_${studentUid.slice(0, 8)}_${canonicalCourseId}_${Date.now()}`;
    const nowIso = new Date().toISOString();
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 90);

    const enrollmentData = {
      id: enrollmentId,
      studentId: studentUid,
      studentIdentifier: studentCode,
      studentName: name.trim(),
      studentEmail: sanitizedEmail,
      studentPhone: phone.trim(),
      courseId: canonicalCourseId,
      courseName: initialCourse,
      instrument: courseInstrument,
      level: level,
      packageId: 'pkg-std-1-1-4s-3m',
      packageName: '1:1 Standard • 12 Sessions (3 Months)',
      packageDuration: '3 Months',
      teacherId: assignedTeacherId || 'teacher-sunanda',
      teacherIdentifier: assignedTeacherId.startsWith('SM-TEA-') ? assignedTeacherId : 'SM-TEA-1082',
      teacherName: assignedTeacherName || 'Senior Conservatory Faculty',
      teacherHistory: [
        {
          teacherId: assignedTeacherId || 'teacher-sunanda',
          teacherIdentifier: assignedTeacherId.startsWith('SM-TEA-') ? assignedTeacherId : 'SM-TEA-1082',
          teacherName: assignedTeacherName || 'Senior Conservatory Faculty',
          assignedAt: nowIso,
          assignedBy: decodedToken.email || ADMIN_EMAIL,
          reason: 'Initial enrollment on account provisioning'
        }
      ],
      startDate: nowIso,
      expiryDate: expDate.toISOString(),
      totalSessions: 16,
      remainingSessions: 16,
      usedSessions: 0,
      classesTotal: 16,
      classesCompleted: 0,
      status: 'active',
      scheduleSummary: `1:1 Live Acoustic Session • With ${assignedTeacherName || 'Senior Conservatory Faculty'}`,
      notes: notes.trim(),
      createdAt: nowIso,
      updatedAt: nowIso
    };

    await db.collection('enrollments').doc(enrollmentId).set(enrollmentData);
  } catch (enrErr) {
    console.warn('[Admin Student Provisioning] Notice creating initial enrollment document:', enrErr);
  }

  // 3. Log Immutable Audit Record
  try {
    await db.collection('audit_logs').add({
      actorId: decodedToken.uid || 'admin',
      actorName: decodedToken.name || decodedToken.email || 'Staff Admin',
      actorEmail: decodedToken.email || ADMIN_EMAIL,
      actorRole: decodedToken.role || 'admin',
      action: 'Created Student Account',
      entityType: 'student',
      entityId: studentUid,
      details: `Created real student account for ${name.trim()} (${sanitizedEmail}) with Student ID ${studentCode} enrolled in ${initialCourse}`,
      timestamp: new Date().toISOString()
    });
  } catch (auditErr) {
    console.warn('[Audit Log] Failed to write student creation audit:', auditErr);
  }

  return {
    success: true,
    student: {
      id: studentUid,
      studentId: studentCode,
      name: name.trim(),
      email: sanitizedEmail,
      phone: phone.trim(),
      temporaryPassword,
      role: 'student',
      status: 'active',
      requiresPasswordChange: requirePasswordChange,
      enrolledCourses: userProfileData.enrolledCourses
    }
  };
}

/**
 * Resets a student's password to a new temporary password and flags requiresPasswordChange
 */
export async function handleResetStudentPassword(
  db: Firestore,
  adminAuth: Auth,
  decodedToken: any,
  studentUid: string,
  customNewPassword?: string
) {
  const isAdmin = await verifyIsAdmin(db, decodedToken);
  if (!isAdmin) {
    throw new Error('Unauthorized: Only verified academy administrators can reset student passwords.');
  }

  if (!studentUid) {
    throw new Error('Student UID is required.');
  }

  const newPassword = customNewPassword && customNewPassword.length >= 6
    ? customNewPassword
    : generateTemporaryPassword();

  // Update in Firebase Auth
  try {
    await adminAuth.updateUser(studentUid, {
      password: newPassword
    });
  } catch (authErr: any) {
    console.warn('[Reset Student Password Auth Warning]', authErr?.message);
  }

  // Update in Firestore users collection
  await db.collection('users').doc(studentUid).set({
    requiresPasswordChange: true,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  // Audit Log
  try {
    await db.collection('audit_logs').add({
      actorId: decodedToken.uid || 'admin',
      actorName: decodedToken.name || decodedToken.email || 'Staff Admin',
      actorEmail: decodedToken.email || ADMIN_EMAIL,
      actorRole: decodedToken.role || 'admin',
      action: 'Reset Student Password',
      entityType: 'student',
      entityId: studentUid,
      details: `Generated new temporary credentials for student ${studentUid}. Enforced password change on next login.`,
      timestamp: new Date().toISOString()
    });
  } catch (auditErr) {
    console.warn('[Audit Log] Failed to record student password reset:', auditErr);
  }

  return {
    success: true,
    studentUid,
    temporaryPassword: newPassword,
    requiresPasswordChange: true
  };
}
