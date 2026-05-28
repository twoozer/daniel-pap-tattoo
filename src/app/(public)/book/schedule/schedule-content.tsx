'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useBookingStore } from '@/hooks/use-booking-store';
import { useMonthAvailability } from '@/hooks/use-month-availability';
import { BookingStepper } from '@/components/booking/booking-stepper';
import { Button } from '@/components/ui/button';
import { TimeSlot } from '@/types/booking';
import { formatDate, formatTime, toDateString, addMonths, getCalendarGridDates, getMaxBookingDate } from '@/lib/utils/date-helpers';
import { MAX_ADVANCE_BOOKING_MONTHS } from '@/lib/utils/constants';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function ScheduleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isConsultation = searchParams.get('type') === 'consultation';
  const { bookingType, estimatedHours, appointmentDate, appointmentStartTime, setSchedule, setStep } = useBookingStore();

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(appointmentDate);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(
    appointmentStartTime ? { start: appointmentStartTime, end: '' } : null
  );
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  const duration = isConsultation ? 0.5 : estimatedHours || 1;
  const { days: monthAvailability, loading: monthLoading } = useMonthAvailability(currentMonth, duration);

  const maxBookingDate = getMaxBookingDate(MAX_ADVANCE_BOOKING_MONTHS);
  const maxDateStr = toDateString(maxBookingDate);
  const todayStr = toDateString(new Date());

  const gridDates = getCalendarGridDates(currentMonth.getFullYear(), currentMonth.getMonth());

  const monthLabel = currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const maxMonth = new Date(maxBookingDate.getFullYear(), maxBookingDate.getMonth(), 1);

  const canGoPrev = currentMonth > thisMonth;
  const canGoNext = addMonths(currentMonth, 1) <= maxMonth;

  // Fetch time slots when a date is selected
  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    fetch(`/api/calendar/availability?date=${selectedDate}&duration=${duration}`)
      .then((res) => res.json())
      .then((data) => { setSlots(data.slots || []); setLoading(false); })
      .catch(() => { setSlots([]); setLoading(false); });
  }, [selectedDate, duration]);

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

      {/* Month navigation */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            className="rounded-md p-2 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={!canGoPrev}
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-semibold">{monthLabel}</span>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            className="rounded-md p-2 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
            disabled={!canGoNext}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="mt-4 grid grid-cols-7 text-center text-xs font-medium text-zinc-400">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className="py-2">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 border-t border-l border-zinc-200 rounded-lg overflow-hidden">
          {gridDates.map((date) => {
            const dateStr = toDateString(date);
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isToday = todayStr === dateStr;
            const isPast = dateStr < todayStr;
            const isBeyondMax = dateStr > maxDateStr;
            const isOutside = !isCurrentMonth;
            const isDisabledDate = isPast || isBeyondMax || isOutside;

            const daySummary = monthAvailability[dateStr];
            const status = daySummary?.status || 'unavailable';
            const isClickable = !isDisabledDate && status !== 'unavailable';
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => {
                  if (isClickable) {
                    setSelectedDate(dateStr);
                    setSelectedSlot(null);
                  }
                }}
                disabled={!isClickable}
                className={[
                  'relative flex flex-col items-center justify-center border-b border-r border-zinc-200',
                  'min-h-[48px] py-2 text-sm transition-colors',
                  isOutside ? 'bg-zinc-50 text-zinc-300' : '',
                  isDisabledDate && !isOutside ? 'text-zinc-300' : '',
                  isClickable && !isSelected ? 'hover:bg-zinc-50 cursor-pointer' : '',
                  !isClickable ? 'cursor-default' : '',
                  isSelected ? 'bg-black text-white' : '',
                ].join(' ')}
              >
                <span className={isToday && !isSelected ? 'font-bold underline underline-offset-2' : ''}>
                  {date.getDate()}
                </span>

                {/* Availability dot */}
                {isCurrentMonth && !isPast && !isBeyondMax && (
                  <span className={[
                    'mt-1 h-1.5 w-1.5 rounded-full',
                    monthLoading ? 'bg-zinc-200 animate-pulse' : '',
                    !monthLoading && status === 'available' ? (isSelected ? 'bg-white' : 'bg-green-500') : '',
                    !monthLoading && status === 'limited' ? (isSelected ? 'bg-white' : 'bg-amber-500') : '',
                    !monthLoading && status === 'unavailable' ? (isSelected ? 'bg-zinc-400' : 'bg-zinc-200') : '',
                  ].join(' ')} />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500" /> Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Limited
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-zinc-200" /> Unavailable
          </span>
        </div>
      </div>

      {/* Time slots for selected date */}
      {selectedDate && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-zinc-700">
            Available times for {formatDate(selectedDate)}
          </h3>
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
