'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, Pencil, X } from 'lucide-react';
import Link from 'next/link';
import { TATTOO_STYLES, BODY_PLACEMENTS } from '@/lib/utils/constants';

interface BookingActionsProps {
  bookingId: string;
  currentStatus: string;
  booking: {
    artist_notes: string | null;
    body_placement: string | null;
    style: string | null;
    description: string | null;
    appointment_date: string | null;
    appointment_start_time: string | null;
    total_price: number | null;
    size_category: string | null;
  };
}

export function BookingActions({ bookingId, currentStatus, booking }: BookingActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Edit form state
  const [artistNotes, setArtistNotes] = useState(booking.artist_notes || '');
  const [bodyPlacement, setBodyPlacement] = useState(booking.body_placement || '');
  const [style, setStyle] = useState(booking.style || '');
  const [description, setDescription] = useState(booking.description || '');
  const [appointmentDate, setAppointmentDate] = useState(booking.appointment_date || '');
  const [appointmentTime, setAppointmentTime] = useState(booking.appointment_start_time || '');
  const [totalPrice, setTotalPrice] = useState(booking.total_price ? String(booking.total_price / 100) : '');

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    await fetch(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  };

  const handleEditSave = async () => {
    setEditLoading(true);
    const supabase = createClient();

    const updates: Record<string, unknown> = {
      artist_notes: artistNotes || null,
      body_placement: bodyPlacement || null,
      style: style || null,
      description: description || null,
    };

    if (appointmentDate) updates.appointment_date = appointmentDate;
    if (appointmentTime) updates.appointment_start_time = appointmentTime;
    if (totalPrice) updates.total_price = Math.round(parseFloat(totalPrice) * 100);

    await supabase.from('bookings').update(updates).eq('id', bookingId);
    setEditLoading(false);
    setEditing(false);
    router.refresh();
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Link href={`/admin/messages/${bookingId}`}>
          <Button variant="outline">
            <MessageSquare size={16} /> Message Customer
          </Button>
        </Link>

        <Button variant="outline" onClick={() => setEditing(!editing)}>
          {editing ? <><X size={16} /> Cancel Edit</> : <><Pencil size={16} /> Edit Booking</>}
        </Button>

        {currentStatus === 'deposit_paid' && (
          <Button onClick={() => updateStatus('confirmed')} loading={loading}>
            Confirm Booking
          </Button>
        )}
        {(currentStatus === 'confirmed' || currentStatus === 'deposit_paid') && (
          <Button onClick={() => updateStatus('completed')} variant="secondary" loading={loading}>
            Mark Completed
          </Button>
        )}
        {currentStatus === 'custom_quote_pending' && (
          <Button onClick={() => updateStatus('confirmed')} loading={loading}>
            Confirm (Quote Accepted)
          </Button>
        )}
        {currentStatus === 'consultation_booked' && (
          <Button onClick={() => updateStatus('confirmed')} loading={loading}>
            Convert to Booking
          </Button>
        )}
        {!['cancelled', 'completed', 'no_show'].includes(currentStatus) && (
          <>
            <Button onClick={() => updateStatus('cancelled')} variant="danger" loading={loading}>
              Cancel
            </Button>
            <Button onClick={() => updateStatus('no_show')} variant="outline" loading={loading}>
              No Show
            </Button>
          </>
        )}
      </div>

      {/* Edit form */}
      {editing && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
          <h3 className="text-lg font-semibold">Edit Booking</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700">Body Placement</label>
              <select
                value={bodyPlacement}
                onChange={(e) => setBodyPlacement(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="">Select placement...</option>
                {BODY_PLACEMENTS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="">Select style...</option>
                {TATTOO_STYLES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">Appointment Date</label>
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">Start Time</label>
              <input
                type="time"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">Total Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                placeholder="e.g. 250.00"
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700">Artist Notes (internal)</label>
              <textarea
                value={artistNotes}
                onChange={(e) => setArtistNotes(e.target.value)}
                rows={2}
                placeholder="Private notes — only visible to you"
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <Button onClick={handleEditSave} loading={editLoading}>
              Save Changes
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
