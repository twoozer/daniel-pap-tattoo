'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, MessageSquare, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ConfirmationContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id');
  const token = searchParams.get('token');
  const status = searchParams.get('status');

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle size={32} className="text-green-600" />
      </div>

      <h1 className="mt-6 text-3xl font-bold">
        {status === 'paid' ? 'Booking Confirmed!' : 'Request Received!'}
      </h1>

      <p className="mt-3 text-zinc-500">
        {status === 'paid'
          ? 'Your deposit has been received and your appointment is locked in. Check your email for confirmation details.'
          : 'I\'ve received your request and will be in touch shortly to discuss details.'}
      </p>

      {bookingId && token && (
        <div className="mt-8 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm text-zinc-600">Save this link to view your booking and message Daniel:</p>
          <p className="mt-2 break-all font-mono text-sm text-zinc-800">
            {typeof window !== 'undefined' ? window.location.origin : ''}/booking/{bookingId}?token={token}
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link href="/">
          <Button variant="outline"><Home size={16} /> Back to Home</Button>
        </Link>
        {bookingId && token && (
          <Link href={`/booking/${bookingId}?token=${token}`}>
            <Button><MessageSquare size={16} /> Message Daniel</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
