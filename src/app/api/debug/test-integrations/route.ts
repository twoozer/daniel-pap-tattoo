import { NextRequest, NextResponse } from 'next/server';
import { createCalendarEvent } from '@/lib/google-calendar/client';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  // Check env vars (show if set, not the actual values)
  results.env = {
    GOOGLE_CALENDAR_ID: process.env.GOOGLE_CALENDAR_ID ? `SET (${process.env.GOOGLE_CALENDAR_ID.substring(0, 10)}...)` : 'NOT SET',
    GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? `SET (${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL.substring(0, 20)}...)` : 'NOT SET',
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY ? `SET (length: ${process.env.GOOGLE_PRIVATE_KEY.length}, starts: ${process.env.GOOGLE_PRIVATE_KEY.substring(0, 30)}...)` : 'NOT SET',
    RESEND_API_KEY: process.env.RESEND_API_KEY ? `SET (${process.env.RESEND_API_KEY.substring(0, 8)}...)` : 'NOT SET',
    FROM_EMAIL: process.env.FROM_EMAIL || 'NOT SET (using default)',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'NOT SET (using default)',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? `SET (${process.env.STRIPE_SECRET_KEY.substring(0, 10)}...)` : 'NOT SET',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
  };

  // Test Google Calendar
  try {
    const eventId = await createCalendarEvent({
      summary: 'TEST - Delete me',
      description: 'Diagnostic test event - safe to delete',
      date: '2026-03-18',
      startTime: '10:00',
      endTime: '10:30',
      customerName: 'Test User',
      customerEmail: 'test@test.com',
    });
    results.googleCalendar = eventId ? `SUCCESS - Event ID: ${eventId}` : 'FAILED - returned null (check config)';
  } catch (err) {
    results.googleCalendar = `ERROR: ${err instanceof Error ? err.message : String(err)}`;
  }

  // Test Resend
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      results.resend = 'NOT CONFIGURED - no API key';
    } else {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Daniel Pap Tattoo <${process.env.FROM_EMAIL || 'info@danielpaptattoo.com'}>`,
          to: [process.env.ADMIN_EMAIL || 'info@danielpaptattoo.com'],
          subject: 'TEST - Diagnostic email',
          html: '<p>This is a test email from the diagnostic endpoint. Safe to ignore.</p>',
        }),
      });
      const data = await res.text();
      results.resend = res.ok ? `SUCCESS - ${data}` : `FAILED (${res.status}): ${data}`;
    }
  } catch (err) {
    results.resend = `ERROR: ${err instanceof Error ? err.message : String(err)}`;
  }

  return NextResponse.json(results, { status: 200 });
}
