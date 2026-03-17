import { Suspense } from 'react';
import { BookStartContent } from './book-start-content';

export default function BookStartPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-zinc-400">Loading...</div>}>
      <BookStartContent />
    </Suspense>
  );
}
