import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  serverTimestamp,
  updateDoc,
  doc,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

export interface ClassSession {
  id: string;
  studentId: string;
  teacherId: string;
  topic: string;
  date: string;
  time: string;
  link?: string;
  status: 'Upcoming' | 'Completed' | 'scheduled' | 'live' | 'cancelled' | 'rescheduled';
  teacherName: string;
  studentName: string;
  discipline?: string;
  courseTitle?: string;
  courseId?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  roomId?: string;
  meetingUrl?: string;
  isTrial?: boolean;
  trialId?: string;
  studentEmail?: string;
  teacherFeedback?: string;
  lessonNotes?: string;
}

export interface Assignment {
  id: string;
  studentId: string;
  teacherId: string;
  title: string;
  description: string;
  feedback?: string;
  grade?: string;
  status: 'Pending' | 'Reviewed' | 'pending' | 'submitted' | 'reviewed';
  submittedAt?: string;
  audioUrl?: string;
  studentName: string;
  teacherName?: string;
  courseTitle?: string;
  dueDate?: string;
  studentNotes?: string;
  teacherFeedbackNotes?: string;
  createdAt?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  text: string;
  createdAt: any;
}

export const dashboardService = {
  // === STUDENT APIs ===
  async getStudentClasses(studentId: string, studentEmail?: string): Promise<ClassSession[]> {
    try {
      const q1 = query(collection(db, 'classes'), where('studentId', '==', studentId));
      const q2 = query(collection(db, 'live_classes'), where('studentId', '==', studentId));
      const qTrials1 = query(collection(db, 'trial_bookings'), where('studentId', '==', studentId));
      const qTrials2 = query(collection(db, 'trial_bookings'), where('userId', '==', studentId));

      const queries = [
        getDocs(q1).catch(() => ({ docs: [] })),
        getDocs(q2).catch(() => ({ docs: [] })),
        getDocs(qTrials1).catch(() => ({ docs: [] })),
        getDocs(qTrials2).catch(() => ({ docs: [] }))
      ];

      if (studentEmail) {
        const qEmailClasses = query(collection(db, 'classes'), where('studentEmail', '==', studentEmail));
        const qEmailTrials = query(collection(db, 'trial_bookings'), where('email', '==', studentEmail));
        queries.push(getDocs(qEmailClasses).catch(() => ({ docs: [] })));
        queries.push(getDocs(qEmailTrials).catch(() => ({ docs: [] })));
      }

      const results = await Promise.all(queries);
      const snap1 = results[0];
      const snap2 = results[1];
      const snapT1 = results[2];
      const snapT2 = results[3];
      const snapEmailClasses = results[4] || { docs: [] };
      const snapEmailTrials = results[5] || { docs: [] };

      const map = new Map<string, ClassSession>();
      snap1.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as ClassSession));
      snap2.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as ClassSession));
      snapEmailClasses.docs.forEach(d => {
        if (!map.has(d.id)) {
          map.set(d.id, { id: d.id, ...d.data() } as ClassSession);
        }
      });

      // Connect trial bookings directly into student's scheduled sessions
      const trialDocs = [...snapT1.docs, ...snapT2.docs, ...snapEmailTrials.docs];
      trialDocs.forEach(d => {
        const trial = d.data() as any;
        const classId = `cls_trial_${d.id}`;
        if (!map.has(classId)) {
          const dateStr = trial.date || 'To be scheduled';
          const timeStr = trial.time || '18:00';
          const trialChannel = trial.agoraChannelName || `saremi_trial_${d.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
          map.set(classId, {
            id: classId,
            studentId,
            studentName: trial.studentName || 'Student',
            teacherId: trial.teacherId || 'tch_faculty',
            teacherName: trial.teacherName || 'Assigned Guru',
            courseId: trial.courseId || 'course_vocal_hindustani',
            courseTitle: trial.courseName || 'Diagnostic Classical Trial',
            scheduledAt: dateStr.includes('T') ? dateStr : (dateStr !== 'Flexible' && dateStr !== 'To be scheduled' ? `${dateStr}T18:00:00` : new Date().toISOString()),
            durationMinutes: 30,
            status: trial.status === 'completed' ? 'completed' : 'scheduled',
            roomId: trialChannel,
            meetingUrl: trialChannel,
            agoraChannelName: trialChannel,
            topic: `1:1 Diagnostic Trial Class: ${trial.courseName || 'Classical Music'}`,
            date: dateStr,
            time: timeStr.includes('IST') ? timeStr : `${timeStr} IST`,
            link: trialChannel,
            isTrial: true,
            trialId: d.id,
            studentEmail: trial.email,
            teacherFeedback: trial.recommendation || trial.feedback
          } as ClassSession);
        }
      });

      // Sort classes chronologically: upcoming first, then past
      const list = Array.from(map.values());
      return list.sort((a, b) => {
        const timeA = new Date(a.scheduledAt || a.date || 0).getTime();
        const timeB = new Date(b.scheduledAt || b.date || 0).getTime();
        return timeA - timeB;
      });
    } catch (e) {
      console.error("Error fetching student classes:", e);
      return [];
    }
  },

  async getStudentAttendance(studentId: string, studentEmail?: string): Promise<any[]> {
    try {
      const qAtt1 = query(collection(db, 'attendance'), where('studentId', '==', studentId));
      const queries: Promise<any>[] = [getDocs(qAtt1).catch(() => ({ docs: [] }))];

      if (studentEmail) {
        const qAttEmail = query(collection(db, 'attendance'), where('studentEmail', '==', studentEmail));
        queries.push(getDocs(qAttEmail).catch(() => ({ docs: [] })));
      }

      const results = await Promise.all(queries);
      const map = new Map<string, any>();

      results.forEach(snap => {
        snap.docs.forEach((d: any) => {
          map.set(d.id, { id: d.id, ...d.data() });
        });
      });

      // Also harvest attendance from marked classes
      const studentClasses = await this.getStudentClasses(studentId, studentEmail);
      studentClasses.forEach(cls => {
        if (cls.attendanceMarked || cls.status === 'completed' || cls.status === 'rescheduled' || (cls as any).attendanceStatus) {
          const attId = `att_cls_${cls.id}`;
          if (!map.has(attId)) {
            let status = 'Present';
            if (cls.status === 'rescheduled' || cls.attendanceStatus === 'Excused') {
              status = 'Rescheduled';
            } else if (cls.status === 'missed' || cls.attendanceStatus === 'Absent') {
              status = 'Absent';
            } else if (cls.status === 'completed' || cls.attendanceStatus === 'Present') {
              status = 'Present';
            }

            map.set(attId, {
              id: attId,
              classId: cls.id,
              studentId,
              date: cls.date || (cls.scheduledAt ? new Date(cls.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'),
              time: cls.time || '6:00 PM IST',
              topic: cls.topic || cls.courseTitle || 'Classical Music Session',
              teacherName: cls.teacherName || 'Assigned Faculty',
              teacherFeedback: cls.teacherFeedback || cls.lessonNotes || 'Class conducted.',
              status,
              sessionNumber: cls.sessionNumber || 1
            });
          }
        }
      });

      return Array.from(map.values()).sort((a, b) => {
        const timeA = new Date(a.date || a.scheduledAt || 0).getTime();
        const timeB = new Date(b.date || b.scheduledAt || 0).getTime();
        return timeB - timeA;
      });
    } catch (e) {
      console.error("Error fetching student attendance:", e);
      return [];
    }
  },

  async getStudentSubmissions(studentId: string): Promise<any[]> {
    try {
      const q = query(collection(db, 'submissions'), where('studentId', '==', studentId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => {
        const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.date || 0).getTime();
        const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.date || 0).getTime();
        return tB - tA;
      });
    } catch (e) {
      console.error("Error fetching submissions:", e);
      return [];
    }
  },

  async addStudentSubmission(submissionData: any): Promise<string> {
    const docRef = await addDoc(collection(db, 'submissions'), {
      ...submissionData,
      status: submissionData.status || 'submitted',
      createdAt: serverTimestamp()
    });
    return docRef.id;
  },

  async getStudentTrials(studentId: string): Promise<any[]> {
    try {
      const q1 = query(collection(db, 'trial_bookings'), where('studentId', '==', studentId));
      const q2 = query(collection(db, 'trial_bookings'), where('userId', '==', studentId));
      const [snap1, snap2] = await Promise.all([
        getDocs(q1).catch(() => ({ docs: [] })),
        getDocs(q2).catch(() => ({ docs: [] }))
      ]);
      const map = new Map<string, any>();
      snap1.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() }));
      snap2.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() }));
      return Array.from(map.values());
    } catch (e) {
      console.error("Error fetching student trials:", e);
      return [];
    }
  },

  async getStudentAssignments(studentId: string): Promise<Assignment[]> {
    const q = query(collection(db, 'assignments'), where('studentId', '==', studentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Assignment));
  },

  // === TEACHER APIs ===
  async getTeacherClasses(teacherId: string): Promise<ClassSession[]> {
    try {
      const q1 = query(collection(db, 'classes'), where('teacherId', '==', teacherId));
      const q2 = query(collection(db, 'live_classes'), where('teacherId', '==', teacherId));
      const qTrials = query(collection(db, 'trial_bookings'), where('teacherId', '==', teacherId));

      const [snap1, snap2, snapTrials] = await Promise.all([
        getDocs(q1).catch(() => ({ docs: [] })),
        getDocs(q2).catch(() => ({ docs: [] })),
        getDocs(qTrials).catch(() => ({ docs: [] }))
      ]);

      const map = new Map<string, ClassSession>();
      snap1.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as ClassSession));
      snap2.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as ClassSession));

      // Connect assigned trial bookings into teacher schedule
      snapTrials.docs.forEach(d => {
        const trial = d.data() as any;
        const classId = `cls_trial_${d.id}`;
        if (!map.has(classId)) {
          const dateStr = trial.date || 'To be scheduled';
          const timeStr = trial.time || '18:00';
          const trialChannel = trial.agoraChannelName || `saremi_trial_${d.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
          map.set(classId, {
            id: classId,
            studentId: trial.studentId || trial.userId || `std_trial_${d.id}`,
            studentName: trial.studentName || 'Trial Student',
            teacherId,
            teacherName: trial.teacherName || 'Faculty',
            courseId: trial.courseId || 'course_vocal_hindustani',
            courseTitle: trial.courseName || 'Diagnostic Classical Trial',
            scheduledAt: dateStr.includes('T') ? dateStr : (dateStr !== 'Flexible' && dateStr !== 'To be scheduled' ? `${dateStr}T18:00:00` : new Date().toISOString()),
            durationMinutes: 30,
            status: trial.status === 'completed' ? 'completed' : 'scheduled',
            roomId: trialChannel,
            meetingUrl: trialChannel,
            agoraChannelName: trialChannel,
            topic: `1:1 Diagnostic Trial Class: ${trial.courseName || 'Classical Music'}`,
            date: dateStr,
            time: timeStr.includes('IST') ? timeStr : `${timeStr} IST`,
            link: trialChannel,
            isTrial: true,
            trialId: d.id,
            studentEmail: trial.email,
            teacherFeedback: trial.recommendation || trial.feedback
          } as ClassSession);
        }
      });

      // Return classes assigned specifically to this teacher
      return Array.from(map.values());
    } catch (e) {
      console.error("Error fetching teacher classes:", e);
      return [];
    }
  },

  async getTeacherAssignments(teacherId: string): Promise<Assignment[]> {
    const q = query(collection(db, 'assignments'), where('teacherId', '==', teacherId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Assignment));
  },

  async getTeacherEnrollments(teacherId: string, teacherCode?: string): Promise<any[]> {
    try {
      const q = query(collection(db, 'enrollments'), where('teacherId', '==', teacherId));
      const snapshot = await getDocs(q);
      const records = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      if (teacherCode && teacherCode !== teacherId) {
        try {
          const q2 = query(collection(db, 'enrollments'), where('teacherIdentifier', '==', teacherCode));
          const snap2 = await getDocs(q2);
          const existingIds = new Set(records.map(r => r.id));
          for (const docItem of snap2.docs) {
            if (!existingIds.has(docItem.id)) {
              records.push({ id: docItem.id, ...docItem.data() });
            }
          }
        } catch {
          // non-blocking
        }
      }

      return records;
    } catch (e) {
      console.error("Error fetching teacher enrollments:", e);
      return [];
    }
  },

  subscribeToTeacherEnrollments(
    teacherId: string,
    teacherCode: string | undefined,
    callback: (enrollments: any[]) => void
  ): () => void {
    if (!teacherId) {
      callback([]);
      return () => {};
    }
    try {
      const q = query(collection(db, 'enrollments'), where('teacherId', '==', teacherId));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const records = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          callback(records);
        },
        (error) => {
          console.warn('Error in teacher enrollments subscription:', error);
        }
      );
      return unsubscribe;
    } catch (err) {
      console.warn('Could not establish teacher enrollments subscription:', err);
      return () => {};
    }
  },

  async createTeacherAssignment(assignment: Omit<Assignment, 'id'> & { id?: string }): Promise<string> {
    const data = {
      ...assignment,
      status: assignment.status || 'Pending',
      createdAt: new Date().toISOString()
    };
    const ref = await addDoc(collection(db, 'assignments'), data);
    return ref.id;
  },

  async updateTeacherAssignment(assignmentId: string, updates: Partial<Assignment>): Promise<void> {
    await updateDoc(doc(db, 'assignments', assignmentId), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  // === MESSAGING APIs (Strict Sender/Receiver Isolation) ===
  async getMessages(userId1: string, userId2: string): Promise<Message[]> {
    try {
      // Query messages where userId1 is sender, and where userId1 is receiver
      const qSent = query(
        collection(db, 'messages'),
        where('senderId', '==', userId1)
      );
      const qReceived = query(
        collection(db, 'messages'),
        where('receiverId', '==', userId1)
      );

      const [sentSnap, receivedSnap] = await Promise.all([
        getDocs(qSent).catch(() => ({ docs: [] })),
        getDocs(qReceived).catch(() => ({ docs: [] }))
      ]);

      const allDocs = [...sentSnap.docs, ...receivedSnap.docs];
      const seen = new Set<string>();
      const messages: Message[] = [];

      for (const d of allDocs) {
        if (!seen.has(d.id)) {
          seen.add(d.id);
          const data = d.data() as any;
          if (
            (data.senderId === userId1 && data.receiverId === userId2) ||
            (data.senderId === userId2 && data.receiverId === userId1)
          ) {
            messages.push({ id: d.id, ...data });
          }
        }
      }

      messages.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return timeA - timeB;
      });

      return messages;
    } catch (err) {
      console.warn('Notice querying messages:', err);
      return [];
    }
  },

  async sendMessage(senderId: string, senderName: string, receiverId: string, text: string) {
    await addDoc(collection(db, 'messages'), {
      senderId,
      senderName,
      receiverId,
      text,
      createdAt: serverTimestamp()
    });
  },

  // SEED SAMPLE DATA (if empty)
  async seedDataIfNeeded(studentId: string, teacherId: string) {
    const classes = await this.getStudentClasses(studentId);
    if (classes.length === 0) {
      await addDoc(collection(db, 'classes'), {
        studentId,
        teacherId,
        studentName: 'Learner',
        teacherName: 'Vidushi Sunanda Sharma',
        discipline: 'Hindustani Classical Vocal',
        topic: 'Yaman Bandish & Komal Rishabh Placement',
        date: 'Oct 18, 2026',
        time: '6:30 PM EST',
        roomId: 'room_riya_mus',
        status: 'Upcoming'
      });
      await addDoc(collection(db, 'assignments'), {
        studentId,
        teacherId,
        studentName: 'Learner',
        title: 'Bhairav Mandra Saptak Sustained Hold',
        description: 'Practice recordings',
        feedback: 'Remarkable clarity on the lower Kharja Shadja.',
        grade: 'A',
        status: 'Reviewed',
        submittedAt: new Date().toISOString()
      });
      await this.sendMessage(teacherId, 'Vidushi Sunanda Sharma', studentId, 'Pranam! Excellent breath stability on Bhairav sargam today.');
      await addDoc(collection(db, 'notifications'), {
        userId: studentId,
        title: 'New Grade Available',
        message: 'Your assignment "Bhairav Mandra Saptak" was graded A.',
        type: 'feedback',
        isRead: false,
        createdAt: serverTimestamp()
      });
      await addDoc(collection(db, 'notifications'), {
        userId: studentId,
        title: 'Class Reminder',
        message: 'Your 1:1 session starts in 1 hour.',
        type: 'class_reminder',
        isRead: false,
        createdAt: serverTimestamp()
      });
    }
  },

  async getAchievements(studentId: string): Promise<any[]> {
    const q = query(collection(db, 'achievements'), where('studentId', '==', studentId), orderBy('earnedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getCurriculum(courseId: string): Promise<any[]> {
    const q = query(collection(db, 'modules'), where('courseId', '==', courseId), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async updateStreak(studentId: string): Promise<void> {
    if (!studentId) return;
    try {
      const userRef = doc(db, 'users', studentId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const lastPractice = userData.lastPracticeDate;
        const today = new Date().toISOString().split('T')[0];

        if (lastPractice === today) {
          // Already practiced today; no duplicate increment
          return;
        }

        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const currentStreak = Number(userData.practiceStreak || userData.streak || 0);
        const newStreak = lastPractice === yesterday ? currentStreak + 1 : 1;

        await updateDoc(userRef, {
          practiceStreak: newStreak,
          streak: newStreak,
          lastPracticeDate: today,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn('Practice streak update note:', err);
    }
  }
}
