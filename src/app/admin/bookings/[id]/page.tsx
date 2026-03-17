import { createAdminClient } from '@/lib/supabase/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLOURS } from '@/lib/utils/constants';
import { formatDate, formatTime } from '@/lib/utils/date-helpers';
import { formatPriceShort } from '@/lib/utils/pricing';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookingActions } from './booking-actions';
import { FlashDesignCard } from './flash-design-card';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (!booking) notFound();

  // Fetch flash design details if linked
  let flashDesign = null;
  if (booking.flash_design_id) {
    const { data } = await supabase
      .from('flash_designs')
      .select('id, title, description, style, image_path, suggested_size')
      .eq('id', booking.flash_design_id)
      .single();
    flashDesign = data;
  }

  // Get customer history
  const { data: customerBookings } = await supabase
    .from('bookings')
    .select('id, created_at, booking_type, size_category, status, total_price')
    .eq('customer_email', booking.customer_email)
    .neq('id', booking.id)
    .order('created_at', { ascending: false });

  // Get messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('booking_id', booking.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/bookings" className="text-sm text-zinc-500 hover:text-black">&larr; Back to bookings</Link>
          <h1 className="mt-2 text-2xl font-bold">{booking.customer_name}</h1>
          <p className="mt-1 text-sm text-zinc-500">{booking.customer_email}{booking.customer_phone && ` · ${booking.customer_phone}`}</p>
        </div>
        <Badge className={`text-sm ${BOOKING_STATUS_COLOURS[booking.status]}`}>
          {BOOKING_STATUS_LABELS[booking.status]}
        </Badge>
      </div>

      {/* Flash design reference */}
      {flashDesign && <FlashDesignCard flashDesign={flashDesign} />}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Booking details */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Type</dt>
                <dd className="capitalize">{booking.booking_type.replace('_', ' ')}</dd>
              </div>
              {booking.size_category && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Size</dt>
                  <dd className="capitalize">{booking.size_category}</dd>
                </div>
              )}
              {booking.body_placement && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Placement</dt>
                  <dd>{booking.body_placement}</dd>
                </div>
              )}
              {booking.style && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Style</dt>
                  <dd className="capitalize">{booking.style.replace('-', ' ')}</dd>
                </div>
              )}
              {booking.description && (
                <div>
                  <dt className="text-zinc-500">Description</dt>
                  <dd className="mt-1 text-zinc-800">{booking.description}</dd>
                </div>
              )}
              {booking.consultation_notes && (
                <div>
                  <dt className="text-zinc-500">Consultation Notes</dt>
                  <dd className="mt-1 text-zinc-800">{booking.consultation_notes}</dd>
                </div>
              )}
              {booking.artist_notes && (
                <div>
                  <dt className="text-zinc-500">Artist Notes (internal)</dt>
                  <dd className="mt-1 italic text-zinc-600">{booking.artist_notes}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Appointment & payment */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment & Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              {booking.appointment_date && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Date</dt>
                  <dd>{formatDate(booking.appointment_date)}</dd>
                </div>
              )}
              {booking.appointment_start_time && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Time</dt>
                  <dd>
                    {formatTime(booking.appointment_start_time)}
                    {booking.appointment_end_time && ` — ${formatTime(booking.appointment_end_time)}`}
                  </dd>
                </div>
              )}
              {booking.total_price && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Total Price</dt>
                  <dd className="font-semibold">{formatPriceShort(booking.total_price)}</dd>
                </div>
              )}
              {booking.deposit_amount && (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">Deposit</dt>
                  <dd>
                    {formatPriceShort(booking.deposit_amount)}{' '}
                    {booking.deposit_paid ? (
                      <span className="text-green-600">Paid</span>
                    ) : (
                      <span className="text-yellow-600">Unpaid</span>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <BookingActions
        bookingId={booking.id}
        currentStatus={booking.status}
        booking={{
          artist_notes: booking.artist_notes,
          body_placement: booking.body_placement,
          style: booking.style,
          description: booking.description,
          appointment_date: booking.appointment_date,
          appointment_start_time: booking.appointment_start_time,
          total_price: booking.total_price,
          size_category: booking.size_category,
        }}
      />

      {/* Customer history */}
      {customerBookings && customerBookings.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Customer History ({customerBookings.length} previous booking{customerBookings.length !== 1 ? 's' : ''})</h2>
          <Card className="mt-3">
            <div className="divide-y divide-zinc-100">
              {customerBookings.map((b) => (
                <Link key={b.id} href={`/admin/bookings/${b.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-zinc-50">
                  <div>
                    <p className="text-sm capitalize">{b.booking_type.replace('_', ' ')}{b.size_category && ` — ${b.size_category}`}</p>
                    <p className="text-xs text-zinc-400">{formatDate(b.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {b.total_price && <span className="text-sm text-zinc-500">{formatPriceShort(b.total_price)}</span>}
                    <Badge className={BOOKING_STATUS_COLOURS[b.status]}>{BOOKING_STATUS_LABELS[b.status]}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Recent messages */}
      {messages && messages.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Messages</h2>
            <Link href={`/admin/messages/${booking.id}`} className="text-sm text-zinc-500 hover:text-black">View all</Link>
          </div>
          <Card className="mt-3">
            <div className="divide-y divide-zinc-100">
              {messages.map((msg) => (
                <div key={msg.id} className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${msg.sender_type === 'artist' ? 'text-blue-600' : 'text-zinc-700'}`}>{msg.sender_name}</span>
                    <span className="text-xs text-zinc-400">{new Date(msg.created_at).toLocaleString('en-GB')}</span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">{msg.body}</p>
                  {msg.image_path && (
                    <p className="mt-1 text-xs text-blue-500">Image attached</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
