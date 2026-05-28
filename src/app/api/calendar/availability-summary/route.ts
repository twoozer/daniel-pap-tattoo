import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateTimeSlots, getMaxBookingDate, toDateString } from '@/lib/utils/date-helpers';
import { IS_PROTOTYPE, MOCK_AVAILABILITY } from '@/lib/mock-data';
import { MAX_ADVANCE_BOOKING_MONTHS } from '@/lib/utils/constants';
import { getCalendarBusyTimesRange } from '@/lib/google-calendar/client';
import { DayAvailabilityStatus } from '@/types/booking';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month'); // YYYY-MM
  const duration = parseFloat(searchParams.get('duration') || '1');

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'month (YYYY-MM) is required' }, { status: 400 });
  }

  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const monthStart = toDateString(firstDay);
  const monthEnd = toDateString(lastDay);

  const maxDateStr = toDateString(getMaxBookingDate(MAX_ADVANCE_BOOKING_MONTHS));
  const todayStr = toDateString(new Date());

  const days: Record<string, { slotCount: number; status: DayAvailabilityStatus }> = {};

  // --- Prototype mode ---
  if (IS_PROTOTYPE) {
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, monthIndex, d);
      const dateStr = toDateString(date);

      if (dateStr < todayStr || dateStr > maxDateStr) {
        days[dateStr] = { slotCount: 0, status: 'unavailable' };
        continue;
      }

      const avail = MOCK_AVAILABILITY.find((a) => a.day_of_week === date.getDay());
      if (!avail || !avail.is_working) {
        days[dateStr] = { slotCount: 0, status: 'unavailable' };
        continue;
      }

      const slots = generateTimeSlots(avail.start_time, avail.end_time, duration, 30);
      days[dateStr] = {
        slotCount: slots.length,
        status: slots.length > 0 ? 'available' : 'unavailable',
      };
    }
    return NextResponse.json({ days });
  }

  // --- Production mode ---
  const supabase = createAdminClient();

  const [availResult, blockedResult, bookingsResult] = await Promise.all([
    supabase.from('availability').select('*'),
    supabase.from('blocked_dates').select('date').gte('date', monthStart).lte('date', monthEnd),
    supabase
      .from('bookings')
      .select('appointment_date, appointment_start_time, appointment_end_time')
      .gte('appointment_date', monthStart)
      .lte('appointment_date', monthEnd)
      .in('status', ['pending_deposit', 'deposit_paid', 'confirmed', 'consultation_booked']),
  ]);

  // Fetch Google Calendar busy times for the entire month (single API call)
  let calendarBusyByDate = new Map<string, Array<{ start: string; end: string }>>();
  try {
    calendarBusyByDate = await getCalendarBusyTimesRange(monthStart, monthEnd);
  } catch {
    // Calendar not configured or error — continue without
  }

  // Build lookup maps
  const availMap = new Map<number, { start_time: string; end_time: string; is_working: boolean }>();
  for (const row of availResult.data || []) {
    availMap.set(row.day_of_week, row);
  }

  const blockedSet = new Set<string>();
  for (const row of blockedResult.data || []) {
    // Supabase date columns may return as 'YYYY-MM-DD' or with time info — normalize
    const dateStr = typeof row.date === 'string' ? row.date.split('T')[0] : row.date;
    blockedSet.add(dateStr);
  }

  const bookingsByDate = new Map<string, Array<{ start: string; end: string }>>();
  for (const row of bookingsResult.data || []) {
    if (!row.appointment_date || !row.appointment_start_time || !row.appointment_end_time) continue;
    const dateStr = typeof row.appointment_date === 'string' ? row.appointment_date.split('T')[0] : row.appointment_date;
    const list = bookingsByDate.get(dateStr) || [];
    list.push({ start: row.appointment_start_time, end: row.appointment_end_time });
    bookingsByDate.set(dateStr, list);
  }

  // Compute per-day availability
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, monthIndex, d);
    const dateStr = toDateString(date);

    if (dateStr < todayStr || dateStr > maxDateStr) {
      days[dateStr] = { slotCount: 0, status: 'unavailable' };
      continue;
    }

    const avail = availMap.get(date.getDay());
    if (!avail || !avail.is_working || blockedSet.has(dateStr)) {
      days[dateStr] = { slotCount: 0, status: 'unavailable' };
      continue;
    }

    const allSlots = generateTimeSlots(avail.start_time, avail.end_time, duration, 30);
    const dayBookings = bookingsByDate.get(dateStr) || [];
    const dayCalendarBusy = calendarBusyByDate.get(dateStr) || [];

    const availableSlots = allSlots.filter((slot) => {
      const hasBookingConflict = dayBookings.some(
        (b) => slot.start < b.end && slot.end > b.start
      );
      if (hasBookingConflict) return false;

      const hasCalendarConflict = dayCalendarBusy.some(
        (b) => slot.start < b.end && slot.end > b.start
      );
      if (hasCalendarConflict) return false;

      return true;
    });

    const count = availableSlots.length;
    days[dateStr] = {
      slotCount: count,
      status: count > 0 ? 'available' : 'unavailable',
    };
  }

  return NextResponse.json({ days });
}
