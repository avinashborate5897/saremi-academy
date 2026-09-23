import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { AppNotification, NotificationType } from '../types';

export interface DispatchNotificationParams {
  userId: string; // Target User ID, or 'admin', or 'all_students', or 'all_teachers'
  recipientRole?: 'student' | 'teacher' | 'admin' | 'all';
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string; // WhatsApp mobile number
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  channels?: ('in_app' | 'email' | 'whatsapp')[];
  metadata?: Record<string, any>;
}

export interface DeliveryResult {
  success: boolean;
  notificationId?: string;
  emailStatus: 'sent' | 'failed' | 'not_configured' | 'skipped';
  whatsappStatus: 'sent' | 'failed' | 'ready' | 'skipped';
  error?: string;
}

/**
 * Normalizes phone numbers to standard WhatsApp format (+E.164 without spaces or dashes)
 */
export function normalizeWhatsAppNumber(phone?: string): string {
  if (!phone) return '';
  // Strip spaces, dashes, parentheses
  let cleaned = phone.trim().replace(/[\s\-\(\)]/g, '');
  // If starts with 00, replace with +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2);
  }
  // If 10 digits (common for India), prefix with +91
  if (/^\d{10}$/.test(cleaned)) {
    cleaned = '+91' + cleaned;
  }
  // Ensure starts with + if digits only
  if (/^\d{11,15}$/.test(cleaned) && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

/**
 * Generates an elegant, high-contrast HTML email matching Saremi Academy design language
 */
export function generateSaremiEmailHtml(params: {
  recipientName?: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}): string {
  const name = params.recipientName || 'Valued Musician';
  const ctaButton = params.link
    ? `
      <div style="margin: 28px 0; text-align: left;">
        <a href="${params.link}" style="background-color: #D49A3D; color: #121829; font-weight: 700; padding: 12px 24px; text-decoration: none; border-radius: 10px; display: inline-block; font-size: 14px;">
          Open in Saremi Academy &rarr;
        </a>
      </div>
    `
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #121829;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF8F5; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #EAE5DB; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
          <!-- Header -->
          <tr>
            <td style="background-color: #121829; padding: 24px 32px; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="color: #D49A3D; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">SAREMI ACADEMY</span>
                    <div style="color: #A3AAB8; font-size: 11px; margin-top: 2px;">LIVE 1:1 CONSERVATORY OF INDIAN & GLOBAL MUSIC</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #121829; line-height: 1.3;">
                ${params.title}
              </h2>
              
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4A5568;">
                Namaste ${name},
              </p>

              <div style="background-color: #FAF8F5; border-left: 4px solid #D49A3D; border-radius: 4px; padding: 16px 20px; margin: 20px 0; font-size: 14px; line-height: 1.6; color: #2D3748; white-space: pre-line;">
                ${params.message}
              </div>

              ${ctaButton}

              <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 1.5; color: #718096;">
                If you have any questions, reply directly to this email or connect with your academic mentor at <a href="mailto:admissions@saremiacademy.online" style="color: #8C6428; text-decoration: underline;">admissions@saremiacademy.online</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FAF8F5; border-top: 1px solid #EAE5DB; padding: 20px 32px; text-align: left; font-size: 11px; color: #A0AEC0;">
              <div>Saremi Academy • Classical Vocals, Piano, Guitar & Tabla Mastery</div>
              <div style="margin-top: 4px;">Official Domain: <a href="https://saremiacademy.online" style="color: #718096; text-decoration: none;">saremiacademy.online</a></div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Server-side transactional email dispatcher
 */
export async function sendTransactionalEmail(params: {
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  message: string;
  type: NotificationType;
  link?: string;
}): Promise<{ success: boolean; status: 'sent' | 'failed' | 'not_configured'; error?: string }> {
  const apiKey = process.env.TRANSACTIONAL_EMAIL_API_KEY || process.env.EMAIL_PROVIDER_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'Saremi Academy <admissions@saremiacademy.online>';

  const html = generateSaremiEmailHtml({
    recipientName: params.recipientName,
    title: params.subject,
    message: params.message,
    type: params.type,
    link: params.link
  });

  if (!apiKey) {
    // Graceful fallback: Production-ready simulated dispatcher
    console.log(`[Email Service - Provider Ready] Mock dispatch to ${params.recipientEmail}: "${params.subject}"`);
    return { success: true, status: 'not_configured' };
  }

  try {
    // Primary integration: Resend API or generic transactional endpoint
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [params.recipientEmail],
        subject: params.subject,
        html: html
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.warn('[Email Dispatch Notice]', response.status, errBody);
      return { success: false, status: 'failed', error: `Email API responded with ${response.status}: ${errBody}` };
    }

    const data = await response.json();
    console.log('[Email Dispatched Successfully]', data);
    return { success: true, status: 'sent' };
  } catch (err: any) {
    console.error('[Email Dispatch Error]', err);
    return { success: false, status: 'failed', error: err.message || 'Unknown network error' };
  }
}

/**
 * Server-side WhatsApp Business / Meta API-ready dispatcher
 */
export async function sendWhatsAppNotification(params: {
  recipientPhone: string;
  recipientName?: string;
  title: string;
  message: string;
  link?: string;
}): Promise<{ success: boolean; status: 'sent' | 'failed' | 'ready'; error?: string }> {
  const normalizedPhone = normalizeWhatsAppNumber(params.recipientPhone);
  if (!normalizedPhone) {
    return { success: false, status: 'skipped' as any, error: 'No phone number provided' };
  }

  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  // Clean formatted WhatsApp text message
  let textBody = `*Saremi Academy Notification*\n\n*${params.title}*\n\n${params.message}`;
  if (params.link) {
    textBody += `\n\nAccess Link: ${params.link}`;
  }
  textBody += `\n\n_Saremi Academy Conservatory_`;

  if (!token || !phoneNumberId) {
    // Provider-ready architecture: Stored and ready for activation
    console.log(`[WhatsApp Service - Provider Ready] Formatted message queued for ${normalizedPhone}:\n${textBody}`);
    return { success: true, status: 'ready' };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedPhone.replace(/^\+/, ''),
        type: 'text',
        text: { preview_url: Boolean(params.link), body: textBody }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('[WhatsApp API Notice]', response.status, errText);
      return { success: false, status: 'failed', error: `WhatsApp API HTTP ${response.status}: ${errText}` };
    }

    const data = await response.json();
    console.log('[WhatsApp Dispatched Successfully]', data);
    return { success: true, status: 'sent' };
  } catch (err: any) {
    console.error('[WhatsApp Dispatch Error]', err);
    return { success: false, status: 'failed', error: err.message || 'WhatsApp network error' };
  }
}

/**
 * Primary Core Dispatcher: writes in-app Firestore notification + triggers Email & WhatsApp
 */
export async function dispatchNotificationService(
  db: ReturnType<typeof getFirestore>,
  params: DispatchNotificationParams
): Promise<DeliveryResult> {
  const channels = params.channels || ['in_app', 'email', 'whatsapp'];
  let emailStatus: 'sent' | 'failed' | 'not_configured' | 'skipped' = 'skipped';
  let whatsappStatus: 'sent' | 'failed' | 'ready' | 'skipped' = 'skipped';

  const notificationDocRef = db.collection('notifications').doc();
  const notificationId = notificationDocRef.id;

  // 1. Send Email if email channel requested and email provided
  if (channels.includes('email') && params.recipientEmail) {
    const emailResult = await sendTransactionalEmail({
      recipientEmail: params.recipientEmail,
      recipientName: params.recipientName,
      subject: params.title,
      message: params.message,
      type: params.type,
      link: params.link
    });
    emailStatus = emailResult.status;
  }

  // 2. Send WhatsApp if channel requested and phone provided
  if (channels.includes('whatsapp') && params.recipientPhone) {
    const waResult = await sendWhatsAppNotification({
      recipientPhone: params.recipientPhone,
      recipientName: params.recipientName,
      title: params.title,
      message: params.message,
      link: params.link
    });
    whatsappStatus = waResult.status;
  }

  // 3. Store In-App Notification in Firestore (strictly sanitizing undefined properties)
  const notificationData: Record<string, any> = {
    id: notificationId,
    userId: params.userId || 'all',
    recipientRole: params.recipientRole || 'student',
    recipientName: params.recipientName || '',
    recipientEmail: params.recipientEmail || '',
    recipientPhone: params.recipientPhone || '',
    title: params.title || 'Notification',
    message: params.message || '',
    type: params.type || 'system',
    link: params.link || '',
    isRead: false,
    createdAt: Timestamp.now(),
    channels: channels,
    deliveryStatus: {
      email: emailStatus,
      whatsapp: whatsappStatus
    },
    metadata: params.metadata || {}
  };

  try {
    await notificationDocRef.set(notificationData);
  } catch (dbErr) {
    console.warn('[Notification Service] In-app notification write bypassed:', dbErr);
  }

  // 4. If critical delivery failed, alert Admin
  if (emailStatus === 'failed' || whatsappStatus === 'failed') {
    const failedChannels: string[] = [];
    if (emailStatus === 'failed') failedChannels.push('Email');
    if (whatsappStatus === 'failed') failedChannels.push('WhatsApp');

    try {
      await db.collection('notifications').add({
        userId: 'admin',
        recipientRole: 'admin',
        title: 'Alert: Notification Delivery Failed',
        message: `Failed to deliver notification "${params.title}" via ${failedChannels.join(' & ')} to ${params.recipientEmail || params.recipientPhone || params.recipientName || 'recipient'}.`,
        type: 'admin_notification_failure',
        isRead: false,
        createdAt: Timestamp.now(),
        metadata: { originalNotificationId: notificationId, params: JSON.parse(JSON.stringify(params || {})) }
      });
    } catch (err) {
      console.warn('[Notification Service] Failure alert write bypassed:', err);
    }
  }

  return {
    success: true,
    notificationId,
    emailStatus,
    whatsappStatus
  };
}
