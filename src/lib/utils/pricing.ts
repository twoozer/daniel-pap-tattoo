import { PriceTier, SizeCategory } from '@/types/booking';

export function calculateDeposit(pricePence: number, depositPercent: number = 20): number {
  return Math.round(pricePence * (depositPercent / 100));
}

export function formatPrice(pence: number): string {
  return `$${(pence / 100).toFixed(2)}`;
}

export function formatPriceShort(pence: number): string {
  const dollars = pence / 100;
  return dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

export function isAutoBookable(tier: PriceTier): boolean {
  return tier.is_auto_bookable && tier.price_pence !== null;
}

export function getEstimatedDuration(tier: PriceTier): string {
  if (tier.estimated_hours === 0) return 'TBD';
  if (tier.estimated_hours === 1) return '~1 hour';
  return `~${tier.estimated_hours} hours`;
}
