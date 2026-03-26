'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useBookingStore } from '@/hooks/use-booking-store';
import { BookingStepper } from '@/components/booking/booking-stepper';
import { Button } from '@/components/ui/button';
import { TATTOO_STYLES, BODY_PLACEMENTS } from '@/lib/utils/constants';
import { createClient } from '@/lib/supabase/client';

function getFlashImageUrl(imagePath: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from('flash-designs').getPublicUrl(imagePath);
  return data.publicUrl;
}

export default function DetailsStepPage() {
  const router = useRouter();
  const {
    bookingType,
    bodyPlacement,
    style,
    description,
    flashDesignTitle,
    flashDesignStyle,
    flashDesignImagePath,
    flashDesignId,
    setDetails,
    setStep,
  } = useBookingStore();

  const [placement, setPlacement] = useState(bodyPlacement);
  const [selectedStyle, setSelectedStyle] = useState(style);
  const [desc, setDesc] = useState(description);

  const isFlashBooking = !!flashDesignId;

  const handleContinue = () => {
    setDetails({ bodyPlacement: placement, style: selectedStyle, description: desc });

    if (bookingType === 'custom_quote') {
      // Skip scheduling, go straight to checkout (which will be info-only for custom quotes)
      setStep(5);
      router.push('/book/checkout');
    } else {
      setStep(4);
      router.push('/book/schedule');
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <BookingStepper currentStep={3} />

      <div className="mt-8 text-center">
        <h1 className="text-3xl font-bold">
          {flashDesignTitle ? `Details for "${flashDesignTitle}"` : 'Tell me about your tattoo'}
        </h1>
        <p className="mt-2 text-zinc-500">
          {flashDesignTitle
            ? 'Confirm placement below. Style and description are pre-filled from the flash design.'
            : 'The more detail, the better. You can also upload reference images.'}
        </p>
      </div>

      {/* Flash design preview */}
      {isFlashBooking && flashDesignImagePath && (
        <div className="mt-6 flex justify-center">
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
            <img
              src={getFlashImageUrl(flashDesignImagePath)}
              alt={flashDesignTitle || 'Flash design'}
              className="h-48 w-48 object-cover"
            />
            <div className="px-3 py-2 text-center">
              <p className="text-sm font-medium">{flashDesignTitle}</p>
              {flashDesignStyle && (
                <p className="text-xs capitalize text-zinc-400">{flashDesignStyle.replace('-', ' ')}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-10 space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Body placement
          </label>
          <select
            value={placement}
            onChange={(e) => setPlacement(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="">Select placement...</option>
            {BODY_PLACEMENTS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Tattoo style
            {isFlashBooking && <span className="ml-1 text-xs text-zinc-400">(pre-filled from flash design)</span>}
          </label>
          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
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

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            {isFlashBooking ? 'Additional notes (optional)' : 'Describe your tattoo idea'}
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={4}
            placeholder={
              isFlashBooking
                ? 'Any changes or additional requests for this flash design...'
                : 'E.g. A small rose with leaves on my inner forearm, fine-line style, black ink only...'
            }
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>

        {/* Reference image note */}
        <div className="rounded-md bg-zinc-50 border border-zinc-200 p-4">
          <p className="text-sm text-zinc-500">
            Want to share reference images? You can send images via the messaging feature after booking.
          </p>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/book/size')}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!placement || !selectedStyle}>
          Continue
        </Button>
      </div>
    </div>
  );
}
