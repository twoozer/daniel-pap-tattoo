import { createAdminClient } from '@/lib/supabase/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/date-helpers';
import { formatPriceShort } from '@/lib/utils/pricing';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDepositsPage() {
  const supabase = createAdminClient();

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, customer_name, customer_email, deposit_amount, deposit_paid, total_price, created_at, status')
    .not('deposit_amount', 'is', null)
    .order('created_at', { ascending: false });

  const totalCollected = (bookings || [])
    .filter((b) => b.deposit_paid)
    .reduce((sum, b) => sum + (b.deposit_amount || 0), 0);

  const totalPending = (bookings || [])
    .filter((b) => !b.deposit_paid && b.status !== 'cancelled')
    .reduce((sum, b) => sum + (b.deposit_amount || 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold">Deposits</h1>
      <p className="mt-1 text-sm text-zinc-500">Track all deposit payments</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-zinc-500">Total Collected</p>
            <p className="mt-1 text-3xl font-bold text-green-600">{formatPriceShort(totalCollected)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-zinc-500">Pending</p>
            <p className="mt-1 text-3xl font-bold text-yellow-600">{formatPriceShort(totalPending)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left">
                <th className="px-6 py-3 font-medium text-zinc-500">Customer</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Total Price</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Deposit</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Status</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(!bookings || bookings.length === 0) ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-400">
                    No deposits yet
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-50">
                    <td className="px-6 py-3">
                      <Link href={`/admin/bookings/${b.id}`} className="font-medium hover:underline">
                        {b.customer_name}
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      {b.total_price ? formatPriceShort(b.total_price) : '—'}
                    </td>
                    <td className="px-6 py-3 font-medium">
                      {b.deposit_amount ? formatPriceShort(b.deposit_amount) : '—'}
                    </td>
                    <td className="px-6 py-3">
                      {b.deposit_paid ? (
                        <Badge className="bg-green-100 text-green-700">Paid</Badge>
                      ) : b.status === 'cancelled' ? (
                        <Badge className="bg-zinc-100 text-zinc-500">Cancelled</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
                      )}
                    </td>
                    <td className="px-6 py-3 text-zinc-500">{formatDate(b.created_at)}</td>
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
