/**
 * Mock/fallback data for prototype mode.
 * Used when Supabase is not connected (placeholder credentials).
 * Remove this file once real Supabase project is set up.
 */

import { PriceTier, FlashDesign, Availability, TimeSlot } from '@/types/booking';

export const IS_PROTOTYPE = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');

export const MOCK_PRICE_TIERS: PriceTier[] = [
  {
    id: 'tier-tiny',
    size_category: 'tiny',
    display_name: 'Tiny',
    description: 'Under 5cm — finger tattoos, small symbols, initials',
    price_pence: 8000,
    estimated_hours: 0.5,
    deposit_percent: 20,
    is_auto_bookable: true,
    sort_order: 1,
  },
  {
    id: 'tier-small',
    size_category: 'small',
    display_name: 'Small',
    description: '5–10cm — wrist pieces, ankle designs, behind the ear',
    price_pence: 15000,
    estimated_hours: 1,
    deposit_percent: 20,
    is_auto_bookable: true,
    sort_order: 2,
  },
  {
    id: 'tier-medium',
    size_category: 'medium',
    display_name: 'Medium',
    description: '10–20cm — forearm bands, shoulder pieces, calf work',
    price_pence: 35000,
    estimated_hours: 3,
    deposit_percent: 20,
    is_auto_bookable: true,
    sort_order: 3,
  },
  {
    id: 'tier-large',
    size_category: 'large',
    display_name: 'Large',
    description: '20–35cm — half-sleeves, thigh panels, chest pieces',
    price_pence: 60000,
    estimated_hours: 5,
    deposit_percent: 20,
    is_auto_bookable: true,
    sort_order: 4,
  },
  {
    id: 'tier-custom',
    size_category: 'custom',
    display_name: 'Extra Large / Custom',
    description: 'Full sleeves, back pieces, or complex multi-session work',
    price_pence: null,
    estimated_hours: 0,
    deposit_percent: 20,
    is_auto_bookable: false,
    sort_order: 5,
  },
];

export const MOCK_FLASH_DESIGNS: FlashDesign[] = [
  {
    id: 'flash-1',
    created_at: new Date().toISOString(),
    title: 'Rose & Dagger',
    description: 'Classic traditional rose intertwined with a dagger',
    style: 'traditional',
    image_path: '',
    image_url: 'https://placehold.co/400x500/1a1a1a/ffffff?text=Rose+%26+Dagger',
    suggested_size: 'medium',
    is_available: true,
    sort_order: 1,
    tags: ['traditional', 'floral', 'dagger'],
  },
  {
    id: 'flash-2',
    created_at: new Date().toISOString(),
    title: 'Geometric Wolf',
    description: 'Minimalist wolf portrait with geometric line work',
    style: 'geometric',
    image_path: '',
    image_url: 'https://placehold.co/400x500/1a1a1a/ffffff?text=Geometric+Wolf',
    suggested_size: 'medium',
    is_available: true,
    sort_order: 2,
    tags: ['geometric', 'animal', 'minimalist'],
  },
  {
    id: 'flash-3',
    created_at: new Date().toISOString(),
    title: 'Moon Phase',
    description: 'Delicate crescent moon phases in fine line',
    style: 'fine-line',
    image_path: '',
    image_url: 'https://placehold.co/400x500/1a1a1a/ffffff?text=Moon+Phase',
    suggested_size: 'small',
    is_available: true,
    sort_order: 3,
    tags: ['fine-line', 'celestial', 'minimalist'],
  },
  {
    id: 'flash-4',
    created_at: new Date().toISOString(),
    title: 'Snake & Peony',
    description: 'Neo-traditional snake wrapped around a peony bloom',
    style: 'neo-traditional',
    image_path: '',
    image_url: 'https://placehold.co/400x500/1a1a1a/ffffff?text=Snake+%26+Peony',
    suggested_size: 'large',
    is_available: true,
    sort_order: 4,
    tags: ['neo-traditional', 'snake', 'floral'],
  },
  {
    id: 'flash-5',
    created_at: new Date().toISOString(),
    title: 'Tiny Heart',
    description: 'Simple outline heart — perfect for a first tattoo',
    style: 'minimalist',
    image_path: '',
    image_url: 'https://placehold.co/400x500/1a1a1a/ffffff?text=Tiny+Heart',
    suggested_size: 'tiny',
    is_available: true,
    sort_order: 5,
    tags: ['minimalist', 'heart', 'simple'],
  },
  {
    id: 'flash-6',
    created_at: new Date().toISOString(),
    title: 'Koi Fish',
    description: 'Japanese-inspired koi fish with waves',
    style: 'japanese',
    image_path: '',
    image_url: 'https://placehold.co/400x500/1a1a1a/ffffff?text=Koi+Fish',
    suggested_size: 'large',
    is_available: true,
    sort_order: 6,
    tags: ['japanese', 'fish', 'water'],
  },
];

export const MOCK_AVAILABILITY: Availability[] = [
  { id: 'avail-0', day_of_week: 0, start_time: '09:00', end_time: '17:00', is_working: false }, // Sunday
  { id: 'avail-1', day_of_week: 1, start_time: '10:00', end_time: '18:00', is_working: true },  // Monday
  { id: 'avail-2', day_of_week: 2, start_time: '10:00', end_time: '18:00', is_working: true },  // Tuesday
  { id: 'avail-3', day_of_week: 3, start_time: '10:00', end_time: '18:00', is_working: true },  // Wednesday
  { id: 'avail-4', day_of_week: 4, start_time: '10:00', end_time: '18:00', is_working: true },  // Thursday
  { id: 'avail-5', day_of_week: 5, start_time: '10:00', end_time: '17:00', is_working: true },  // Friday
  { id: 'avail-6', day_of_week: 6, start_time: '11:00', end_time: '16:00', is_working: true },  // Saturday
];

export function getMockAvailabilityForDay(dayOfWeek: number): Availability | null {
  return MOCK_AVAILABILITY.find((a) => a.day_of_week === dayOfWeek) || null;
}

export function getMockFlashStyles(): string[] {
  return [...new Set(MOCK_FLASH_DESIGNS.map((d) => d.style).filter(Boolean))] as string[];
}
