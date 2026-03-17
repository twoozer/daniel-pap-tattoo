'use client';

import { PriceTier, SizeCategory } from '@/types/booking';
import { formatPriceShort, getEstimatedDuration } from '@/lib/utils/pricing';
import { Check } from 'lucide-react';

interface SizeSelectorProps {
  tiers: PriceTier[];
  selected: SizeCategory | null;
  onSelect: (tier: PriceTier) => void;
}

export function SizeSelector({ tiers, selected, onSelect }: SizeSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tiers.map((tier) => {
        const isSelected = selected === tier.size_category;
        return (
          <button
            key={tier.id}
            onClick={() => onSelect(tier)}
            className={`relative rounded-lg border-2 p-4 text-left transition-all ${
              isSelected
                ? 'border-black bg-zinc-50'
                : 'border-zinc-200 hover:border-zinc-400'
            }`}
          >
            {isSelected && (
              <div className="absolute right-3 top-3">
                <Check size={16} className="text-black" />
              </div>
            )}
            <p className="font-semibold">{tier.display_name}</p>
            <p className="mt-1 text-sm text-zinc-500">{tier.description}</p>
            <div className="mt-3 flex items-baseline gap-2">
              {tier.price_pence ? (
                <>
                  <span className="text-lg font-bold">{formatPriceShort(tier.price_pence)}</span>
                  <span className="text-sm text-zinc-400">{getEstimatedDuration(tier)}</span>
                </>
              ) : (
                <span className="text-sm font-medium text-zinc-600">Quote required</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
