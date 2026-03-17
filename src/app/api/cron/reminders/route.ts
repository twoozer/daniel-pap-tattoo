import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendAppointmentReminder } from '@/lib/email/send';

/**
 * Cron endpoint to send appointment reminders.
 * Should be called once daily (e.g. 8am AEST via Vercel Cron).
 *
 * Sends a reminder email to all customers who have an appointment TOMORROW
 * and whose booking is in a confirmed/active status.
 *
 * Vercel Cron config (add to vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/reminders",
 *     "schedule": "0 22 * * *"  // 22:00 UTC = 08:00 AEST next day
 *   }]
 * }
 *
 * Security: Protected by CRON_SECRET env var.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent public access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Calculate tomorrow's date in Australia/Brisbane timezone
  const now = new Date();
  // Australia/Brisbane is UTC+10
  const brisbaneOffset = 10 * 60; // minutes
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const brisbaneMinutes = utcMinutes + brisbaneOffset;

  const brisbaneDate = new Date(now);
  if (brisbaneMinutes >= 1440) {
    brisbaneDate.setUTCDate(brisbaneDate.getUTCDate() + 1);
  }

  // Tomorrow in Brisbane
  const tomorrow = new Date(brisbaneDate);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Find all bookings with appointments tomorrow that are in active statuses
  const activeStatuses = ['deposit_paid', 'confirmed', 'consultation_booked'];

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, customer_name, customer_email, booking_type, appointment_date, appointment_start_time, size_category, access_token')
    .eq('appointment_date', tomorrowStr)
    .in('status', activeStatuses);

  if (error) {
    console.error('[REMINDERS] Error fetching bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ message: 'No appointments tomorrow', date: tomorrowStr, sent: 0 });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const booking of bookings) {
    if (!booking.appointment_start_time) continue;

    try {
      const success = await sendAppointmentReminder({
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        booking_type: booking.booking_type,
        appointment_date: booking.appointment_date,
        appointment_start_time: booking.appointment_start_time,
        size_category: booking.size_category,
        id: booking.id,
        access_token: booking.access_token,
      });

      if (success) {
        sent++;
      } else {
        errors.push(`Failed to send to ${booking.customer_email}`);
      }
    } catch (err) {
      errors.push(`Error for ${booking.customer_email}: ${err}`);
    }
  }

  console.log(`[REMINDERS] Sent ${sent}/${bookings.length} reminders for ${tomorrowStr}`);

  return NextResponse.json({
    message: `Sent ${sent} reminder(s) for ${tomorrowStr}`,
    date: tomorrowStr,
    total: bookings.length,
    sent,
    errors: errors.length > 0 ? errors : undefined,
  });
}
