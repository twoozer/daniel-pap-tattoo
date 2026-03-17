'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useBookingStore } from '@/hooks/use-booking-store';
import { BookingStepper } from '@/components/booking/booking-stepper';
import { Button } from '@/components/ui/button';
import { TimeSlot } from '@/types/booking';
import { formatDate, formatTime, addDays, toDateString } from '@/lib/utils/date-helpers';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function ScheduleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isConsultation = searchParams.get('type') === 'consultation';
  const { bookingType, estimatedHours, appointmentDate, appointmentStartTime, setSchedule, setStep } = useBookingStore();

  const [weekStart, setWeekStart] = useState(() => {
    const tomorrow = addDays(new Date(), 1);
    const dayOfWeek = tomorrow.getDay();
    const monday = addDays(tomorrow, dayOfWeek === 0 ? 1 : (1 - dayOfWeek + 7) % 7 || 0);
    return monday;
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(appointmentDate);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(
    appointmentStartTime ? { start: appointmentStartTime, end: '' } : null
  );
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    const duration = isConsultation ? 0.5 : estimatedHours || 1;
    fetch(`/api/calendar/availability?date=${selectedDate}&duration=${duration}`)
      .then((res) => res.json())
      .then((data) => { setSlots(data.slots || []); setLoading(false); })
      .catch(() => { setSlots([]); setLoading(false); });
  }, [selectedDate, estimatedHours, isConsultation]);

  const handleSelectSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setSchedule(selectedDate!, slot.start, slot.end);
  };

  const handleContinue = () => {
    if (isConsultation) { setStep(2); router.push('/book/checkout?type=consultation'); }
    else { setStep(5); router.push('/book/checkout'); }
  };

  const handleBack = () => {
    if (isConsultation) router.push('/book');
    else router.push('/book/details');
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <BookingStepper currentStep={isConsultation ? 1 : 4} bookingType={isConsultation ? 'consultation' : bookingType} />

      <div className="mt-8 text-center">
        <h1 className="text-3xl font-bold">{isConsultation ? 'Pick a consultation time' : 'Choose your appointment'}</h1>
        <p className="mt-2 text-zinc-500">{isConsultation ? 'Free 30-minute consultation to discuss your ideas' : 'Select a date and time that works for you'}</p>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="rounded-md p-2 hover:bg-zinc-100" disabled={weekStart <= new Date()}>
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium">{formatDate(toDateString(weekStart))} &mdash; {formatDate(toDateString(addDays(weekStart, 6)))}</span>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="rounded-md p-2 hover:bg-zinc-100">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dateStr = toDateString(day);
            const isToday = toDateString(new Date()) === dateStr;
            const isPast = day < new Date() && !isToday;
            const isSelected = selectedDate === dateStr;
            return (
              <button key={dateStr} onClick={() => { setSelectedDate(dateStr); setSelectedSlot(null); }} disabled={isPast}
                className={`rounded-md p-2 text-center text-sm transition-colors ${isSelected ? 'bg-black text-white' : isPast ? 'text-zinc-300' : 'hover:bg-zinc-100'}`}>
                <div className="text-xs font-medium">{day.toLocaleDateString('en-GB', { weekday: 'short' })}</div>
                <div className="mt-1 text-lg font-semibold">{day.getDate()}</div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-zinc-700">Available times</h3>
          {loading ? (
            <p className="mt-4 text-sm text-zinc-400">Loading available slots...</p>
          ) : slots.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">No available slots on this date. Try another day.</p>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {slots.map((slot) => (
                <button key={slot.start} onClick={() => handleSelectSlot(slot)}
                  className={`rounded-md border px-3 py-2 text-sm transition-colors ${selectedSlot?.start === slot.start ? 'border-black bg-black text-white' : 'border-zinc-200 hover:border-zinc-400'}`}>
                  {formatTime(slot.start)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={handleBack}>Back</Button>
        <Button onClick={handleContinue} disabled={!selectedSlot}>Continue</Button>
      </div>
    </div>
  );
}
