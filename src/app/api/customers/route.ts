import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { IS_PROTOTYPE } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  // Prototype mode: return empty
  if (IS_PROTOTYPE) {
    if (email) return NextResponse.json({ customer: null });
    return NextResponse.json({ customers: [] });
  }

  const supabase = createAdminClient();

  if (email) {
    // Lookup single customer by email (used for auto-fill)
    const { data: bookings } = await supabase
      .from('bookings')
      .select('customer_name, customer_email, customer_phone')
      .eq('customer_email', email)
      .order('created_at', { ascending: false })
      .limit(1);

    if (bookings && bookings.length > 0) {
      return NextResponse.json({ customer: bookings[0] });
    }
    return NextResponse.json({ customer: null });
  }

  // List all unique customers with booking counts
  const { data: bookings } = await supabase
    .from('bookings')
    .select('customer_name, customer_email, customer_phone, created_at, status, deposit_paid, total_price')
    .order('created_at', { ascending: false });

  if (!bookings) {
    return NextResponse.json({ customers: [] });
  }

  // Group by email
  const customerMap = new Map<string, {
    customer_name: string;
    customer_email: string;
    customer_phone: string | null;
    booking_count: number;
    total_spent: number;
    last_booking: string;
  }>();

  for (const b of bookings) {
    const existing = customerMap.get(b.customer_email);
    if (existing) {
      existing.booking_count += 1;
      existing.total_spent += b.deposit_paid && b.total_price ? b.total_price : 0;
    } else {
      customerMap.set(b.customer_email, {
        customer_name: b.customer_name,
        customer_email: b.customer_email,
        customer_phone: b.customer_phone,
        booking_count: 1,
        total_spent: b.deposit_paid && b.total_price ? b.total_price : 0,
        last_booking: b.created_at,
      });
    }
  }

  return NextResponse.json({ customers: Array.from(customerMap.values()) });
}
