import { Suspense } from 'react';
import { BookingViewContent } from './booking-view-content';

export default function CustomerBookingPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-zinc-400">Loading...</div>}>
      <BookingViewContent />
    </Suspense>
  );
}
