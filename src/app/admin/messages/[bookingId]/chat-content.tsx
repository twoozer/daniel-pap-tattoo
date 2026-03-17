'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Message } from '@/types/booking';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { ChatImageUpload } from '@/components/chat/chat-image-upload';
import { ChatMessageBubble } from '@/components/chat/chat-message-bubble';
import Link from 'next/link';

export function AdminChatContent() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [bookingInfo, setBookingInfo] = useState<{ customer_name: string; customer_email: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const loadMessages = async () => {
    const res = await fetch(`/api/messages?booking_id=${bookingId}`);
    const data = await res.json();
    setMessages(data.messages || []);

    // Mark customer messages as read
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('booking_id', bookingId)
      .eq('sender_type', 'customer')
      .is('read_at', null);
  };

  const loadBookingInfo = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('customer_name, customer_email')
      .eq('id', bookingId)
      .single();
    setBookingInfo(data);
  };

  useEffect(() => {
    loadMessages();
    loadBookingInfo();

    // Subscribe to realtime messages
    const channel = supabase
      .channel(`messages:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !pendingImage) return;
    setSending(true);

    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: bookingId,
        sender_type: 'artist',
        sender_name: 'Daniel',
        body: newMessage.trim(),
        image_path: pendingImage || undefined,
      }),
    });

    setNewMessage('');
    setPendingImage(null);
    setSending(false);
    // Message will appear via realtime subscription
  };

  const handleImageUploaded = (imagePath: string) => {
    setPendingImage(imagePath);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="border-b border-zinc-200 px-4 py-3">
        <Link href="/admin/messages" className="text-sm text-zinc-500 hover:text-black">&larr; Back</Link>
        {bookingInfo && (
          <div className="mt-1">
            <p className="font-semibold">{bookingInfo.customer_name}</p>
            <p className="text-xs text-zinc-400">{bookingInfo.customer_email}</p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-zinc-400">No messages yet. Start the conversation.</p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                msg={msg}
                alignment={msg.sender_type === 'artist' ? 'right' : 'left'}
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

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-zinc-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <ChatImageUpload bookingId={bookingId} onUploaded={handleImageUploaded} />
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
          <Button type="submit" loading={sending} disabled={!newMessage.trim() && !pendingImage}>
            <Send size={16} />
          </Button>
        </div>
      </form>
    </div>
  );
}
