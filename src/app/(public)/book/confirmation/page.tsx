import { Suspense } from 'react';
import { ConfirmationContent } from './confirmation-content';

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-zinc-400">Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
