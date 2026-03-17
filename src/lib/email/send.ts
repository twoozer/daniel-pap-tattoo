/**
 * Email sending utility.
 * Uses Resend if RESEND_API_KEY is set, otherwise logs to console.
 *
 * To enable emails:
 * 1. Sign up at https://resend.com (free tier: 100 emails/day)
 * 2. Verify your domain (danielpaptattoo.com)
 * 3. Add RESEND_API_KEY to .env.local
 */

import { generateICalString } from './ical';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Daniel Pap Tattoo <info@danielpaptattoo.com>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'info@danielpaptattoo.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface EmailAttachment {
  filename: string;
  content: string; // base64-encoded content
  content_type: string;
}

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

async function sendEmail({ to, subject, html, attachments }: EmailPayload): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log('[EMAIL] No RESEND_API_KEY set. Would send:');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body: ${html.substring(0, 200)}...`);
    if (attachments?.length) {
      console.log(`  Attachments: ${attachments.map(a => a.filename).join(', ')}`);
    }
    return false;
  }

  try {
    const body: Record<string, unknown> = {
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    };

    if (attachments && attachments.length > 0) {
      body.attachments = attachments.map(a => ({
        filename: a.filename,
        content: a.content,
        content_type: a.content_type,
      }));
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('[EMAIL] Failed to send:', error);
      return false;
    }

    console.log(`[EMAIL] Sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error('[EMAIL] Error:', err);
    return false;
  }
}

// ── Helper: format date/time for email display ──────────────

function formatEmailDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatEmailTime(timeStr: string): string {
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'pm' : 'am';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  } catch {
    return timeStr;
  }
}

// ── Email Templates ──────────────────────────────────────────

export async function sendBookingConfirmation(booking: {
  customer_name: string;
  customer_email: string;
  booking_type: string;
  appointment_date?: string | null;
  appointment_start_time?: string | null;
  appointment_end_time?: string | null;
  total_price?: number | null;
  deposit_amount?: number | null;
  size_category?: string | null;
  style?: string | null;
  description?: string | null;
  id: string;
  access_token: string;
}) {
  const bookingUrl = `${APP_URL}/booking/${booking.id}?token=${booking.access_token}`;
  const isConsultation = booking.booking_type === 'consultation';
  const isCustomQuote = booking.booking_type === 'custom_quote';

  let subject = 'Booking Confirmed - Daniel Pap Tattoo';
  if (isConsultation) subject = 'Consultation Booked - Daniel Pap Tattoo';
  if (isCustomQuote) subject = 'Quote Request Received - Daniel Pap Tattoo';

  const dateDisplay = booking.appointment_date ? formatEmailDate(booking.appointment_date) : null;
  const timeDisplay = booking.appointment_start_time ? formatEmailTime(booking.appointment_start_time) : null;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #000;">Daniel Pap Tattoo</h2>
      <p>Hi ${booking.customer_name},</p>

      ${isConsultation ? `
        <p>Your consultation has been booked!</p>
        ${dateDisplay ? `<p><strong>Date:</strong> ${dateDisplay}</p>` : ''}
        ${timeDisplay ? `<p><strong>Time:</strong> ${timeDisplay}</p>` : ''}
        <p>Duration: 30 minutes (free)</p>
      ` : isCustomQuote ? `
        <p>I've received your custom quote request and will be in touch shortly to discuss your tattoo and provide a quote.</p>
      ` : `
        <p>Your tattoo booking has been confirmed!</p>
        ${dateDisplay ? `<p><strong>Date:</strong> ${dateDisplay}</p>` : ''}
        ${timeDisplay ? `<p><strong>Time:</strong> ${timeDisplay}</p>` : ''}
        ${booking.size_category ? `<p><strong>Size:</strong> ${booking.size_category}</p>` : ''}
        ${booking.style ? `<p><strong>Style:</strong> ${booking.style.replace('-', ' ')}</p>` : ''}
        ${booking.total_price ? `<p><strong>Total:</strong> $${(booking.total_price / 100).toFixed(2)}</p>` : ''}
        ${booking.deposit_amount ? `<p><strong>Deposit paid:</strong> $${(booking.deposit_amount / 100).toFixed(2)}</p>` : ''}
      `}

      ${booking.appointment_date && booking.appointment_start_time ? `
        <p style="color: #52525b; font-size: 14px;">A calendar invite (.ics file) is attached — add it to your calendar so you don't forget!</p>
      ` : ''}

      <p>You can view your booking, message me, and share reference images here:</p>
      <p><a href="${bookingUrl}" style="display: inline-block; background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">View Your Booking</a></p>

      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
      <p style="color: #71717a; font-size: 14px;">
        Daniel Pap Tattoo<br/>
        Clean, Classic, Fast Tattooing on the Gold Coast<br/>
        <a href="https://www.instagram.com/danielpap/" style="color: #71717a;">@danielpap</a>
      </p>
    </div>
  `;

  // Generate iCal attachment if there's a date and time
  const attachments: EmailAttachment[] = [];
  if (booking.appointment_date && booking.appointment_start_time && booking.appointment_end_time) {
    const eventSummary = isConsultation
      ? 'Consultation - Daniel Pap Tattoo'
      : 'Tattoo Appointment - Daniel Pap Tattoo';
    const eventDescription = [
      isConsultation ? 'Free consultation' : `Tattoo appointment`,
      booking.size_category ? `Size: ${booking.size_category}` : null,
      booking.style ? `Style: ${booking.style.replace('-', ' ')}` : null,
      `\nView booking: ${bookingUrl}`,
    ].filter(Boolean).join('\n');

    const icalString = generateICalString({
      uid: booking.id,
      summary: eventSummary,
      description: eventDescription,
      date: booking.appointment_date,
      startTime: booking.appointment_start_time,
      endTime: booking.appointment_end_time,
    });

    attachments.push({
      filename: 'appointment.ics',
      content: Buffer.from(icalString, 'utf-8').toString('base64'),
      content_type: 'text/calendar; method=REQUEST',
    });
  }

  return sendEmail({ to: booking.customer_email, subject, html, attachments });
}

export async function sendAdminNewBookingNotification(booking: {
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  booking_type: string;
  size_category?: string | null;
  style?: string | null;
  body_placement?: string | null;
  description?: string | null;
  appointment_date?: string | null;
  id: string;
}) {
  const adminUrl = `${APP_URL}/admin/bookings/${booking.id}`;
  const isConsultation = booking.booking_type === 'consultation';
  const isCustomQuote = booking.booking_type === 'custom_quote';

  let subject = `New Booking: ${booking.customer_name}`;
  if (isConsultation) subject = `New Consultation: ${booking.customer_name}`;
  if (isCustomQuote) subject = `New Quote Request: ${booking.customer_name}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New ${isConsultation ? 'Consultation' : isCustomQuote ? 'Quote Request' : 'Booking'}</h2>
      <p><strong>Customer:</strong> ${booking.customer_name}</p>
      <p><strong>Email:</strong> ${booking.customer_email}</p>
      ${booking.customer_phone ? `<p><strong>Phone:</strong> ${booking.customer_phone}</p>` : ''}
      ${booking.size_category ? `<p><strong>Size:</strong> ${booking.size_category}</p>` : ''}
      ${booking.style ? `<p><strong>Style:</strong> ${booking.style}</p>` : ''}
      ${booking.body_placement ? `<p><strong>Placement:</strong> ${booking.body_placement}</p>` : ''}
      ${booking.description ? `<p><strong>Description:</strong> ${booking.description}</p>` : ''}
      ${booking.appointment_date ? `<p><strong>Date:</strong> ${formatEmailDate(booking.appointment_date)}</p>` : ''}

      <p><a href="${adminUrl}" style="display: inline-block; background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 12px;">View Booking</a></p>
    </div>
  `;

  return sendEmail({ to: ADMIN_EMAIL, subject, html });
}

export async function sendNewMessageNotification(params: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  messagePreview: string;
  bookingId: string;
  accessToken?: string;
  isAdmin: boolean;
}) {
  const { recipientEmail, recipientName, senderName, messagePreview, bookingId, accessToken, isAdmin } = params;

  const url = isAdmin
    ? `${APP_URL}/admin/messages/${bookingId}`
    : `${APP_URL}/booking/${bookingId}?token=${accessToken}`;

  const subject = `New message from ${senderName} - Daniel Pap Tattoo`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #000;">Daniel Pap Tattoo</h2>
      <p>Hi ${recipientName},</p>
      <p>You have a new message from <strong>${senderName}</strong>:</p>
      <blockquote style="border-left: 3px solid #e4e4e7; padding-left: 16px; color: #52525b; margin: 16px 0;">
        ${messagePreview}
      </blockquote>
      <p><a href="${url}" style="display: inline-block; background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">View & Reply</a></p>

      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
      <p style="color: #71717a; font-size: 14px;">Daniel Pap Tattoo</p>
    </div>
  `;

  return sendEmail({ to: recipientEmail, subject, html });
}

/**
 * Send a reminder email 24 hours before an appointment.
 * Called by a cron job / scheduled task.
 */
export async function sendAppointmentReminder(booking: {
  customer_name: string;
  customer_email: string;
  booking_type: string;
  appointment_date: string;
  appointment_start_time: string;
  size_category?: string | null;
  id: string;
  access_token: string;
}) {
  const bookingUrl = `${APP_URL}/booking/${booking.id}?token=${booking.access_token}`;
  const isConsultation = booking.booking_type === 'consultation';

  const dateDisplay = formatEmailDate(booking.appointment_date);
  const timeDisplay = formatEmailTime(booking.appointment_start_time);

  const subject = `Reminder: ${isConsultation ? 'Consultation' : 'Tattoo Appointment'} Tomorrow - Daniel Pap Tattoo`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #000;">Daniel Pap Tattoo</h2>
      <p>Hi ${booking.customer_name},</p>

      <p>Just a friendly reminder that your ${isConsultation ? 'consultation' : 'tattoo appointment'} is <strong>tomorrow</strong>!</p>

      <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0;"><strong>Date:</strong> ${dateDisplay}</p>
        <p style="margin: 8px 0 0 0;"><strong>Time:</strong> ${timeDisplay}</p>
        ${!isConsultation && booking.size_category ? `<p style="margin: 8px 0 0 0;"><strong>Size:</strong> ${booking.size_category}</p>` : ''}
      </div>

      ${!isConsultation ? `
        <p><strong>A few things to remember:</strong></p>
        <ul style="color: #52525b; font-size: 14px;">
          <li>Get a good night's sleep and stay hydrated</li>
          <li>Eat a proper meal before your session</li>
          <li>Avoid alcohol 24 hours before your appointment</li>
          <li>Wear comfortable clothing that gives easy access to the tattoo area</li>
        </ul>
      ` : ''}

      <p>If you need to reschedule or have any questions, message me here:</p>
      <p><a href="${bookingUrl}" style="display: inline-block; background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">View Your Booking</a></p>

      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
      <p style="color: #71717a; font-size: 14px;">
        Daniel Pap Tattoo<br/>
        Clean, Classic, Fast Tattooing on the Gold Coast<br/>
        <a href="https://www.instagram.com/danielpap/" style="color: #71717a;">@danielpap</a>
      </p>
    </div>
  `;

  return sendEmail({ to: booking.customer_email, subject, html });
}
