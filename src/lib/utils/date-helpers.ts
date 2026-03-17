import { TimeSlot } from '@/types/booking';

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'pm' : 'am';
  const displayHour = hours % 12 || 12;
  return minutes === 0 ? `${displayHour}${period}` : `${displayHour}:${minutes.toString().padStart(2, '0')}${period}`;
}

export function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationHours: number,
  intervalMinutes: number = 30
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const durationMinutes = durationHours * 60;

  for (let m = startMinutes; m + durationMinutes <= endMinutes; m += intervalMinutes) {
    const slotStartH = Math.floor(m / 60);
    const slotStartM = m % 60;
    const slotEndM = m + durationMinutes;
    const slotEndH = Math.floor(slotEndM / 60);
    const slotEndMin = slotEndM % 60;

    slots.push({
      start: `${slotStartH.toString().padStart(2, '0')}:${slotStartM.toString().padStart(2, '0')}`,
      end: `${slotEndH.toString().padStart(2, '0')}:${slotEndMin.toString().padStart(2, '0')}`,
    });
  }

  return slots;
}

export function getWeekDates(startDate: Date): Date[] {
  const dates: Date[] = [];
  const start = new Date(startDate);
  start.setDate(start.getDate() - start.getDay()); // Go to Sunday
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
