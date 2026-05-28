import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { deleteCalendarEvent } from '@/lib/google-calendar/client';
import { VALID_BOOKING_STATUSES } from '@/lib/utils/constants';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    // Validate status is a known value
    if (!VALID_BOOKING_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get current booking to check for calendar event
    const { data: booking } = await supabase
      .from('bookings')
      .select('google_calendar_event_id, status')
      .eq('id', id)
      .single();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Update the status
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If cancelling and there's a calendar event, delete it
    if ((status === 'cancelled' || status === 'no_show') && booking.google_calendar_event_id) {
      deleteCalendarEvent(booking.google_calendar_event_id).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Update booking status error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
