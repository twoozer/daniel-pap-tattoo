'use client';

import { Check } from 'lucide-react';

interface Step {
  number: number;
  label: string;
}

const STANDARD_STEPS: Step[] = [
  { number: 1, label: 'Design' },
  { number: 2, label: 'Size' },
  { number: 3, label: 'Details' },
  { number: 4, label: 'Schedule' },
  { number: 5, label: 'Checkout' },
];

const CONSULTATION_STEPS: Step[] = [
  { number: 1, label: 'Schedule' },
  { number: 2, label: 'Details' },
  { number: 3, label: 'Confirm' },
];

interface BookingStepperProps {
  currentStep: number;
  bookingType?: 'standard' | 'consultation' | 'custom_quote';
}

export function BookingStepper({ currentStep, bookingType = 'standard' }: BookingStepperProps) {
  const steps = bookingType === 'consultation' ? CONSULTATION_STEPS : STANDARD_STEPS;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  currentStep > step.number
                    ? 'bg-black text-white'
                    : currentStep === step.number
                      ? 'bg-black text-white'
                      : 'bg-zinc-200 text-zinc-500'
                }`}
              >
                {currentStep > step.number ? <Check size={14} /> : step.number}
              </div>
              <span
                className={`mt-1 text-xs ${
                  currentStep >= step.number ? 'font-medium text-black' : 'text-zinc-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`mx-2 h-px w-8 sm:w-16 ${
                  currentStep > step.number ? 'bg-black' : 'bg-zinc-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
