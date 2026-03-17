import { createAdminClient } from '@/lib/supabase/admin';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLOURS } from '@/lib/utils/constants';
import { formatDate, formatTime } from '@/lib/utils/date-helpers';
import { formatPriceShort } from '@/lib/utils/pricing';
import Link from 'next/link';
import { IS_PROTOTYPE } from '@/lib/mock-data';
import { Booking, BookingStatus } from '@/types/booking';

export const dynamic = 'force-dynamic';

export default async function BookingsPage() {
  let bookings: Booking[] = [];

  if (!IS_PROTOTYPE) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    bookings = (data || []) as Booking[];
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Bookings</h1>
      <p className="mt-1 text-sm text-zinc-500">All customer bookings</p>

      {IS_PROTOTYPE && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <strong>Prototype mode</strong> — Bookings will appear here once customers start booking through the flow and Supabase is connected.
        </div>
      )}

      <Card className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left">
                <th className="px-6 py-3 font-medium text-zinc-500">Customer</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Type</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Size</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Date</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Price</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-400">
                    No bookings yet
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-zinc-50">
                    <td className="px-6 py-3">
                      <Link href={`/admin/bookings/${booking.id}`} className="font-medium hover:underline">
                        {booking.customer_name}
                      </Link>
                      <p className="text-xs text-zinc-400">{booking.customer_email}</p>
                    </td>
                    <td className="px-6 py-3 capitalize">{booking.booking_type.replace('_', ' ')}</td>
                    <td className="px-6 py-3 capitalize">{booking.size_category || '—'}</td>
                    <td className="px-6 py-3">
                      {booking.appointment_date ? (
                        <>
                          {formatDate(booking.appointment_date)}
                          {booking.appointment_start_time && (
                            <span className="text-zinc-400"> {formatTime(booking.appointment_start_time)}</span>
                          )}
                        </>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-3">
                      {booking.total_price ? formatPriceShort(booking.total_price) : '—'}
                    </td>
                    <td className="px-6 py-3">
                      <Badge className={BOOKING_STATUS_COLOURS[booking.status]}>
                        {BOOKING_STATUS_LABELS[booking.status]}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
