import { Suspense } from 'react';
import { CheckoutContent } from './checkout-content';

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-zinc-400">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
