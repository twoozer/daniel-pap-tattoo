import { createAdminClient } from '@/lib/supabase/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLOURS } from '@/lib/utils/constants';

export const dynamic = 'force-dynamic';

export default async function AdminMessagesPage() {
  const supabase = createAdminClient();

  // Get all messages
  const { data: messages } = await supabase
    .from('messages')
    .select('booking_id, sender_type, body, created_at, read_at')
    .order('created_at', { ascending: false });

  // Group messages by booking_id
  const bookingMap = new Map<string, {
    lastMessage: string;
    lastSender: string;
    lastTime: string;
    unreadCount: number;
  }>();

  for (const msg of messages || []) {
    const existing = bookingMap.get(msg.booking_id);
    if (!existing) {
      bookingMap.set(msg.booking_id, {
        lastMessage: msg.body,
        lastSender: msg.sender_type,
        lastTime: msg.created_at,
        unreadCount: msg.sender_type === 'customer' && !msg.read_at ? 1 : 0,
      });
    } else {
      if (msg.sender_type === 'customer' && !msg.read_at) {
        existing.unreadCount += 1;
      }
    }
  }

  // Get ALL active bookings (not just ones with messages)
  const { data: allBookings } = await supabase
    .from('bookings')
    .select('id, customer_name, customer_email, status, created_at')
    .not('status', 'in', '("cancelled","no_show")')
    .order('created_at', { ascending: false });

  // Build conversations list: bookings with messages first, then all other active bookings
  const conversationsWithMessages = (allBookings || [])
    .filter((b) => bookingMap.has(b.id))
    .map((b) => ({
      ...b,
      ...bookingMap.get(b.id)!,
      hasMessages: true,
    }));

  const bookingsWithoutMessages = (allBookings || [])
    .filter((b) => !bookingMap.has(b.id))
    .map((b) => ({
      ...b,
      lastMessage: '',
      lastSender: '',
      lastTime: b.created_at,
      unreadCount: 0,
      hasMessages: false,
    }));

  // Sort conversations with messages by last message time
  conversationsWithMessages.sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());

  return (
    <div>
      <h1 className="text-2xl font-bold">Messages</h1>
      <p className="mt-1 text-sm text-zinc-500">Customer conversations</p>

      {/* Active conversations */}
      {conversationsWithMessages.length > 0 && (
        <div className="mt-6 space-y-2">
          {conversationsWithMessages.map((conv) => (
            <Link
              key={conv.id}
              href={`/admin/messages/${conv.id}`}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 transition-shadow hover:shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{conv.customer_name}</p>
                  {conv.unreadCount > 0 && (
                    <Badge className="bg-red-100 text-red-700">{conv.unreadCount} new</Badge>
                  )}
                </div>
                <p className="mt-0.5 truncate text-sm text-zinc-500">{conv.lastMessage}</p>
              </div>
              <span className="ml-4 shrink-0 text-xs text-zinc-400">
                {new Date(conv.lastTime).toLocaleDateString('en-GB')}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Bookings without messages — start a new conversation */}
      {bookingsWithoutMessages.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Start a Conversation</h2>
          <p className="mt-1 text-sm text-zinc-500">Bookings with no messages yet — click to send the first message</p>
          <div className="mt-4 space-y-2">
            {bookingsWithoutMessages.map((b) => (
              <Link
                key={b.id}
                href={`/admin/messages/${b.id}`}
                className="flex items-center justify-between rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-3 transition-shadow hover:border-zinc-400 hover:shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{b.customer_name}</p>
                    <Badge className={`text-xs ${BOOKING_STATUS_COLOURS[b.status]}`}>
                      {BOOKING_STATUS_LABELS[b.status]}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-zinc-400">{b.customer_email}</p>
                </div>
                <span className="ml-4 shrink-0 text-xs text-zinc-400">
                  {new Date(b.created_at).toLocaleDateString('en-GB')}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {conversationsWithMessages.length === 0 && bookingsWithoutMessages.length === 0 && (
        <Card className="mt-6">
          <CardContent>
            <p className="py-8 text-center text-sm text-zinc-400">No bookings or conversations yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
