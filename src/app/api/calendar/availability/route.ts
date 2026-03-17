import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateTimeSlots } from '@/lib/utils/date-helpers';
import { IS_PROTOTYPE, getMockAvailabilityForDay } from '@/lib/mock-data';
import { getCalendarBusyTimes } from '@/lib/google-calendar/client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const duration = parseFloat(searchParams.get('duration') || '1');

  if (!date) {
    return NextResponse.json({ error: 'date is required' }, { status: 400 });
  }

  const dayOfWeek = new Date(date + 'T00:00:00').getDay();

  // --- Prototype mode: use mock availability, no DB ---
  if (IS_PROTOTYPE) {
    const mockAvail = getMockAvailabilityForDay(dayOfWeek);
    if (!mockAvail || !mockAvail.is_working) {
      return NextResponse.json({ slots: [] });
    }
    const slots = generateTimeSlots(mockAvail.start_time, mockAvail.end_time, duration, 30);
    return NextResponse.json({ slots });
  }

  // --- Production mode: query Supabase ---
  const supabase = createAdminClient();

  // Check if this day of week is a working day
  const { data: availability } = await supabase
    .from('availability')
    .select('*')
    .eq('day_of_week', dayOfWeek)
    .single();

  if (!availability || !availability.is_working) {
    return NextResponse.json({ slots: [] });
  }

  // Check if this date is blocked
  const { data: blocked } = await supabase
    .from('blocked_dates')
    .select('id')
    .eq('date', date)
    .single();

  if (blocked) {
    return NextResponse.json({ slots: [] });
  }

  // Get existing bookings for this date
  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('appointment_start_time, appointment_end_time')
    .eq('appointment_date', date)
    .in('status', ['pending_deposit', 'deposit_paid', 'confirmed', 'consultation_booked']);

  // Generate all possible slots
  const allSlots = generateTimeSlots(
    availability.start_time,
    availability.end_time,
    duration,
    30
  );

  // Get Google Calendar busy times (non-blocking, graceful fallback)
  let calendarBusyTimes: Array<{ start: string; end: string }> = [];
  try {
    calendarBusyTimes = await getCalendarBusyTimes(date);
  } catch {
    // Calendar not configured or error — continue without
  }

  // Filter out slots that overlap with existing bookings OR Google Calendar busy times
  const availableSlots = allSlots.filter((slot) => {
    // Check against DB bookings
    if (existingBookings) {
      const hasBookingConflict = existingBookings.some((booking) => {
        if (!booking.appointment_start_time || !booking.appointment_end_time) return false;
        return slot.start < booking.appointment_end_time && slot.end > booking.appointment_start_time;
      });
      if (hasBookingConflict) return false;
    }

    // Check against Google Calendar busy times
    if (calendarBusyTimes.length > 0) {
      const hasCalendarConflict = calendarBusyTimes.some((busy) => {
        return slot.start < busy.end && slot.end > busy.start;
      });
      if (hasCalendarConflict) return false;
    }

    return true;
  });

  return NextResponse.json({ slots: availableSlots });
}
