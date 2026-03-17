import { createAdminClient } from '@/lib/supabase/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLOURS } from '@/lib/utils/constants';
import { formatDate } from '@/lib/utils/date-helpers';
import { formatPriceShort } from '@/lib/utils/pricing';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CustomerEditForm } from './customer-edit-form';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ email: string }>;
}

export default async function CustomerDetailPage({ params }: Props) {
  const { email } = await params;
  const decodedEmail = decodeURIComponent(email);
  const supabase = createAdminClient();

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('customer_email', decodedEmail)
    .order('created_at', { ascending: false });

  if (!bookings || bookings.length === 0) notFound();

  const customer = bookings[0];
  const totalSpent = bookings.reduce(
    (sum, b) => sum + (b.deposit_paid && b.total_price ? b.total_price : 0),
    0
  );
  const totalDeposits = bookings.reduce(
    (sum, b) => sum + (b.deposit_paid && b.deposit_amount ? b.deposit_amount : 0),
    0
  );

  // Extract customer notes from the latest booking's artist_notes (if prefixed)
  const customerNotes = customer.artist_notes?.startsWith('[Customer Note] ')
    ? customer.artist_notes.replace('[Customer Note] ', '')
    : null;

  return (
    <div>
      <Link href="/admin/customers" className="text-sm text-zinc-500 hover:text-black">&larr; Back to customers</Link>

      <div className="mt-4">
        <h1 className="text-2xl font-bold">{customer.customer_name}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {decodedEmail}{customer.customer_phone && ` · ${customer.customer_phone}`}
        </p>
      </div>

      {/* Customer notes */}
      {customerNotes && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-600">Internal Notes</p>
          <p className="mt-1 text-sm text-amber-800">{customerNotes}</p>
        </div>
      )}

      {/* Edit / Delete */}
      <CustomerEditForm
        email={decodedEmail}
        currentName={customer.customer_name}
        currentPhone={customer.customer_phone}
        currentNotes={customerNotes}
        bookingCount={bookings.length}
      />

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-zinc-500">Total Bookings</p>
            <p className="mt-1 text-2xl font-bold">{bookings.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-zinc-500">Total Value</p>
            <p className="mt-1 text-2xl font-bold">{formatPriceShort(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-zinc-500">Deposits Paid</p>
            <p className="mt-1 text-2xl font-bold">{formatPriceShort(totalDeposits)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Booking history */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold">Booking History</h2>
        <Card className="mt-3">
          <div className="divide-y divide-zinc-100">
            {bookings.map((b) => (
              <Link
                key={b.id}
                href={`/admin/bookings/${b.id}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-zinc-50"
              >
                <div>
                  <p className="text-sm capitalize">
                    {b.booking_type.replace('_', ' ')}
                    {b.size_category && ` — ${b.size_category}`}
                    {b.style && ` — ${b.style}`}
                  </p>
                  <p className="text-xs text-zinc-400">{formatDate(b.created_at)}</p>
                  {b.description && (
                    <p className="mt-1 text-xs text-zinc-500 truncate max-w-md">
                      {b.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {b.total_price && (
                    <span className="text-sm text-zinc-500">{formatPriceShort(b.total_price)}</span>
                  )}
                  <Badge className={BOOKING_STATUS_COLOURS[b.status]}>
                    {BOOKING_STATUS_LABELS[b.status]}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
