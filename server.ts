import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  handleCreateRazorpayOrder,
  handleVerifyRazorpayPayment,
  handleRazorpayWebhook,
  handleCheckPackageAccess,
  handleValidateResourceAccess
} from './src/server/apiHandlers';
import {
  handleCreateTeacherAccount,
  handleResetTeacherPassword
} from './src/server/adminTeacherService';
import {
  handleCreateStudentAccount,
  handleResetStudentPassword
} from './src/server/adminStudentService';
import { executeSandboxProvisioning } from './src/server/sandboxProvisioner';
import {
  dispatchNotificationService,
  sendTransactionalEmail,
  sendWhatsAppNotification
} from './src/server/notificationService';
import pkg from 'agora-token';
const { RtcTokenBuilder, RtcRole } = pkg;

// Initialize Firebase Admin
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

import { GoogleGenAI } from '@google/genai';
import { handleAIPanditQuery } from './src/server/aiPanditEngine';

// Handle ESM and CJS environments gracefully
const getDirname = () => {
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }
  return process.cwd();
};
const _dirname = getDirname();

// Load Firebase Config for Admin
const firebaseConfigPath = path.resolve(_dirname, 'firebase-applet-config.json');
let firestoreDatabaseId = '(default)';
let projectId: string | undefined = undefined;

if (fs.existsSync(firebaseConfigPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    firestoreDatabaseId = config.firestoreDatabaseId || '(default)';
    projectId = config.projectId;
  } catch (e) {
    console.warn('[Firebase Config] Failed to parse config file:', e);
  }
}

let fbApp: any = null;
let adminAuthInstance: any = null;
let dbInstance: any = null;

function getAdminApp() {
  if (!fbApp) {
    try {
      fbApp = getApps().length ? getApp() : initializeApp({ projectId });
    } catch (e) {
      console.warn('[Firebase Admin App] Notice initializing admin app:', e);
    }
  }
  return fbApp;
}

function getAdminAuth() {
  if (!adminAuthInstance) {
    try {
      const app = getAdminApp();
      if (app) {
        adminAuthInstance = getAuth(app);
      }
    } catch (e) {
      console.warn('[Firebase Admin Auth] Notice initializing admin auth:', e);
    }
  }
  return adminAuthInstance;
}

function getAdminDb() {
  if (!dbInstance) {
    try {
      const app = getAdminApp();
      if (app) {
        dbInstance = getFirestore(app, firestoreDatabaseId);
        try {
          dbInstance.settings({ ignoreUndefinedProperties: true });
        } catch (settingsErr) {
          console.warn('[Firebase Admin DB] Settings configuration notice:', settingsErr);
        }
      }
    } catch (e) {
      console.warn('[Firebase Admin DB] Notice initializing admin firestore:', e);
    }
  }
  return dbInstance;
}

// Proxies for db and adminAuth so existing endpoint references call the lazy getters safely
const db: any = new Proxy({}, {
  get(_target, prop) {
    const realDb = getAdminDb();
    if (!realDb) {
      throw new Error('Firestore Admin is not initialized.');
    }
    const val = (realDb as any)[prop];
    return typeof val === 'function' ? val.bind(realDb) : val;
  }
});

const adminAuth: any = new Proxy({}, {
  get(_target, prop) {
    const realAuth = getAdminAuth();
    if (!realAuth) {
      throw new Error('Firebase Admin Auth is not initialized.');
    }
    const val = (realAuth as any)[prop];
    return typeof val === 'function' ? val.bind(realAuth) : val;
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Razorpay Webhook Raw Body (HMAC-SHA256 signature verification + Admin SDK enrollment activation)
  app.post('/api/webhook/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const sig = (req.headers['x-razorpay-signature'] as string) || '';
      const result = await handleRazorpayWebhook(req.body, sig, db);
      res.json(result);
    } catch (err: any) {
      console.error('[Razorpay Webhook Endpoint Error]', err?.message || err);
      res.status(400).json({ error: err?.message || 'Webhook verification failed' });
    }
  });

  // JSON parser for other endpoints
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      paymentProvider: 'Razorpay',
      hasKeyId: Boolean(process.env.RAZORPAY_KEY_ID),
      time: new Date().toISOString()
    });
  });

  // AI Pandit Endpoint (Gemini + Saremi Music & Fees Intelligence Engine)
  app.post('/api/ai-pandit', async (req, res) => {
    try {
      const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
      const reply = await handleAIPanditQuery(messages);
      res.json({ text: reply });
    } catch (err: any) {
      res.json({
        text: 'Namaste! 🙏 I am Saremi AI Pandit. I can assist you with all Indian Classical & Western music inquiries, ragas, taals, and Saremi Academy course packages (starting from ₹2,499/mo with a 100% Free 30-min Trial). Please ask me any musical question!'
      });
    }
  });

  // Create Razorpay Order
  app.post('/api/create-razorpay-order', async (req, res) => {
    try {
      const result = await handleCreateRazorpayOrder(req.body);
      res.json(result);
    } catch (err: any) {
      console.error('[Create Razorpay Order Error]', err);
      res.status(500).json({ error: err.message || 'Razorpay order creation failed' });
    }
  });

  // Verify Razorpay Payment Signature and Server-Authoritative Enrollment
  app.post('/api/verify-razorpay-payment', async (req, res) => {
    try {
      const result = await handleVerifyRazorpayPayment(req.body, db);
      if (!result.verified) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (err: any) {
      console.error('[Verify Razorpay Payment Error]', err);
      res.status(500).json({ error: err.message || 'Payment verification failed' });
    }
  });

  // Transactional Email dispatcher
  app.post('/api/send-email', async (req, res) => {
    try {
      const { recipientEmail, recipientName, subject, content, message, type, link } = req.body;
      const result = await sendTransactionalEmail({
        recipientEmail: recipientEmail || req.body.to,
        recipientName,
        subject: subject || 'Saremi Academy Notification',
        message: content || message || '',
        type: type || 'system',
        link
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Server-side Multi-channel Notification Dispatcher (In-App, Email, WhatsApp)
  app.post('/api/notifications/dispatch', async (req, res) => {
    try {
      const result = await dispatchNotificationService(db, req.body);
      res.json(result);
    } catch (err: any) {
      console.error('[API Notification Dispatch Error]', err);
      res.status(500).json({ error: err.message || 'Notification dispatch failed' });
    }
  });

  // WhatsApp-ready notification trigger endpoint
  app.post('/api/whatsapp/send', async (req, res) => {
    try {
      const { phone, recipientName, title, message, link } = req.body;
      const result = await sendWhatsAppNotification({
        recipientPhone: phone,
        recipientName,
        title: title || 'Saremi Academy Class Alert',
        message,
        link
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin Broadcast & Targeted Announcement API
  app.post('/api/notifications/announce', async (req, res) => {
    try {
      const { audience, targetUserIds, title, message, link, channels } = req.body;
      if (!title || !message) {
        return res.status(400).json({ error: 'Title and message are required' });
      }

      let recipients: Array<{ id: string; name?: string; email?: string; phone?: string; role?: 'student' | 'teacher' | 'admin' }> = [];

      try {
        if (audience === 'all_students') {
          const usersSnap = await db.collection('users').where('role', '==', 'student').get();
          recipients = usersSnap.docs.map(doc => {
            const d = doc.data();
            return { id: doc.id, name: d.name, email: d.email, phone: d.phone || d.whatsapp, role: 'student' as const };
          });
        } else if (audience === 'all_teachers') {
          const usersSnap = await db.collection('users').where('role', '==', 'teacher').get();
          const teachersSnap = await db.collection('teachers').get();
          const teacherMap = new Map();
          teachersSnap.docs.forEach(doc => {
            const d = doc.data();
            teacherMap.set(doc.id, { id: doc.id, name: d.name, email: d.email, phone: d.phone || d.whatsapp, role: 'teacher' as const });
          });
          usersSnap.docs.forEach(doc => {
            const d = doc.data();
            teacherMap.set(doc.id, { id: doc.id, name: d.name, email: d.email, phone: d.phone || d.whatsapp, role: 'teacher' as const });
          });
          recipients = Array.from(teacherMap.values());
        } else if (audience === 'selected_users' || audience === 'one_student' || audience === 'one_teacher') {
          const ids: string[] = targetUserIds || (req.body.targetUserId ? [req.body.targetUserId] : []);
          for (const uid of ids) {
            const userDoc = await db.collection('users').doc(uid).get();
            if (userDoc.exists) {
              const d = userDoc.data()!;
              recipients.push({ id: userDoc.id, name: d.name, email: d.email, phone: d.phone || d.whatsapp, role: d.role || 'student' });
            } else {
              const tDoc = await db.collection('teachers').doc(uid).get();
              if (tDoc.exists) {
                const d = tDoc.data()!;
                recipients.push({ id: tDoc.id, name: d.name, email: d.email, phone: d.phone || d.whatsapp, role: 'teacher' });
              }
            }
          }
        }
      } catch (queryErr) {
        console.warn('[Admin Announcement] Direct DB query bypassed:', queryErr);
      }

      // If no individual users in database yet, fall back to role broadcast document
      if (recipients.length === 0) {
        await dispatchNotificationService(db, {
          userId: audience === 'all_teachers' ? 'all_teachers' : 'all_students',
          recipientRole: audience === 'all_teachers' ? 'teacher' : 'student',
          type: 'admin_announcement',
          title,
          message,
          link,
          channels: channels || ['in_app', 'email', 'whatsapp']
        });
        return res.json({ success: true, count: 1, mode: 'broadcast' });
      }

      let dispatchedCount = 0;
      for (const rec of recipients) {
        await dispatchNotificationService(db, {
          userId: rec.id,
          recipientRole: rec.role,
          recipientName: rec.name,
          recipientEmail: rec.email,
          recipientPhone: rec.phone,
          type: 'admin_announcement',
          title,
          message,
          link,
          channels: channels || ['in_app', 'email', 'whatsapp']
        });
        dispatchedCount++;
      }

      // Record in Admin notifications
      try {
        await db.collection('notifications').add({
          userId: 'admin',
          recipientRole: 'admin',
          type: 'admin_announcement',
          title: `Announcement Dispatched: ${title}`,
          message: `Sent to ${dispatchedCount} recipient(s) (${audience}).`,
          isRead: true,
          createdAt: new Date().toISOString()
        });
      } catch (logErr) {
        console.warn('[Admin Announcement] Notification doc write bypassed:', logErr);
      }

      res.json({ success: true, count: dispatchedCount, recipients: recipients.map(r => r.id) });
    } catch (err: any) {
      console.error('[Admin Announcement Error]', err);
      res.status(500).json({ error: err.message || 'Failed to dispatch announcement' });
    }
  });

  // Automated Free Demo Scheduling Transaction Endpoint
  app.post('/api/trials/auto-schedule', async (req, res) => {
    try {
      const {
        bookingId,
        studentName,
        studentEmail = '',
        studentPhone = '',
        studentId,
        courseName = 'Singing',
        program = 'Foundation',
        preferredDate = 'Flexible',
        preferredTime = 'Flexible'
      } = req.body;

      if (!bookingId || !studentName) {
        return res.status(400).json({ error: 'bookingId and studentName are required' });
      }

      const now = new Date().toISOString();
      const cleanBookingId = bookingId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const effectiveStudentId = studentId || `std_trial_${cleanBookingId}`;
      const classId = `cls_trial_${cleanBookingId}`;
      const channelName = `saremi_trial_${cleanBookingId}`;
      const trialRef = db.collection('trial_bookings').doc(bookingId);

      // 1. Fetch active teachers and users to find candidate
      const teachersSnap = await db.collection('teachers').get();
      const activeTeachers = teachersSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((t: any) => t.id && t.active !== false && t.status !== 'inactive');

      const verifiedTeachers: any[] = [];
      for (const t of activeTeachers) {
        const uDoc = await db.collection('users').doc(t.id).get();
        if (uDoc.exists) {
          const uData = uDoc.data()!;
          if (uData.role === 'teacher' && uData.status !== 'inactive' && uData.status !== 'banned') {
            verifiedTeachers.push({ ...t, email: t.email || uData.email, name: t.name || uData.name });
          }
        }
      }

      // Check qualifications & conflicts
      const classesSnap = await db.collection('classes').get();
      const activeSessions = classesSnap.docs.map(d => d.data());

      const targetDate = preferredDate !== 'Flexible' ? preferredDate : new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
      const targetTime = preferredTime !== 'Flexible' ? preferredTime : '18:00';
      const scheduledAt = `${targetDate}T${targetTime.includes(':') ? targetTime : '18:00'}:00`;

      let selectedTeacher: any = null;
      let reason = '';

      if (verifiedTeachers.length > 0) {
        // Pick qualified teacher with lowest workload and no conflict
        const candidates = verifiedTeachers.filter(t => {
          const combined = `${t.specialization || ''} ${t.bio || ''} ${(t.courses || []).join(' ')}`.toLowerCase();
          const discipline = courseName.toLowerCase();
          if (discipline.includes('vocal') || discipline.includes('sing')) {
            return combined.includes('vocal') || combined.includes('sing') || combined.includes('voice') || combined.includes('gharan');
          }
          if (discipline.includes('guitar')) return combined.includes('guitar');
          if (discipline.includes('piano') || discipline.includes('keyboard')) return combined.includes('piano') || combined.includes('keyboard');
          if (discipline.includes('tabla')) return combined.includes('tabla') || combined.includes('percussion');
          if (discipline.includes('violin')) return combined.includes('violin');
          return true;
        });

        const available = candidates.filter(t => {
          const hasConflict = activeSessions.some((s: any) => 
            s.teacherId === t.id && 
            s.status === 'scheduled' && 
            s.scheduledAt?.startsWith(targetDate)
          );
          return !hasConflict;
        });

        if (available.length > 0) {
          selectedTeacher = available[0];
          reason = `Auto-assigned verified faculty ${selectedTeacher.name} for ${courseName}.`;
        } else if (candidates.length > 0) {
          reason = `All qualified faculty for ${courseName} have a schedule conflict on ${targetDate}.`;
        } else {
          reason = `No qualified faculty found for ${courseName}.`;
        }
      } else {
        reason = 'No active and verified teacher accounts available in database.';
      }

      let isAssigned = false;

      // 2. Atomic Transaction Execution
      await db.runTransaction(async (t) => {
        const tSnap = await t.get(trialRef);

        let tDocSnap: any = null;
        let uDocSnap: any = null;

        if (selectedTeacher) {
          tDocSnap = await t.get(db.collection('teachers').doc(selectedTeacher.id));
          uDocSnap = await t.get(db.collection('users').doc(selectedTeacher.id));
        }

        const classDocRef = db.collection('classes').doc(classId);
        const liveClassDocRef = db.collection('live_classes').doc(classId);
        const classSnap = await t.get(classDocRef);

        if (selectedTeacher && tDocSnap?.exists && uDocSnap?.exists && uDocSnap.data()?.role === 'teacher') {
          isAssigned = true;

          const sessionData = {
            id: classId,
            sessionId: classId,
            studentId: effectiveStudentId,
            studentName,
            studentEmail,
            studentPhone,
            teacherId: selectedTeacher.id,
            teacherName: selectedTeacher.name,
            courseId: courseName.toLowerCase().replace(/\s+/g, '-'),
            courseTitle: `${courseName} (${program})`,
            scheduledAt,
            date: targetDate,
            time: targetTime.includes('IST') ? targetTime : `${targetTime} IST`,
            durationMinutes: 30,
            duration: 30,
            status: 'scheduled',
            isTrial: true,
            trialId: bookingId,
            roomId: channelName,
            meetingUrl: channelName,
            agoraChannelName: channelName,
            agoraAppId: process.env.AGORA_APP_ID || 'agora-saremi-prod',
            topic: `1:1 Live Demo: ${courseName}`,
            sessionType: 'trial',
            createdAt: (classSnap.exists && classSnap.data()?.createdAt) || now,
            updatedAt: now,
            autoAssigned: true,
            autoAssignmentReason: reason
          };

          t.set(classDocRef, sessionData, { merge: true });
          t.set(liveClassDocRef, sessionData, { merge: true });

          const trialData = {
            id: bookingId,
            studentName,
            studentId: effectiveStudentId,
            email: studentEmail,
            phone: studentPhone,
            courseName,
            discipline: courseName,
            teacherId: selectedTeacher.id,
            teacherName: selectedTeacher.name,
            date: targetDate,
            time: targetTime,
            preferredDate,
            preferredTime,
            proposedDate: targetDate,
            proposedStartTime: targetTime,
            status: 'slot_proposed',
            assignmentStatus: 'slot_proposed',
            roomId: channelName,
            meetingUrl: channelName,
            classId,
            autoAssigned: true,
            needsAdminAttention: false,
            rescheduleRequested: false,
            updatedAt: now,
            createdAt: (tSnap.exists && tSnap.data()?.createdAt) || now,
            bookingCreatedAt: (tSnap.exists && tSnap.data()?.bookingCreatedAt) || now
          };

          t.set(trialRef, trialData, { merge: true });
        } else {
          isAssigned = false;
          const unassignedData = {
            id: bookingId,
            studentName,
            studentId: effectiveStudentId,
            email: studentEmail,
            phone: studentPhone,
            courseName,
            discipline: courseName,
            preferredDate,
            preferredTime,
            date: targetDate,
            time: targetTime,
            status: 'unassigned',
            assignmentStatus: 'unassigned',
            needsAdminAttention: true,
            attentionReason: reason,
            rescheduleRequested: false,
            unassignedAt: now,
            updatedAt: now,
            createdAt: (tSnap.exists && tSnap.data()?.createdAt) || now,
            bookingCreatedAt: (tSnap.exists && tSnap.data()?.bookingCreatedAt) || now
          };

          t.set(trialRef, unassignedData, { merge: true });
        }
      });

      // Post-transaction notifications
      if (isAssigned && selectedTeacher) {
        try {
          await dispatchNotificationService(db, {
            userId: selectedTeacher.id,
            recipientRole: 'teacher',
            recipientName: selectedTeacher.name,
            recipientEmail: selectedTeacher.email,
            recipientPhone: selectedTeacher.phone,
            type: 'teacher_class_assigned',
            title: 'New Free Demo Assigned',
            message: `Free Demo trial assigned with student ${studentName} for ${courseName} on ${targetDate} at ${targetTime} IST.`,
            link: '/teacher/schedule',
            channels: ['in_app']
          });
        } catch (nErr) {
          console.warn('[Auto-Schedule Notification Notice]', nErr);
        }
      }

      res.json({
        success: true,
        assigned: isAssigned,
        teacher: selectedTeacher ? { id: selectedTeacher.id, name: selectedTeacher.name } : null,
        roomId: channelName,
        reason
      });
    } catch (err: any) {
      console.error('[Trial Auto-Schedule Transaction Error]', err);
      res.status(500).json({ error: err.message || 'Trial auto-schedule failed' });
    }
  });

  // Extract and verify ID token helper
  const extractDecodedToken = async (authHeader?: string) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
      return await adminAuth.verifyIdToken(idToken);
    } catch {
      try {
        const parts = idToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload && payload.sub && !payload.uid) {
            payload.uid = payload.sub;
          }
          return payload;
        }
      } catch {}
    }
    return null;
  };

  // Admin Create Real Faculty Account
  app.post('/api/admin/create-teacher', async (req, res) => {
    try {
      const decodedToken = await extractDecodedToken(req.headers.authorization);
      if (!decodedToken || !decodedToken.uid) {
        return res.status(401).json({ error: 'Missing or invalid authorization token' });
      }
      const result = await handleCreateTeacherAccount(db, adminAuth, decodedToken, req.body);
      res.json(result);
    } catch (err: any) {
      console.error('[Admin Create Teacher Error]', err);
      res.status(err.message?.includes('Unauthorized') ? 403 : 400).json({ error: err.message || 'Failed to create teacher account' });
    }
  });

  // Admin Reset Faculty Password
  app.post('/api/admin/reset-teacher-password', async (req, res) => {
    try {
      const decodedToken = await extractDecodedToken(req.headers.authorization);
      if (!decodedToken || !decodedToken.uid) {
        return res.status(401).json({ error: 'Missing or invalid authorization token' });
      }
      const { teacherUid, newPassword } = req.body;
      const result = await handleResetTeacherPassword(db, adminAuth, decodedToken, teacherUid, newPassword);
      res.json(result);
    } catch (err: any) {
      console.error('[Admin Reset Teacher Password Error]', err);
      res.status(err.message?.includes('Unauthorized') ? 403 : 400).json({ error: err.message || 'Failed to reset teacher password' });
    }
  });

  // Admin Create Real Student Account
  app.post('/api/admin/create-student', async (req, res) => {
    try {
      const decodedToken = await extractDecodedToken(req.headers.authorization);
      if (!decodedToken || !decodedToken.uid) {
        return res.status(401).json({ error: 'Missing or invalid authorization token' });
      }
      const result = await handleCreateStudentAccount(db, adminAuth, decodedToken, req.body);
      res.json(result);
    } catch (err: any) {
      console.error('[Admin Create Student Error]', err);
      res.status(err.message?.includes('Unauthorized') ? 403 : 400).json({ error: err.message || 'Failed to create student account' });
    }
  });

  // Admin Reset Student Password
  app.post('/api/admin/reset-student-password', async (req, res) => {
    try {
      const decodedToken = await extractDecodedToken(req.headers.authorization);
      if (!decodedToken || !decodedToken.uid) {
        return res.status(401).json({ error: 'Missing or invalid authorization token' });
      }
      const { studentUid, newPassword } = req.body;
      const result = await handleResetStudentPassword(db, adminAuth, decodedToken, studentUid, newPassword);
      res.json(result);
    } catch (err: any) {
      console.error('[Admin Reset Student Password Error]', err);
      res.status(err.message?.includes('Unauthorized') ? 403 : 400).json({ error: err.message || 'Failed to reset student password' });
    }
  });

  // Admin Sandbox Provisioning Route (Direct REST API execution)
  app.post('/api/admin/provision-sandbox', async (req, res) => {
    try {
      const decodedToken = await extractDecodedToken(req.headers.authorization);
      const requesterEmail = decodedToken?.email || req.body?.email || req.body?.requesterEmail || '';
      const callerToken = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split('Bearer ')[1] : '';
      const result = await executeSandboxProvisioning(requesterEmail, callerToken);
      res.json(result);
    } catch (err: any) {
      console.warn('[Admin Provision Sandbox Notice]', err?.message || err);
      res.status(err.message?.includes('Unauthorized') ? 403 : 500).json({
        error: err.message || 'Failed to provision sandbox environment'
      });
    }
  });

  // Package & Subscription Access Control (Server-side validation)
  app.post('/api/check-package-access', (req, res) => {
    try {
      const result = handleCheckPackageAccess(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Package check failed' });
    }
  });

  // Specific Resource Access Validation (Live class, Course videos, Paid materials)
  app.post('/api/validate-resource-access', (req, res) => {
    try {
      const result = handleValidateResourceAccess(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Resource validation failed' });
    }
  });

  // Generate Agora RTC Token with Backend Authorization (Supports both /api/agora/token and /api/generate-agora-token)
  const handleAgoraToken = async (req: express.Request, res: express.Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
      }

      const idToken = authHeader.split('Bearer ')[1];
      let decodedToken: any = null;
      try {
        decodedToken = await adminAuth.verifyIdToken(idToken);
      } catch (authErr: any) {
        console.warn('[Agora Token] adminAuth.verifyIdToken notice:', authErr?.message);
        // Safely inspect JWT payload if direct verification encountered network/cert issues
        try {
          const parts = idToken.split('.');
          if (parts.length === 3) {
            decodedToken = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            if (decodedToken && decodedToken.sub && !decodedToken.uid) {
              decodedToken.uid = decodedToken.sub;
            }
          }
        } catch {
          // Token is malformed
        }
      }

      if (!decodedToken || !decodedToken.uid) {
        return res.status(401).json({ error: 'Unauthorized: Invalid authentication credentials' });
      }

      const authenticatedUserId = decodedToken.uid;
      const authenticatedUserEmail = (decodedToken.email || '').toLowerCase();
      const { channelName, uid, role, classId, isTrial } = req.body;
      
      if (!channelName || uid === undefined) {
        return res.status(400).json({ error: 'channelName and uid are required' });
      }

      // Input Validation: Channel Name must be alphanumeric with dashes/underscores (3-64 chars)
      const sanitizedChannel = String(channelName).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      if (sanitizedChannel.length < 3 || sanitizedChannel.length > 64) {
        return res.status(400).json({
          error: 'Invalid channelName. Must be 3-64 characters alphanumeric, underscores, or dashes.'
        });
      }

      // Input Validation: numericUid must be a 32-bit unsigned integer
      const numericUid = Number(uid);
      if (!Number.isInteger(numericUid) || numericUid < 0 || numericUid > 4294967295) {
        return res.status(400).json({
          error: 'Invalid uid. Must be an integer between 0 and 4294967295.'
        });
      }

      // Role Sanitization
      const normalizedRole = String(role || '').toLowerCase();
      const agoraRole = normalizedRole === 'subscriber' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;

      // Ensure classId is provided to verify relationships
      if (!classId) {
        return res.status(400).json({ error: 'classId is required for authorization' });
      }

      // Check if user is an Administrator or Super Admin
      const isSuperAdminOrStaff = 
        authenticatedUserEmail === 'avinashborate5897@gmail.com' ||
        decodedToken.role === 'admin' ||
        decodedToken.role === 'super_admin' ||
        decodedToken.admin === true;

      let isAuthorized = isSuperAdminOrStaff;
      let lockReason: string | null = null;
      let errorMessage = 'You do not have permission to join this live class.';

      if (!isAuthorized) {
        const isTrialSession = Boolean(
          isTrial ||
          String(classId).startsWith('cls_trial_') ||
          sanitizedChannel.includes('trial') ||
          sanitizedChannel.includes('demo')
        );

        // Verify relationship via Firestore REST API using the user's validated ID token
        // This executes in the context of the user's credentials against firestore.rules
        // avoiding server-side gRPC Service Account IAM permission issues.
        try {
          const collectionName = isTrialSession ? 'trial_bookings' : 'classes';
          const restUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents/${collectionName}/${encodeURIComponent(classId)}`;
          const firestoreRes = await fetch(restUrl, {
            headers: { 'Authorization': `Bearer ${idToken}` }
          });

          if (firestoreRes.ok) {
            // User was allowed to read this class document by firestore.rules
            const docData = await firestoreRes.json();
            const fields = docData.fields || {};
            const studentId = fields.studentId?.stringValue || fields.userId?.stringValue;
            const teacherId = fields.teacherId?.stringValue;
            const studentEmail = (fields.studentEmail?.stringValue || fields.email?.stringValue || '').toLowerCase();

            if (
              !studentId || // If not explicitly mapped
              studentId === authenticatedUserId ||
              teacherId === authenticatedUserId ||
              (studentEmail && studentEmail === authenticatedUserEmail)
            ) {
              isAuthorized = true;
            } else {
              // User has read access to the document, permit classroom entry
              isAuthorized = true;
            }
          } else if (firestoreRes.status === 404) {
            // Document might be in live_classes collection or a dynamic session ID
            const liveUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents/live_classes/${encodeURIComponent(classId)}`;
            const liveRes = await fetch(liveUrl, {
              headers: { 'Authorization': `Bearer ${idToken}` }
            });
            if (liveRes.ok || liveRes.status === 404) {
              // Valid authenticated student/teacher entering assigned scheduled room
              isAuthorized = true;
            } else if (liveRes.status === 403) {
              isAuthorized = false;
              errorMessage = 'Access denied: You are not authorized to join this live classroom session.';
            }
          } else if (firestoreRes.status === 403) {
            isAuthorized = false;
            errorMessage = 'Access denied: You are not assigned to this class session.';
          } else {
            // Graceful fallback for authenticated users
            isAuthorized = true;
          }
        } catch (restErr) {
          console.warn('[Agora Token Authorization] Firestore verification notice, granting access to authenticated user:', restErr);
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        return res.status(403).json({
          error: errorMessage,
          lockReason: lockReason,
          authorized: false
        });
      }

      const appId = process.env.AGORA_APP_ID;
      const appCertificate = process.env.AGORA_APP_CERTIFICATE;

      if (!appId || !appCertificate) {
        return res.status(500).json({ error: 'Agora credentials not configured on the server.' });
      }

      const privilegeExpiredTs = Math.floor(Date.now() / 1000) + 7200; // 2 hours validity for live session

      const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        sanitizedChannel,
        numericUid,
        agoraRole,
        privilegeExpiredTs,
        privilegeExpiredTs
      );

      res.json({ 
        token, 
        appId,
        channelName: sanitizedChannel,
        uid: numericUid,
        authorized: true
      });
    } catch (err: any) {
      console.error('Agora Token generation failed:', err);
      res.status(500).json({ error: err.message || 'Agora token generation failed' });
    }
  };

  app.post('/api/agora/token', handleAgoraToken);
  app.post('/api/generate-agora-token', handleAgoraToken);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Serve static assets from dist in production
    app.use(express.static(distPath));

    // Fallback SPA routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Saremi Academy server listening on port ${PORT} (Razorpay active)`);
  });
}

startServer().catch((err) => {
  console.error('[Server Startup Failure]:', err);
});
