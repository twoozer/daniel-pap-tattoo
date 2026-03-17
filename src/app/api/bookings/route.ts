import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createBookingSchema } from '@/lib/validators/booking';
import { getStripe } from '@/lib/stripe/client';
import { calculateDeposit, formatPrice } from '@/lib/utils/pricing';
import { DEPOSIT_PERCENT, CONSULTATION_DURATION_MINUTES } from '@/lib/utils/constants';
import { IS_PROTOTYPE, MOCK_PRICE_TIERS } from '@/lib/mock-data';
import { sendBookingConfirmation, sendAdminNewBookingNotification } from '@/lib/email/send';
import { createCalendarEvent } from '@/lib/google-calendar/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const data = parsed.data;

    // Look up price tier if size_category provided
    let totalPrice: number | null = null;
    let depositAmount: number | null = null;
    let estimatedHours: number | null = null;

    if (data.size_category && data.size_category !== 'custom') {
      if (IS_PROTOTYPE) {
        const tier = MOCK_PRICE_TIERS.find((t) => t.size_category === data.size_category);
        if (tier?.price_pence) {
          totalPrice = tier.price_pence;
          depositAmount = calculateDeposit(tier.price_pence, DEPOSIT_PERCENT);
          estimatedHours = tier.estimated_hours;
        }
      } else {
        const supabase = createAdminClient();
        const { data: tier } = await supabase
          .from('price_tiers')
          .select('*')
          .eq('size_category', data.size_category)
          .single();

        if (tier?.price_pence) {
          totalPrice = tier.price_pence;
          depositAmount = calculateDeposit(tier.price_pence, DEPOSIT_PERCENT);
          estimatedHours = tier.estimated_hours;
        }
      }
    }

    // Calculate end time for consultation
    let endTime = data.appointment_end_time;
    if (data.booking_type === 'consultation' && data.appointment_start_time && !endTime) {
      const [h, m] = data.appointment_start_time.split(':').map(Number);
      const totalMins = h * 60 + m + CONSULTATION_DURATION_MINUTES;
      const endH = Math.floor(totalMins / 60);
      const endM = totalMins % 60;
      endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
    }

    // Determine initial status
    let status: string;
    if (data.booking_type === 'consultation') {
      status = 'consultation_booked';
    } else if (data.booking_type === 'custom_quote' || data.size_category === 'custom') {
      status = 'custom_quote_pending';
    } else {
      status = 'pending_deposit';
    }

    // --- Prototype mode: return mock booking without DB or Stripe ---
    if (IS_PROTOTYPE) {
      const mockId = `mock-${Date.now()}`;
      const mockToken = `token-${Math.random().toString(36).slice(2, 10)}`;
      const mockBooking = {
        id: mockId,
        access_token: mockToken,
        booking_type: data.booking_type,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        status,
        total_price: totalPrice,
        deposit_amount: depositAmount,
        appointment_date: data.appointment_date || null,
        appointment_start_time: data.appointment_start_time || null,
      };

      // In prototype mode, skip Stripe — go straight to confirmation
      return NextResponse.json({ booking: mockBooking });
    }

    // --- Production mode ---
    const supabase = createAdminClient();

    // Insert booking
    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        booking_type: data.booking_type,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone || null,
        size_category: data.size_category || null,
        body_placement: data.body_placement || null,
        style: data.style || null,
        description: data.description || null,
        flash_design_id: data.flash_design_id || null,
        reference_images: data.reference_images || [],
        appointment_date: data.appointment_date || null,
        appointment_start_time: data.appointment_start_time || null,
        appointment_end_time: endTime || null,
        estimated_duration_hrs: estimatedHours,
        total_price: totalPrice,
        deposit_amount: depositAmount,
        status,
        consultation_notes: data.consultation_notes || null,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Log booking data for debugging
    console.log('[BOOKING] Created booking:', {
      id: booking.id,
      status,
      type: booking.booking_type,
      date: booking.appointment_date,
      startTime: booking.appointment_start_time,
      endTime: booking.appointment_end_time,
    });

    // Send email notifications — must await on Vercel (serverless functions terminate after response)
    const emailPromises: Promise<unknown>[] = [];

    emailPromises.push(
      sendAdminNewBookingNotification(booking).then((sent) => {
        console.log('[BOOKING] Admin notification sent:', sent);
      }).catch((err) => {
        console.error('[BOOKING] Failed to send admin notification:', err);
      })
    );

    if (status !== 'pending_deposit') {
      emailPromises.push(
        sendBookingConfirmation(booking).then((sent) => {
          console.log('[BOOKING] Confirmation email sent:', sent);
        }).catch((err) => {
          console.error('[BOOKING] Failed to send confirmation:', err);
        })
      );
    } else {
      console.log('[BOOKING] Skipping confirmation email — pending_deposit, will send after Stripe payment');
    }

    // Create Google Calendar event for non-deposit bookings with an appointment
    if (status !== 'pending_deposit' && booking.appointment_date && booking.appointment_start_time && booking.appointment_end_time) {
      const isConsultation = data.booking_type === 'consultation';
      emailPromises.push(
        createCalendarEvent({
          summary: isConsultation
            ? `Consultation: ${data.customer_name}`
            : `Tattoo: ${data.customer_name}${data.size_category ? ` (${data.size_category})` : ''}`,
          description: data.description || undefined,
          date: booking.appointment_date,
          startTime: booking.appointment_start_time,
          endTime: booking.appointment_end_time,
          customerName: data.customer_name,
          customerEmail: data.customer_email,
          customerPhone: data.customer_phone,
        }).then(async (eventId) => {
          console.log('[BOOKING] Calendar event created:', eventId);
          if (eventId) {
            await supabase
              .from('bookings')
              .update({ google_calendar_event_id: eventId })
              .eq('id', booking.id);
          }
        }).catch((err) => {
          console.error('[BOOKING] Failed to create calendar event:', err);
        })
      );
    }

    // Wait for all emails and calendar to complete before returning
    await Promise.all(emailPromises);
    console.log('[BOOKING] All async tasks completed');

    // If standard booking with deposit, create Stripe Checkout session
    if (status === 'pending_deposit' && depositAmount) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      const session = await getStripe().checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'aud',
              product_data: {
                name: `Tattoo Deposit — ${data.size_category} (${formatPrice(totalPrice!)})`,
                description: `20% deposit for your ${data.size_category} tattoo booking`,
              },
              unit_amount: depositAmount,
            },
            quantity: 1,
          },
        ],
        metadata: {
          booking_id: booking.id,
        },
        success_url: `${appUrl}/book/confirmation?id=${booking.id}&token=${booking.access_token}&status=paid`,
        cancel_url: `${appUrl}/book/checkout`,
      });

      // Save Stripe session ID
      await supabase
        .from('bookings')
        .update({ stripe_checkout_session_id: session.id })
        .eq('id', booking.id);

      return NextResponse.json({ checkout_url: session.url, booking });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error('Create booking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // --- Prototype mode ---
  if (IS_PROTOTYPE) {
    return NextResponse.json({ bookings: [] });
  }

  const supabase = createAdminClient();

  // Single booking lookup by access token
  const token = searchParams.get('token');
  const id = searchParams.get('id');
  if (id && token) {
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .eq('access_token', token)
      .single();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    return NextResponse.json({ booking });
  }

  // Admin: list all bookings (requires auth, handled by middleware)
  const status = searchParams.get('status');
  let query = supabase.from('bookings').select('*').order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data: bookings } = await query;
  return NextResponse.json({ bookings: bookings || [] });
}
