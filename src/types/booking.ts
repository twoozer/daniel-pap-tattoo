export type SizeCategory = 'tiny' | 'small' | 'medium' | 'large' | 'custom';

export type BookingType = 'standard' | 'consultation' | 'custom_quote';

export type BookingStatus =
  | 'pending_deposit'
  | 'deposit_paid'
  | 'custom_quote_pending'
  | 'consultation_booked'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type TattooStyle =
  | 'traditional'
  | 'neo-traditional'
  | 'blackwork'
  | 'fine-line'
  | 'realism'
  | 'watercolour'
  | 'japanese'
  | 'tribal'
  | 'geometric'
  | 'minimalist'
  | 'other';

export interface PriceTier {
  id: string;
  size_category: SizeCategory;
  display_name: string;
  description: string | null;
  price_pence: number | null;
  estimated_hours: number;
  deposit_percent: number;
  is_auto_bookable: boolean;
  sort_order: number;
}

export interface Booking {
  id: string;
  created_at: string;
  updated_at: string;
  booking_type: BookingType;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  size_category: SizeCategory | null;
  body_placement: string | null;
  style: string | null;
  description: string | null;
  flash_design_id: string | null;
  reference_images: string[];
  appointment_date: string | null;
  appointment_start_time: string | null;
  appointment_end_time: string | null;
  estimated_duration_hrs: number | null;
  total_price: number | null;
  deposit_amount: number | null;
  deposit_paid: boolean;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  google_calendar_event_id: string | null;
  status: BookingStatus;
  access_token: string;
  artist_notes: string | null;
  consultation_notes: string | null;
}

export interface FlashDesign {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  style: string | null;
  image_path: string;
  image_url?: string;
  suggested_size: SizeCategory | null;
  is_available: boolean;
  sort_order: number;
  tags: string[];
}

export interface Message {
  id: string;
  created_at: string;
  booking_id: string;
  sender_type: 'customer' | 'artist';
  sender_name: string;
  body: string;
  image_path: string | null;
  read_at: string | null;
}

export interface Availability {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_working: boolean;
}

export interface BlockedDate {
  id: string;
  date: string;
  reason: string | null;
}

export interface TimeSlot {
  start: string;
  end: string;
}
