/**
 * Google Calendar integration via Service Account.
 *
 * Setup:
 * 1. Go to https://console.cloud.google.com
 * 2. Create a project (or use existing)
 * 3. Enable "Google Calendar API"
 * 4. Create a Service Account (IAM & Admin → Service Accounts)
 * 5. Create a JSON key for the service account
 * 6. Copy the client_email and private_key from the JSON key
 * 7. In Google Calendar, share the calendar with the service account email (give "Make changes to events" permission)
 * 8. Set the env variables:
 *    - GOOGLE_CALENDAR_ID: The calendar ID (usually your email, or found in Calendar Settings → Integrate calendar)
 *    - GOOGLE_SERVICE_ACCOUNT_EMAIL: The service account email (e.g. something@project.iam.gserviceaccount.com)
 *    - GOOGLE_PRIVATE_KEY: The private key from the JSON file (the full string including -----BEGIN PRIVATE KEY----- etc)
 */

import { google, calendar_v3 } from 'googleapis';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

function isConfigured(): boolean {
  return !!(
    CALENDAR_ID &&
    SERVICE_ACCOUNT_EMAIL &&
    PRIVATE_KEY &&
    !CALENDAR_ID.includes('placeholder') &&
    !SERVICE_ACCOUNT_EMAIL.includes('placeholder') &&
    !PRIVATE_KEY.includes('placeholder')
  );
}

function getCalendarClient(): calendar_v3.Calendar | null {
  if (!isConfigured()) {
    console.log('[GCAL] Google Calendar not configured. Skipping.');
    return null;
  }

  const auth = new google.auth.JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
}

/**
 * Create a Google Calendar event for a booking.
 * Returns the event ID or null if failed/not configured.
 */
export async function createCalendarEvent(params: {
  summary: string;
  description?: string;
  date: string;         // YYYY-MM-DD
  startTime: string;    // HH:MM
  endTime: string;      // HH:MM
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
}): Promise<string | null> {
  const calendar = getCalendarClient();
  if (!calendar) return null;

  const { summary, description, date, startTime, endTime, customerName, customerEmail, customerPhone } = params;

  // Build timezone-aware datetime strings (Gold Coast = Australia/Brisbane, AEST UTC+10)
  const timeZone = 'Australia/Brisbane';
  const startDateTime = `${date}T${startTime}:00`;
  const endDateTime = `${date}T${endTime}:00`;

  const eventDescription = [
    `Customer: ${customerName}`,
    `Email: ${customerEmail}`,
    customerPhone ? `Phone: ${customerPhone}` : null,
    description ? `\nDetails: ${description}` : null,
  ].filter(Boolean).join('\n');

  try {
    const res = await calendar.events.insert({
      calendarId: CALENDAR_ID!,
      requestBody: {
        summary,
        description: eventDescription,
        start: {
          dateTime: startDateTime,
          timeZone,
        },
        end: {
          dateTime: endDateTime,
          timeZone,
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 60 },
            { method: 'popup', minutes: 1440 }, // 24 hours
          ],
        },
      },
    });

    console.log(`[GCAL] Created event: ${res.data.id}`);
    return res.data.id || null;
  } catch (err) {
    console.error('[GCAL] Failed to create event:', err);
    return null;
  }
}

/**
 * Delete a Google Calendar event by event ID.
 */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  const calendar = getCalendarClient();
  if (!calendar) return false;

  try {
    await calendar.events.delete({
      calendarId: CALENDAR_ID!,
      eventId,
    });
    console.log(`[GCAL] Deleted event: ${eventId}`);
    return true;
  } catch (err) {
    console.error('[GCAL] Failed to delete event:', err);
    return false;
  }
}

/**
 * Get busy times from Google Calendar for a given date range.
 * Used to compute available slots.
 */
export async function getCalendarBusyTimes(date: string): Promise<Array<{ start: string; end: string }>> {
  const calendar = getCalendarClient();
  if (!calendar) return [];

  const timeZone = 'Australia/Brisbane';

  try {
    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin: `${date}T00:00:00+10:00`,
        timeMax: `${date}T23:59:59+10:00`,
        timeZone,
        items: [{ id: CALENDAR_ID! }],
      },
    });

    const busySlots = res.data.calendars?.[CALENDAR_ID!]?.busy || [];
    return busySlots.map((slot) => ({
      start: new Date(slot.start!).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone }),
      end: new Date(slot.end!).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone }),
    }));
  } catch (err) {
    console.error('[GCAL] Failed to get busy times:', err);
    return [];
  }
}
