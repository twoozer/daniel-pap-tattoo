export const TATTOO_STYLES = [
  'traditional',
  'neo-traditional',
  'blackwork',
  'fine-line',
  'realism',
  'watercolour',
  'japanese',
  'tribal',
  'geometric',
  'minimalist',
  'other',
] as const;

export const BODY_PLACEMENTS = [
  'Forearm',
  'Upper arm',
  'Shoulder',
  'Chest',
  'Back',
  'Ribs / side',
  'Thigh',
  'Calf',
  'Ankle',
  'Wrist',
  'Hand / fingers',
  'Neck',
  'Behind ear',
  'Foot',
  'Hip',
  'Other',
] as const;

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending_deposit: 'Pending Deposit',
  deposit_paid: 'Deposit Paid',
  custom_quote_pending: 'Quote Pending',
  consultation_booked: 'Consultation',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

export const BOOKING_STATUS_COLOURS: Record<string, string> = {
  pending_deposit: 'bg-yellow-100 text-yellow-800',
  deposit_paid: 'bg-blue-100 text-blue-800',
  custom_quote_pending: 'bg-orange-100 text-orange-800',
  consultation_booked: 'bg-purple-100 text-purple-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-zinc-100 text-zinc-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-red-100 text-red-800',
};

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const CONSULTATION_DURATION_MINUTES = 30;
export const DEPOSIT_PERCENT = 20;
export const TIME_ZONE = 'Europe/London';
