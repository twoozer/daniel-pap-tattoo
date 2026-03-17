import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { IS_PROTOTYPE } from '@/lib/mock-data';
import { sendNewMessageNotification } from '@/lib/email/send';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get('booking_id');

  if (!bookingId) {
    return NextResponse.json({ error: 'booking_id is required' }, { status: 400 });
  }

  if (IS_PROTOTYPE) {
    return NextResponse.json({ messages: [] });
  }

  const supabase = createAdminClient();
  const token = searchParams.get('token');

  // If token provided, verify it matches the booking (customer access)
  if (token) {
    const { data: booking } = await supabase
      .from('bookings')
      .select('id')
      .eq('id', bookingId)
      .eq('access_token', token)
      .single();

    if (!booking) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  }

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at');

  return NextResponse.json({ messages: messages || [] });
}

export async function POST(request: NextRequest) {
  if (IS_PROTOTYPE) {
    return NextResponse.json({ error: 'Connect Supabase to send messages' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { booking_id, sender_type, sender_name, body: messageBody, token, image_path } = body;

    if (!booking_id || !sender_type || !sender_name || (!messageBody && !image_path)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify customer access if token is provided
    if (sender_type === 'customer' && token) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('id')
        .eq('id', booking_id)
        .eq('access_token', token)
        .single();

      if (!booking) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        booking_id,
        sender_type,
        sender_name,
        body: messageBody || '',
        image_path: image_path || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send email notification to the other party (non-blocking)
    try {
      const { data: booking } = await supabase
        .from('bookings')
        .select('customer_name, customer_email, access_token')
        .eq('id', booking_id)
        .single();

      if (booking) {
        const preview = messageBody
          ? messageBody.substring(0, 200)
          : image_path
            ? '[Image attached]'
            : '';

        if (sender_type === 'artist') {
          // Artist sent a message → notify the customer
          sendNewMessageNotification({
            recipientEmail: booking.customer_email,
            recipientName: booking.customer_name,
            senderName: 'Daniel',
            messagePreview: preview,
            bookingId: booking_id,
            accessToken: booking.access_token,
            isAdmin: false,
          }).catch(() => {});
        } else {
          // Customer sent a message → notify the admin
          const adminEmail = process.env.ADMIN_EMAIL || 'info@danielpaptattoo.com';
          sendNewMessageNotification({
            recipientEmail: adminEmail,
            recipientName: 'Daniel',
            senderName: booking.customer_name,
            messagePreview: preview,
            bookingId: booking_id,
            isAdmin: true,
          }).catch(() => {});
        }
      }
    } catch {
      // Email notification failure should not break messaging
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
