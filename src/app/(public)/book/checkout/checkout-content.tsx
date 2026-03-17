'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useBookingStore } from '@/hooks/use-booking-store';
import { BookingStepper } from '@/components/booking/booking-stepper';
import { Button } from '@/components/ui/button';
import { formatPriceShort } from '@/lib/utils/pricing';
import { formatDate, formatTime } from '@/lib/utils/date-helpers';
import { createClient } from '@/lib/supabase/client';

function getFlashImageUrl(imagePath: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from('flash-designs').getPublicUrl(imagePath);
  return data.publicUrl;
}

export function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isConsultation = searchParams.get('type') === 'consultation';
  const store = useBookingStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState(store.customerName);
  const [email, setEmail] = useState(store.customerEmail);
  const [phone, setPhone] = useState(store.customerPhone);
  const [notes, setNotes] = useState(store.consultationNotes);

  useEffect(() => {
    if (email && email.includes('@')) {
      fetch(`/api/customers?email=${encodeURIComponent(email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.customer) {
            if (!name) setName(data.customer.customer_name);
            if (!phone) setPhone(data.customer.customer_phone || '');
          }
        })
        .catch(() => {});
    }
  }, [email]);

  const handleSubmit = async () => {
    if (!name || !email || !phone) {
      setError('Please fill in your name, email, and phone number.');
      return;
    }
    setError('');
    setLoading(true);

    store.setCustomerInfo({ name, email, phone });

    const bookingData = {
      booking_type: isConsultation ? 'consultation' : store.bookingType,
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      size_category: isConsultation ? undefined : store.sizeCategory || undefined,
      body_placement: store.bodyPlacement || undefined,
      style: store.style || undefined,
      description: store.description || undefined,
      flash_design_id: store.flashDesignId || undefined,
      reference_images: store.referenceImages.length > 0 ? store.referenceImages : undefined,
      appointment_date: store.appointmentDate || undefined,
      appointment_start_time: store.appointmentStartTime || undefined,
      appointment_end_time: store.appointmentEndTime || undefined,
      consultation_notes: isConsultation ? notes : undefined,
    };

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }

      store.reset();
      router.push(`/book/confirmation?id=${data.booking.id}&token=${data.booking.access_token}`);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const isCustomQuote = store.bookingType === 'custom_quote';
  const isFlashBooking = !!store.flashDesignId;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <BookingStepper
        currentStep={isConsultation ? 3 : 5}
        bookingType={isConsultation ? 'consultation' : store.bookingType}
      />

      <div className="mt-8 text-center">
        <h1 className="text-3xl font-bold">
          {isConsultation ? 'Confirm your consultation' : isCustomQuote ? 'Request a quote' : 'Review & pay deposit'}
        </h1>
      </div>

      {/* Flash design card */}
      {isFlashBooking && (
        <div className="mt-8 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-center gap-4">
            {store.flashDesignImagePath && (
              <img
                src={getFlashImageUrl(store.flashDesignImagePath)}
                alt={store.flashDesignTitle || 'Flash design'}
                className="h-20 w-20 rounded-lg object-cover"
              />
            )}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Flash Design</p>
              <p className="text-lg font-semibold">{store.flashDesignTitle}</p>
              {store.flashDesignStyle && (
                <p className="text-sm capitalize text-zinc-500">{store.flashDesignStyle.replace('-', ' ')}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {!isConsultation && !isCustomQuote && (
        <div className={`${isFlashBooking ? 'mt-4' : 'mt-8'} rounded-lg border border-zinc-200 bg-zinc-50 p-6`}>
          <h3 className="font-semibold">Booking Summary</h3>
          <div className="mt-3 space-y-2 text-sm">
            {store.sizeCategory && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Size</span>
                <span className="capitalize">{store.sizeCategory}</span>
              </div>
            )}
            {store.bodyPlacement && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Placement</span>
                <span>{store.bodyPlacement}</span>
              </div>
            )}
            {store.style && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Style</span>
                <span className="capitalize">{store.style.replace('-', ' ')}</span>
              </div>
            )}
            {store.appointmentDate && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Date</span>
                <span>{formatDate(store.appointmentDate)}</span>
              </div>
            )}
            {store.appointmentStartTime && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Time</span>
                <span>{formatTime(store.appointmentStartTime)}</span>
              </div>
            )}
            <hr className="my-3 border-zinc-200" />
            {store.totalPrice && (
              <>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Total price</span>
                  <span className="font-semibold">{formatPriceShort(store.totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Deposit (20%)</span>
                  <span className="font-semibold">{formatPriceShort(store.depositAmount!)}</span>
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  Remaining balance due on the day of your appointment.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {isConsultation && store.appointmentDate && (
        <div className="mt-8 rounded-lg border border-zinc-200 bg-zinc-50 p-6">
          <h3 className="font-semibold">Consultation Details</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Date</span>
              <span>{formatDate(store.appointmentDate)}</span>
            </div>
            {store.appointmentStartTime && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Time</span>
                <span>{formatTime(store.appointmentStartTime)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">Duration</span>
              <span>30 minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Cost</span>
              <span className="font-semibold text-green-700">Free</span>
            </div>
          </div>
        </div>
      )}

      {isCustomQuote && (
        <div className="mt-8 rounded-lg border border-orange-200 bg-orange-50 p-6">
          <h3 className="font-semibold text-orange-800">Custom Quote Request</h3>
          <p className="mt-2 text-sm text-orange-700">
            Because of the size/complexity of your tattoo, I&apos;ll review your request
            and get back to you with a custom quote. No payment needed now.
          </p>
        </div>
      )}

      <div className="mt-8 space-y-4">
        <h3 className="font-semibold">Your details</h3>

        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Full name <span className="text-red-500">*</span>
          </label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Phone <span className="text-red-500">*</span>
          </label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
        </div>

        {isConsultation && (
          <div>
            <label className="block text-sm font-medium text-zinc-700">Anything you&apos;d like to discuss? (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="E.g. I'm thinking about a sleeve but not sure on style..." className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>Back</Button>
        <Button onClick={handleSubmit} loading={loading}>
          {isConsultation
            ? 'Confirm Consultation'
            : isCustomQuote
              ? 'Submit Quote Request'
              : `Pay Deposit ${store.depositAmount ? formatPriceShort(store.depositAmount) : ''}`}
        </Button>
      </div>
    </div>
  );
}
