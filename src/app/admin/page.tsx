import { createAdminClient } from '@/lib/supabase/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLOURS } from '@/lib/utils/constants';
import { formatPriceShort } from '@/lib/utils/pricing';
import { CalendarDays, MessageSquare, DollarSign, Clock } from 'lucide-react';
import Link from 'next/link';
import { IS_PROTOTYPE } from '@/lib/mock-data';
import { Booking, BookingStatus } from '@/types/booking';

export const dynamic = 'force-dynamic';

type DashboardBooking = Pick<Booking, 'id' | 'customer_name' | 'customer_email' | 'appointment_date' | 'appointment_start_time' | 'size_category' | 'style' | 'status' | 'description' | 'deposit_amount'>;

export default async function AdminDashboard() {
  let upcomingBookings: DashboardBooking[] = [];
  let pendingQuotes: DashboardBooking[] = [];
  let totalDeposits = 0;
  let unreadCount = 0;

  if (!IS_PROTOTYPE) {
    const supabase = createAdminClient();
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [
      { data: upcoming },
      { data: pending },
      { data: allBookings },
      { data: unreadMessages },
    ] = await Promise.all([
      supabase
        .from('bookings')
        .select('*')
        .gte('appointment_date', today)
        .lte('appointment_date', nextWeek)
        .not('status', 'in', '("cancelled","no_show")')
        .order('appointment_date', { ascending: true }),
      supabase
        .from('bookings')
        .select('*')
        .eq('status', 'custom_quote_pending')
        .order('created_at', { ascending: false }),
      supabase
        .from('bookings')
        .select('deposit_amount, deposit_paid')
        .eq('deposit_paid', true),
      supabase
        .from('messages')
        .select('id')
        .is('read_at', null)
        .eq('sender_type', 'customer'),
    ]);

    upcomingBookings = (upcoming || []) as DashboardBooking[];
    pendingQuotes = (pending || []) as DashboardBooking[];
    totalDeposits = (allBookings || []).reduce(
      (sum: number, b: { deposit_amount: number | null }) => sum + (b.deposit_amount || 0),
      0
    );
    unreadCount = unreadMessages?.length || 0;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-zinc-500">Welcome back. Here&apos;s what&apos;s happening.</p>

      {IS_PROTOTYPE && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <strong>Prototype mode</strong> — Connect Supabase to see real data here.
          The customer-facing booking flow is fully functional for preview.
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <CalendarDays className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingBookings.length}</p>
                <p className="text-xs text-zinc-500">Upcoming this week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingQuotes.length}</p>
                <p className="text-xs text-zinc-500">Pending quotes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                <MessageSquare className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-xs text-zinc-500">Unread messages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatPriceShort(totalDeposits)}</p>
                <p className="text-xs text-zinc-500">Total deposits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming bookings */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upcoming Bookings</h2>
          <Link href="/admin/bookings" className="text-sm text-zinc-500 hover:text-black">
            View all
          </Link>
        </div>

        {upcomingBookings.length === 0 ? (
          <Card className="mt-4">
            <CardContent>
              <p className="text-center text-sm text-zinc-400 py-8">
                No upcoming bookings this week.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 space-y-3">
            {upcomingBookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/admin/bookings/${booking.id}`}
                className="block rounded-lg border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{booking.customer_name}</p>
                    <p className="text-sm text-zinc-500">
                      {booking.appointment_date} at {booking.appointment_start_time?.slice(0, 5)}
                      {booking.size_category && ` · ${booking.size_category}`}
                      {booking.style && ` · ${booking.style}`}
                    </p>
                  </div>
                  <Badge className={BOOKING_STATUS_COLOURS[booking.status] || ''}>
                    {BOOKING_STATUS_LABELS[booking.status] || booking.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Pending quotes */}
      {pendingQuotes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Pending Custom Quotes</h2>
          <div className="mt-4 space-y-3">
            {pendingQuotes.map((booking) => (
              <Link
                key={booking.id}
                href={`/admin/bookings/${booking.id}`}
                className="block rounded-lg border border-dashed border-purple-300 bg-purple-50 p-4 transition-shadow hover:shadow-sm"
              >
                <p className="font-medium">{booking.customer_name}</p>
                <p className="text-sm text-zinc-600">
                  {booking.description?.slice(0, 100)}
                  {(booking.description?.length || 0) > 100 ? '...' : ''}
                </p>
                <p className="mt-1 text-xs text-zinc-400">{booking.customer_email}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
