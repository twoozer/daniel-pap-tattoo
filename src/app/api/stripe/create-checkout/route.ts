import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatPrice } from '@/lib/utils/pricing';

export async function POST(request: NextRequest) {
  try {
    const { booking_id } = await request.json();

    if (!booking_id) {
      return NextResponse.json({ error: 'booking_id is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (!booking.deposit_amount) {
      return NextResponse.json({ error: 'No deposit amount set' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: `Tattoo Deposit — ${booking.size_category || 'Custom'}`,
              description: `20% deposit (${formatPrice(booking.total_price)}) for your tattoo booking`,
            },
            unit_amount: booking.deposit_amount,
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

    await supabase
      .from('bookings')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', booking.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
