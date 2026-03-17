/**
 * Generate an iCalendar (.ics) file string for a booking appointment.
 * This can be attached to emails so the client gets a calendar invite.
 */

interface ICalEventParams {
  uid: string;            // Unique ID (booking ID)
  summary: string;        // Event title
  description: string;    // Event description
  date: string;           // YYYY-MM-DD
  startTime: string;      // HH:MM
  endTime: string;        // HH:MM
  location?: string;
  organizerName?: string;
  organizerEmail?: string;
}

function formatICalDate(date: string, time: string): string {
  // Convert YYYY-MM-DD and HH:MM to iCal format: YYYYMMDDTHHMMSS
  const d = date.replace(/-/g, '');
  const t = time.replace(/:/g, '') + '00';
  return `${d}T${t}`;
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function generateICalString(params: ICalEventParams): string {
  const {
    uid,
    summary,
    description,
    date,
    startTime,
    endTime,
    location = 'Gold Coast, QLD, Australia',
    organizerName = 'Daniel Pap Tattoo',
    organizerEmail = 'info@danielpaptattoo.com',
  } = params;

  const dtStart = formatICalDate(date, startTime);
  const dtEnd = formatICalDate(date, endTime);
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  // VTIMEZONE for Australia/Brisbane (AEST, no DST)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Daniel Pap Tattoo//Booking System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VTIMEZONE',
    'TZID:Australia/Brisbane',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+1000',
    'TZOFFSETTO:+1000',
    'TZNAME:AEST',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${uid}@danielpaptattoo.com`,
    `DTSTAMP:${now}`,
    `DTSTART;TZID=Australia/Brisbane:${dtStart}`,
    `DTEND;TZID=Australia/Brisbane:${dtEnd}`,
    `SUMMARY:${escapeICalText(summary)}`,
    `DESCRIPTION:${escapeICalText(description)}`,
    `LOCATION:${escapeICalText(location)}`,
    `ORGANIZER;CN=${escapeICalText(organizerName)}:mailto:${organizerEmail}`,
    'STATUS:CONFIRMED',
    // Reminders
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Tattoo appointment tomorrow',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Tattoo appointment in 2 hours',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}
