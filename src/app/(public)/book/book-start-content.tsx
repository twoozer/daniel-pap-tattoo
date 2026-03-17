'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useBookingStore } from '@/hooks/use-booking-store';
import { BookingStepper } from '@/components/booking/booking-stepper';
import { Palette, HelpCircle, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

export function BookStartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setBookingType, setStep, reset } = useBookingStore();

  useEffect(() => {
    reset();
    if (searchParams.get('type') === 'consultation') {
      setBookingType('consultation');
      setStep(1);
      router.push('/book/schedule?type=consultation');
    }
  }, []);

  const handleStandard = () => {
    setBookingType('standard');
    setStep(2);
    router.push('/book/size');
  };

  const handleConsultation = () => {
    setBookingType('consultation');
    setStep(1);
    router.push('/book/schedule?type=consultation');
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <BookingStepper currentStep={1} />

      <div className="mt-8 text-center">
        <h1 className="text-3xl font-bold">What are you looking for?</h1>
        <p className="mt-2 text-zinc-500">Choose an option to get started</p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <button
          onClick={handleStandard}
          className="group rounded-lg border-2 border-zinc-200 p-6 text-left transition-all hover:border-black"
        >
          <Palette size={24} className="text-zinc-400 group-hover:text-black" />
          <h3 className="mt-3 text-lg font-semibold">I know what I want</h3>
          <p className="mt-1 text-sm text-zinc-500">
            I have a design in mind (or I&apos;ll pick from the flash gallery). Let me choose a size and book a slot.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-600 group-hover:text-black">
            Continue <ArrowRight size={14} />
          </span>
        </button>

        <button
          onClick={handleConsultation}
          className="group rounded-lg border-2 border-zinc-200 p-6 text-left transition-all hover:border-black"
        >
          <HelpCircle size={24} className="text-zinc-400 group-hover:text-black" />
          <h3 className="mt-3 text-lg font-semibold">I need a consultation</h3>
          <p className="mt-1 text-sm text-zinc-500">
            I&apos;m not sure about the design, size, or style. I&apos;d like to chat with Daniel first (free, 30 min).
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-600 group-hover:text-black">
            Book consultation <ArrowRight size={14} />
          </span>
        </button>
      </div>
    </div>
  );
}
