import type { Schedule, FastingType } from '../types';
import { FASTING_TYPES } from '../data/fastingTypes';
import { format } from 'date-fns';

function parseLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getFastingTypeForDate(schedules: Schedule[], dateStr: string): FastingType | null {
  if (!schedules.length) return null;

  const applicable = schedules
    .filter(s => s.startDate <= dateStr)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  if (!applicable.length) return null;
  const schedule = applicable[0];

  const start = parseLocal(schedule.startDate);
  const target = parseLocal(dateStr);
  const dayOffset = Math.round((target.getTime() - start.getTime()) / 86_400_000);

  const cycleLength = schedule.pattern.reduce((sum, seg) => sum + seg.days, 0);
  if (cycleLength === 0) return null;

  const posInCycle = dayOffset % cycleLength;

  let accumulated = 0;
  for (const seg of schedule.pattern) {
    accumulated += seg.days;
    if (posInCycle < accumulated) {
      return FASTING_TYPES.find(t => t.id === seg.fastingTypeId) ?? null;
    }
  }

  return null;
}

export function getCalendarDays(year: number, month: number): string[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const endPad = 6 - last.getDay();
  const days: string[] = [];

  for (let i = startPad; i > 0; i--) {
    days.push(format(new Date(year, month, 1 - i), 'yyyy-MM-dd'));
  }
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(format(new Date(year, month, d), 'yyyy-MM-dd'));
  }
  for (let i = 1; i <= endPad; i++) {
    days.push(format(new Date(year, month + 1, i), 'yyyy-MM-dd'));
  }

  return days;
}

export function today(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
