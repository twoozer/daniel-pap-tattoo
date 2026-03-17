import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Admin API for customer management.
 * PATCH: Update customer details (name, phone, notes) across all their bookings.
 * DELETE: Delete a customer and all their bookings + messages.
 */

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, customer_name, customer_phone, customer_notes } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Update the customer name and phone across ALL their bookings
    const updateData: Record<string, string | null> = {};
    if (customer_name !== undefined) updateData.customer_name = customer_name;
    if (customer_phone !== undefined) updateData.customer_phone = customer_phone;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('customer_email', email);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    // Store customer notes in a dedicated field on their most recent booking
    // (or we use artist_notes on the most recent booking as a customer-level note)
    if (customer_notes !== undefined) {
      // We store customer-level notes in a special way:
      // Update the artist_notes on the latest booking with a prefix
      const { data: latestBooking } = await supabase
        .from('bookings')
        .select('id')
        .eq('customer_email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestBooking) {
        // Store notes prefixed so they're identifiable
        const notesValue = customer_notes
          ? `[Customer Note] ${customer_notes}`
          : null;

        await supabase
          .from('bookings')
          .update({ artist_notes: notesValue })
          .eq('id', latestBooking.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Customer update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // First, get all booking IDs for this customer
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('customer_email', email);

    if (bookings && bookings.length > 0) {
      const bookingIds = bookings.map(b => b.id);

      // Delete all messages for these bookings
      await supabase
        .from('messages')
        .delete()
        .in('booking_id', bookingIds);

      // Delete all bookings
      await supabase
        .from('bookings')
        .delete()
        .eq('customer_email', email);
    }

    return NextResponse.json({ success: true, deleted: bookings?.length || 0 });
  } catch (error) {
    console.error('Customer delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
