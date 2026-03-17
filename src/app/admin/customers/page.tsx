import { createAdminClient } from '@/lib/supabase/admin';
import { Card, CardContent } from '@/components/ui/card';
import { formatPriceShort } from '@/lib/utils/pricing';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  const supabase = createAdminClient();

  const { data: bookings } = await supabase
    .from('bookings')
    .select('customer_name, customer_email, customer_phone, created_at, status, deposit_paid, total_price')
    .order('created_at', { ascending: false });

  // Group by email
  const customerMap = new Map<string, {
    customer_name: string;
    customer_email: string;
    customer_phone: string | null;
    booking_count: number;
    total_spent: number;
    last_booking: string;
  }>();

  for (const b of bookings || []) {
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

  const customers = Array.from(customerMap.values());

  return (
    <div>
      <h1 className="text-2xl font-bold">Customers</h1>
      <p className="mt-1 text-sm text-zinc-500">{customers.length} total customer{customers.length !== 1 ? 's' : ''}</p>

      {customers.length === 0 ? (
        <Card className="mt-6">
          <CardContent>
            <p className="py-8 text-center text-sm text-zinc-400">No customers yet</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left">
                  <th className="px-6 py-3 font-medium text-zinc-500">Name</th>
                  <th className="px-6 py-3 font-medium text-zinc-500">Email</th>
                  <th className="px-6 py-3 font-medium text-zinc-500">Phone</th>
                  <th className="px-6 py-3 font-medium text-zinc-500">Bookings</th>
                  <th className="px-6 py-3 font-medium text-zinc-500">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {customers.map((c) => (
                  <tr key={c.customer_email} className="hover:bg-zinc-50">
                    <td className="px-6 py-3">
                      <Link
                        href={`/admin/customers/${encodeURIComponent(c.customer_email)}`}
                        className="font-medium hover:underline"
                      >
                        {c.customer_name}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-zinc-500">{c.customer_email}</td>
                    <td className="px-6 py-3 text-zinc-500">{c.customer_phone || '—'}</td>
                    <td className="px-6 py-3">{c.booking_count}</td>
                    <td className="px-6 py-3">{formatPriceShort(c.total_spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
