import fs from 'fs';
import path from 'path';

function getFirebaseConfig(): { apiKey: string; projectId: string; firestoreDatabaseId: string } {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

export const ADMIN_EMAIL = 'avinashborate5897@gmail.com';
export const TEST_ADMIN_EMAIL = 'test.admin@test.saremi.academy';
export const TEST_TEACHER_EMAIL = 'test.guru@test.saremi.academy';
export const TEST_STUDENT_EMAIL = 'test.student@test.saremi.academy';

export const TEST_PASSWORD_ADMIN = 'AdminTest#2026';
export const TEST_PASSWORD_TEACHER = 'GuruTest#2026';
export const TEST_PASSWORD_STUDENT = 'StudentTest#2026';

const KNOWN_UIDS: Record<string, string> = {
  [TEST_ADMIN_EMAIL]: 'GVzhkrwXBFa1iTJxa59bRBIwS393',
  [TEST_TEACHER_EMAIL]: 'HrdRTDUxPVeNOMgmFzx257smYyz2',
  [TEST_STUDENT_EMAIL]: 'ReCzZnGrNORUP2N73RgAvhatyrD2'
};

/**
 * Converts a plain JavaScript object into Firestore REST API Value types.
 */
function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (typeof v === 'string') {
      fields[k] = { stringValue: v };
    } else if (typeof v === 'number') {
      if (Number.isInteger(v)) {
        fields[k] = { integerValue: v.toString() };
      } else {
        fields[k] = { doubleValue: v };
      }
    } else if (typeof v === 'boolean') {
      fields[k] = { booleanValue: v };
    } else if (Array.isArray(v)) {
      fields[k] = {
        arrayValue: {
          values: v.map((item) => {
            if (typeof item === 'string') return { stringValue: item };
            if (typeof item === 'number') return { integerValue: Math.floor(item).toString() };
            if (typeof item === 'boolean') return { booleanValue: item };
            return { mapValue: { fields: toFirestoreFields(item) } };
          })
        }
      };
    } else if (typeof v === 'object') {
      fields[k] = { mapValue: { fields: toFirestoreFields(v) } };
    }
  }
  return fields;
}

/**
 * Creates or verifies a test account in Firebase Auth using the Identity Toolkit REST API.
 */
async function ensureAuthUserRest(
  email: string,
  pass: string,
  displayName: string
): Promise<{ uid: string; idToken?: string }> {
  const firebaseConfig = getFirebaseConfig();
  const key = firebaseConfig.apiKey;

  // 1. Try signIn first
  const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${key}`;
  const signInRes = await fetch(signInUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass, returnSecureToken: true })
  });

  const signInData = await signInRes.json();
  if (signInRes.ok && signInData.localId) {
    return { uid: signInData.localId, idToken: signInData.idToken };
  }

  // 2. If user doesn't exist, try signUp
  const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${key}`;
  const signUpRes = await fetch(signUpUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass, displayName, returnSecureToken: true })
  });

  const signUpData = await signUpRes.json();
  if (signUpRes.ok && signUpData.localId) {
    return { uid: signUpData.localId, idToken: signUpData.idToken };
  }

  // 3. Fallback to registered project UIDs if credentials already exist
  if (KNOWN_UIDS[email]) {
    return { uid: KNOWN_UIDS[email] };
  }

  throw new Error(`Failed to initialize auth for ${email}: ${signUpData.error?.message || signInData.error?.message || 'Auth failure'}`);
}

/**
 * Provisions the entire sandbox environment on the server side using direct Google REST APIs.
 * Avoids any browser CORS, ad-blockers, or container Admin Auth IAM restrictions.
 */
export async function executeSandboxProvisioning(requesterEmail: string, callerAuthToken?: string) {
  const isSuperAdminEmail = 
    requesterEmail.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
    requesterEmail.trim().toLowerCase() === TEST_ADMIN_EMAIL.toLowerCase();

  if (!isSuperAdminEmail) {
    throw new Error('Unauthorized: Only the super administrator (avinashborate5897@gmail.com) can provision sandbox test environments.');
  }

  const firebaseConfig = getFirebaseConfig();
  const key = firebaseConfig.apiKey;
  const dbId = firebaseConfig.firestoreDatabaseId;
  const proj = firebaseConfig.projectId;

  // 1. Ensure all 3 test auth records exist
  const adminAuth = await ensureAuthUserRest(TEST_ADMIN_EMAIL, TEST_PASSWORD_ADMIN, 'Test Administrator');
  const teacherName = 'Pt. Test Guru (Sandbox)';
  const teacherAuth = await ensureAuthUserRest(TEST_TEACHER_EMAIL, TEST_PASSWORD_TEACHER, teacherName);
  const studentName = 'Aarav Test Student (Sandbox)';
  const studentAuth = await ensureAuthUserRest(TEST_STUDENT_EMAIL, TEST_PASSWORD_STUDENT, studentName);

  // 2. Get an authoritative ID token (from caller, test.admin, or sign in) to write to Firestore with admin rules
  let authToken = callerAuthToken || adminAuth.idToken;
  if (!authToken) {
    const signInRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_ADMIN_EMAIL, password: TEST_PASSWORD_ADMIN, returnSecureToken: true })
    });
    const signInData = await signInRes.json();
    authToken = signInData.idToken;
  }

  if (!authToken) {
    throw new Error('Unable to obtain administrative authorization token for Firestore provisioning.');
  }

  const now = new Date().toISOString();

  // Helper function to write document via Firestore REST API
  async function writeFirestoreDoc(collectionPath: string, docId: string, data: Record<string, any>) {
    const url = `https://firestore.googleapis.com/v1/projects/${proj}/databases/${dbId}/documents/${collectionPath}/${docId}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: toFirestoreFields(data)
      })
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      console.warn(`[Firestore REST Write Notice] ${collectionPath}/${docId}:`, errBody?.error?.message || errBody);
      throw new Error(`Failed to write document ${collectionPath}/${docId}: ${errBody.error?.message || res.statusText}`);
    }
  }

  // 3. Admin Profile
  await writeFirestoreDoc('users', adminAuth.uid, {
    id: adminAuth.uid,
    email: TEST_ADMIN_EMAIL,
    name: 'Test Administrator',
    role: 'admin',
    phone: '+91 98000 00001',
    bio: 'Dedicated Sandbox Test Administrator for Saremi Academy verification.',
    skillLevel: 'Advanced',
    timeZone: 'Asia/Kolkata',
    isTestAccount: true,
    environment: 'sandbox',
    createdAt: now,
    updatedAt: now
  });

  // 4. Teacher Profile & Faculty Directory Doc
  await writeFirestoreDoc('users', teacherAuth.uid, {
    id: teacherAuth.uid,
    email: TEST_TEACHER_EMAIL,
    name: teacherName,
    role: 'teacher',
    phone: '+91 98000 00002',
    bio: 'Sandbox Test Faculty for Hindustani Classical Vocal & Harmonium.',
    preferredInstrument: 'vocals',
    skillLevel: 'Master',
    timeZone: 'Asia/Kolkata',
    isTestAccount: true,
    environment: 'sandbox',
    createdAt: now,
    updatedAt: now
  });

  await writeFirestoreDoc('teachers', teacherAuth.uid, {
    id: teacherAuth.uid,
    name: teacherName,
    email: TEST_TEACHER_EMAIL,
    phone: '+91 98000 00002',
    bio: 'Senior faculty specializing in Khayal gayaki, voice culture, and riyaaz pedagogy (Sandbox Account).',
    disciplines: ['vocals', 'harmonium', 'voice-culture'],
    instruments: ['Vocals', 'Harmonium', 'Tanpura'],
    status: 'active',
    rating: 5.0,
    totalClassesTaught: 12,
    hourlyRate: 1200,
    currency: 'INR',
    experienceYears: 15,
    languages: ['Hindi', 'English', 'Marathi'],
    timeZone: 'Asia/Kolkata',
    availableSlots: [
      { dayOfWeek: 1, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 2, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 3, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 4, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 5, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 6, startTime: '10:00', endTime: '16:00' }
    ],
    isTestAccount: true,
    environment: 'sandbox',
    createdAt: now,
    updatedAt: now
  });

  // 5. Student Profile
  await writeFirestoreDoc('users', studentAuth.uid, {
    id: studentAuth.uid,
    email: TEST_STUDENT_EMAIL,
    name: studentName,
    role: 'student',
    phone: '+91 98000 00003',
    bio: 'Passionate beginner learner exploring Raag Yaman and voice culture.',
    preferredInstrument: 'vocals',
    skillLevel: 'Beginner',
    timeZone: 'Asia/Kolkata',
    purchasedCourses: ['hindustani-classical-vocal'],
    isTestAccount: true,
    environment: 'sandbox',
    createdAt: now,
    updatedAt: now
  });

  // 6. Active Academic Enrollment (written to enrollments and academic_enrollments)
  const enrollmentId = `test_enr_${studentAuth.uid.slice(0, 8)}`;
  const enrollmentDoc = {
    id: enrollmentId,
    studentId: studentAuth.uid,
    studentName,
    studentEmail: TEST_STUDENT_EMAIL,
    courseId: 'hindustani-classical-vocal',
    courseName: 'Hindustani Classical Vocal Masterclass',
    discipline: 'vocals',
    teacherId: teacherAuth.uid,
    teacherName,
    status: 'active',
    pricingTier: 'Standard 1:1',
    packageDuration: 'Monthly 4 Classes',
    creditsPurchased: 4,
    creditsRemaining: 4,
    classesCompleted: 0,
    enrolledAt: now,
    startDate: now,
    renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isTestAccount: true,
    environment: 'sandbox',
    createdAt: now,
    updatedAt: now
  };
  await writeFirestoreDoc('enrollments', enrollmentId, enrollmentDoc);
  await writeFirestoreDoc('academic_enrollments', enrollmentId, enrollmentDoc);

  // 7. Scheduled 1:1 Class Session
  const scheduledTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const classId = `test_class_${Date.now()}`;
  const classDoc = {
    id: classId,
    courseId: 'hindustani-classical-vocal',
    courseName: 'Hindustani Classical Vocal Masterclass',
    teacherId: teacherAuth.uid,
    teacherName,
    teacherEmail: TEST_TEACHER_EMAIL,
    studentId: studentAuth.uid,
    studentName,
    studentEmail: TEST_STUDENT_EMAIL,
    enrollmentId,
    title: 'Foundations of Raag Yaman: Swara Sadhana & Alankars',
    topic: 'Raag Yaman - Aroha, Avroha & Pakad Vocal Tuning',
    scheduledAt: scheduledTime.toISOString(),
    startTime: scheduledTime.toISOString(),
    endTime: new Date(scheduledTime.getTime() + 45 * 60 * 1000).toISOString(),
    durationMinutes: 45,
    status: 'scheduled',
    roomName: `saremi-test-room-${classId.slice(-6)}`,
    roomId: `saremi_class_${classId}`,
    agoraChannelName: `saremi_class_${classId}`,
    isLive: false,
    channelName: `saremi_class_${classId}`,
    meetingLink: `/live-classroom?sessionId=${classId}&channel=saremi_class_${classId}`,
    syllabusMilestone: 'Module 1: Voice Culture & Swara Sadhana',
    notes: 'Preliminary practice test session for sound check, Tanpura tuning, and introductory sargam.',
    isTestAccount: true,
    environment: 'sandbox',
    createdAt: now,
    updatedAt: now
  };
  await writeFirestoreDoc('classes', classId, classDoc);

  return {
    success: true,
    admin: { email: TEST_ADMIN_EMAIL, uid: adminAuth.uid },
    teacher: { email: TEST_TEACHER_EMAIL, uid: teacherAuth.uid, name: teacherName },
    student: { email: TEST_STUDENT_EMAIL, uid: studentAuth.uid, name: studentName },
    classSession: {
      id: classId,
      scheduledAt: scheduledTime.toISOString(),
      topic: classDoc.topic
    }
  };
}
