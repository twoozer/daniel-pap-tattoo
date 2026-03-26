'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Availability, BlockedDate } from '@/types/booking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DAY_NAMES } from '@/lib/utils/constants';
import { Plus, Trash2 } from 'lucide-react';

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(start + 'T00:00:00');
  const last = new Date(end + 'T00:00:00');
  while (current <= last) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function AdminAvailabilityContent() {
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Block date form
  const [blockStartDate, setBlockStartDate] = useState('');
  const [blockEndDate, setBlockEndDate] = useState('');
  const [blockReason, setBlockReason] = useState('');

  const supabase = createClient();

  const loadData = async () => {
    const [{ data: avail }, { data: blocked }] = await Promise.all([
      supabase.from('availability').select('*').order('day_of_week'),
      supabase.from('blocked_dates').select('*').order('date'),
    ]);
    setAvailability((avail as Availability[]) || []);
    setBlockedDates((blocked as BlockedDate[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleDay = async (day: Availability) => {
    setSaving(true);
    await supabase
      .from('availability')
      .update({ is_working: !day.is_working })
      .eq('id', day.id);
    await loadData();
    setSaving(false);
  };

  const updateTime = async (dayId: string, field: 'start_time' | 'end_time', value: string) => {
    await supabase.from('availability').update({ [field]: value }).eq('id', dayId);
    loadData();
  };

  const addBlockedDates = async () => {
    if (!blockStartDate) return;
    const endDate = blockEndDate || blockStartDate;
    const dates = getDatesInRange(blockStartDate, endDate);
    const reason = blockReason || null;

    // Insert all dates in the range
    const rows = dates.map((date) => ({ date, reason }));
    await supabase.from('blocked_dates').insert(rows);

    setBlockStartDate('');
    setBlockEndDate('');
    setBlockReason('');
    loadData();
  };

  const removeBlockedDate = async (id: string) => {
    await supabase.from('blocked_dates').delete().eq('id', id);
    loadData();
  };

  // Group consecutive blocked dates with same reason for display
  const groupedBlocks = blockedDates.reduce<Array<{ ids: string[]; startDate: string; endDate: string; reason: string | null }>>((groups, bd) => {
    const last = groups[groups.length - 1];
    if (last && last.reason === bd.reason) {
      const lastEnd = new Date(last.endDate + 'T00:00:00');
      const current = new Date(bd.date + 'T00:00:00');
      const diffDays = (current.getTime() - lastEnd.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        last.endDate = bd.date;
        last.ids.push(bd.id);
        return groups;
      }
    }
    groups.push({ ids: [bd.id], startDate: bd.date, endDate: bd.date, reason: bd.reason });
    return groups;
  }, []);

  const removeBlockedGroup = async (ids: string[]) => {
    for (const id of ids) {
      await supabase.from('blocked_dates').delete().eq('id', id);
    }
    loadData();
  };

  if (loading) {
    return <p className="text-sm text-zinc-400">Loading...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Availability</h1>
      <p className="mt-1 text-sm text-zinc-500">Set your weekly schedule and block off dates</p>

      {/* Weekly schedule */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {availability.map((day) => (
              <div key={day.id} className="flex items-center gap-4 rounded-md border border-zinc-100 p-3">
                <button
                  onClick={() => toggleDay(day)}
                  disabled={saving}
                  className={`w-28 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    day.is_working
                      ? 'bg-black text-white'
                      : 'bg-zinc-100 text-zinc-400'
                  }`}
                >
                  {DAY_NAMES[day.day_of_week]}
                </button>

                {day.is_working ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={day.start_time.slice(0, 5)}
                      onChange={(e) => updateTime(day.id, 'start_time', e.target.value)}
                      className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
                    />
                    <span className="text-zinc-400">to</span>
                    <input
                      type="time"
                      value={day.end_time.slice(0, 5)}
                      onChange={(e) => updateTime(day.id, 'end_time', e.target.value)}
                      className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-zinc-400">Not working</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Blocked dates */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Blocked Dates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500">From</label>
              <input
                type="date"
                value={blockStartDate}
                onChange={(e) => {
                  setBlockStartDate(e.target.value);
                  if (!blockEndDate || e.target.value > blockEndDate) {
                    setBlockEndDate(e.target.value);
                  }
                }}
                className="mt-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500">To</label>
              <input
                type="date"
                value={blockEndDate}
                min={blockStartDate}
                onChange={(e) => setBlockEndDate(e.target.value)}
                className="mt-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500">Reason (optional)</label>
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="E.g. Holiday, Convention"
                className="mt-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
              />
            </div>
            <Button size="sm" onClick={addBlockedDates}>
              <Plus size={14} /> Block Dates
            </Button>
          </div>

          {groupedBlocks.length > 0 && (
            <div className="mt-4 space-y-2">
              {groupedBlocks.map((group, i) => (
                <div key={i} className="flex items-center justify-between rounded-md bg-red-50 px-3 py-2">
                  <div>
                    <span className="text-sm font-medium">
                      {formatDate(group.startDate)}
                      {group.startDate !== group.endDate && (
                        <> — {formatDate(group.endDate)}</>
                      )}
                    </span>
                    {group.startDate !== group.endDate && (
                      <span className="ml-2 text-xs text-zinc-400">
                        ({group.ids.length} days)
                      </span>
                    )}
                    {group.reason && <span className="ml-2 text-sm text-zinc-500">{group.reason}</span>}
                  </div>
                  <button onClick={() => removeBlockedGroup(group.ids)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
