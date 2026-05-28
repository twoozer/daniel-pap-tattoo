'use client';

import { useState, useEffect } from 'react';
import { DayAvailabilitySummary } from '@/types/booking';
import { toMonthString } from '@/lib/utils/date-helpers';

export function useMonthAvailability(currentMonth: Date, duration: number) {
  const [days, setDays] = useState<Record<string, DayAvailabilitySummary>>({});
  const [loading, setLoading] = useState(true);

  const monthKey = toMonthString(currentMonth);

  useEffect(() => {
    setLoading(true);

    fetch(`/api/calendar/availability-summary?month=${monthKey}&duration=${duration}`)
      .then((res) => res.json())
      .then((data) => {
        setDays(data.days || {});
        setLoading(false);
      })
      .catch(() => {
        setDays({});
        setLoading(false);
      });
  }, [monthKey, duration]);

  return { days, loading };
}
