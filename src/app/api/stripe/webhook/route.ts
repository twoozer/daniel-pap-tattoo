import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendBookingConfirmation } from '@/lib/email/send';
import { createCalendarEvent } from '@/lib/google-calendar/client';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;

    if (bookingId) {
      const supabase = createAdminClient();

      // Update booking status to deposit_paid
      const { data: booking } = await supabase
        .from('bookings')
        .update({
          status: 'deposit_paid',
          deposit_paid: true,
          stripe_payment_intent_id: session.payment_intent as string,
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (booking) {
        const promises: Promise<unknown>[] = [];

        // Send booking confirmation email with iCal calendar invite
        promises.push(
          sendBookingConfirmation(booking).then((sent) => {
            console.log('[WEBHOOK] Confirmation email sent:', sent);
          }).catch((err) => {
            console.error('[WEBHOOK] Failed to send booking confirmation:', err);
          })
        );

        // Create Google Calendar event
        if (booking.appointment_date && booking.appointment_start_time && booking.appointment_end_time) {
          promises.push(
            createCalendarEvent({
              summary: `Tattoo: ${booking.customer_name}${booking.size_category ? ` (${booking.size_category})` : ''}`,
              description: booking.description || undefined,
              date: booking.appointment_date,
              startTime: booking.appointment_start_time,
              endTime: booking.appointment_end_time,
              customerName: booking.customer_name,
              customerEmail: booking.customer_email,
              customerPhone: booking.customer_phone,
            }).then(async (eventId) => {
              console.log('[WEBHOOK] Calendar event created:', eventId);
              if (eventId) {
                await supabase
                  .from('bookings')
                  .update({ google_calendar_event_id: eventId })
                  .eq('id', booking.id);
              }
            }).catch((err) => {
              console.error('[WEBHOOK] Failed to create calendar event:', err);
            })
          );
        }

        // Wait for all async tasks before returning response
        await Promise.all(promises);
        console.log(`[WEBHOOK] Deposit paid for booking ${bookingId} — all tasks completed`);
      }
    }
  }

  return NextResponse.json({ received: true });
}
