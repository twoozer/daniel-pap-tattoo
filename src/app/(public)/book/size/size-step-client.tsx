'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingStore } from '@/hooks/use-booking-store';
import { BookingStepper } from '@/components/booking/booking-stepper';
import { SizeSelector } from '@/components/booking/size-selector';
import { Button } from '@/components/ui/button';
import { PriceTier, SizeCategory } from '@/types/booking';
import { calculateDeposit } from '@/lib/utils/pricing';
import { DEPOSIT_PERCENT } from '@/lib/utils/constants';

interface SizeStepClientProps {
  tiers: PriceTier[];
}

export function SizeStepClient({ tiers }: SizeStepClientProps) {
  const router = useRouter();
  const { sizeCategory, flashDesignSuggestedSize, flashDesignTitle, setSize, setStep, setBookingType } = useBookingStore();

  // Auto-select the suggested size if coming from flash gallery
  useEffect(() => {
    if (flashDesignSuggestedSize && !sizeCategory) {
      const matchingTier = tiers.find((t) => t.size_category === flashDesignSuggestedSize);
      if (matchingTier) {
        handleSelect(matchingTier);
      }
    }
  }, [flashDesignSuggestedSize, tiers]);

  const handleSelect = (tier: PriceTier) => {
    if (tier.size_category === 'custom') {
      // Custom/extra large → custom quote path
      setBookingType('custom_quote');
      setSize(tier.size_category, null, null, null);
      setStep(3);
      router.push('/book/details');
    } else {
      const deposit = tier.price_pence ? calculateDeposit(tier.price_pence, DEPOSIT_PERCENT) : null;
      setSize(tier.size_category, tier.price_pence, deposit, tier.estimated_hours);
      setStep(3);
      router.push('/book/details');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <BookingStepper currentStep={2} />

      <div className="mt-8 text-center">
        <h1 className="text-3xl font-bold">How big is your tattoo?</h1>
        <p className="mt-2 text-zinc-500">
          {flashDesignTitle ? (
            <>
              Suggested size for &quot;{flashDesignTitle}&quot; is highlighted below.
              Feel free to change it.
            </>
          ) : (
            <>
              Select the closest size. Not sure? Pick &quot;Extra Large / Custom&quot; and
              I&apos;ll work it out with you.
            </>
          )}
        </p>
      </div>

      <div className="mt-10">
        <SizeSelector
          tiers={tiers}
          selected={sizeCategory || (flashDesignSuggestedSize as SizeCategory) || null}
          onSelect={handleSelect}
        />
      </div>

      <div className="mt-8 flex justify-start">
        <Button variant="ghost" onClick={() => router.push(flashDesignTitle ? '/flash-gallery' : '/book')}>
          Back
        </Button>
      </div>
    </div>
  );
}
