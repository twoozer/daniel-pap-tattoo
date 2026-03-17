'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Booking, Message } from '@/types/booking';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLOURS } from '@/lib/utils/constants';
import { formatDate, formatTime } from '@/lib/utils/date-helpers';
import { formatPriceShort } from '@/lib/utils/pricing';
import { Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ChatImageUpload } from '@/components/chat/chat-image-upload';
import { ChatMessageBubble } from '@/components/chat/chat-message-bubble';

export function BookingViewContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [booking, setBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!token) { setError('Missing access token'); return; }
    fetch(`/api/bookings?id=${id}&token=${token}`).then(r => r.json()).then(d => { if (d.error) setError(d.error); else setBooking(d.booking); });
    fetch(`/api/messages?booking_id=${id}&token=${token}`).then(r => r.json()).then(d => setMessages(d.messages || []));

    const channel = supabase.channel(`customer-messages:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `booking_id=eq.${id}` },
        (payload) => { setMessages((prev) => [...prev, payload.new as Message]); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, token]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !pendingImage) || !booking) return;
    setSending(true);
    await fetch('/api/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: id,
        sender_type: 'customer',
        sender_name: booking.customer_name,
        body: newMessage.trim(),
        image_path: pendingImage || undefined,
        token,
      }),
    });
    setNewMessage('');
    setPendingImage(null);
    setSending(false);
  };

  const handleImageUploaded = (imagePath: string) => {
    setPendingImage(imagePath);
  };

  if (error) return (<div className="mx-auto max-w-lg px-4 py-20 text-center"><h1 className="text-2xl font-bold">Booking Not Found</h1><p className="mt-2 text-zinc-500">{error}</p></div>);
  if (!booking) return (<div className="mx-auto max-w-lg px-4 py-20 text-center"><p className="text-zinc-400">Loading...</p></div>);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Booking</h1>
        <Badge className={`text-sm ${BOOKING_STATUS_COLOURS[booking.status]}`}>{BOOKING_STATUS_LABELS[booking.status]}</Badge>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-zinc-500">Type</dt><dd className="capitalize">{booking.booking_type.replace('_', ' ')}</dd></div>
            {booking.appointment_date && <div className="flex justify-between"><dt className="text-zinc-500">Date</dt><dd>{formatDate(booking.appointment_date)}</dd></div>}
            {booking.appointment_start_time && <div className="flex justify-between"><dt className="text-zinc-500">Time</dt><dd>{formatTime(booking.appointment_start_time)}{booking.appointment_end_time && ` — ${formatTime(booking.appointment_end_time)}`}</dd></div>}
            {booking.size_category && <div className="flex justify-between"><dt className="text-zinc-500">Size</dt><dd className="capitalize">{booking.size_category}</dd></div>}
            {booking.total_price && <div className="flex justify-between"><dt className="text-zinc-500">Total Price</dt><dd className="font-semibold">{formatPriceShort(booking.total_price)}</dd></div>}
            {booking.deposit_amount && <div className="flex justify-between"><dt className="text-zinc-500">Deposit</dt><dd>{formatPriceShort(booking.deposit_amount)} {booking.deposit_paid ? <span className="text-green-600">Paid</span> : <span className="text-yellow-600">Unpaid</span>}</dd></div>}
          </dl>
        </CardContent>
      </Card>

      <div className="mt-6">
        <h2 className="text-lg font-semibold">Chat with Daniel</h2>
        <Card className="mt-3">
          <div className="h-80 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <p className="text-center text-sm text-zinc-400">No messages yet. Send a message or share a reference image to get in touch.</p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <ChatMessageBubble
                    key={msg.id}
                    msg={msg}
                    alignment={msg.sender_type === 'customer' ? 'right' : 'left'}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Pending image preview */}
          {pendingImage && (
            <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Image attached</span>
                <button
                  onClick={() => setPendingImage(null)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSend} className="border-t border-zinc-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <ChatImageUpload bookingId={id} onUploaded={handleImageUploaded} />
              <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message or attach an image..."
                className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
              <Button type="submit" loading={sending} disabled={!newMessage.trim() && !pendingImage}><Send size={16} /></Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
