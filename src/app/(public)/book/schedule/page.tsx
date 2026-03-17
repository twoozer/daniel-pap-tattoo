import { Suspense } from 'react';
import { ScheduleContent } from './schedule-content';

export default function ScheduleStepPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-zinc-400">Loading...</div>}>
      <ScheduleContent />
    </Suspense>
  );
}
