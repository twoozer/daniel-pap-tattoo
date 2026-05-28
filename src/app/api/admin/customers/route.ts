import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Admin API for customer management.
 * PATCH: Update customer details (name, phone, notes) across all their bookings.
 * DELETE: Soft-delete — cancels all active bookings for the customer.
 */

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, customer_name, customer_phone, customer_notes } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Update customer details across ALL their bookings
    const updateData: Record<string, string | null> = {};
    if (customer_name !== undefined) updateData.customer_name = customer_name;
    if (customer_phone !== undefined) updateData.customer_phone = customer_phone;
    if (customer_notes !== undefined) updateData.customer_notes = customer_notes || null;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('customer_email', email);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
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

    // Soft-delete: cancel all active bookings instead of destroying data
    const activeStatuses = ['pending_deposit', 'deposit_paid', 'confirmed', 'consultation_booked', 'custom_quote_pending'];

    const { data: bookings, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('customer_email', email)
      .in('status', activeStatuses)
      .select('id');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, cancelled: bookings?.length || 0 });
  } catch (error) {
    console.error('Customer delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
