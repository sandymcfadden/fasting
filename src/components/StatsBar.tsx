import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';
import { db } from '../db/db';
import { today } from '../utils/schedule';
import type { DayLog } from '../types';

type Preset = '7d' | '30d' | '90d' | 'all' | 'custom';

const PRESETS: { key: Preset; label: string }[] = [
  { key: '7d',     label: '7 days' },
  { key: '30d',    label: '30 days' },
  { key: '90d',    label: '90 days' },
  { key: 'all',    label: 'All time' },
  { key: 'custom', label: 'Custom' },
];

const STORAGE_KEY = 'statsBar';

function loadSaved(): { preset?: Preset; customStart?: string; customEnd?: string } {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); } catch { return {}; }
}

function calcStreak(logs: DayLog[], todayStr: string): number {
  const logMap = new Map(logs.map(l => [l.date, l.status]));
  let count = 0;
  let d = new Date();
  while (true) {
    const dateStr = format(d, 'yyyy-MM-dd');
    if (dateStr > todayStr) { d = subDays(d, 1); continue; }
    const status = logMap.get(dateStr);
    if (status === 'completed' || status === 'partial') {
      count++;
      d = subDays(d, 1);
    } else if (dateStr === todayStr && status == null) {
      // Today not yet logged — don't break the streak
      d = subDays(d, 1);
    } else {
      break;
    }
  }
  return count;
}

export function StatsBar() {
  const todayStr = today();
  const saved = useMemo(loadSaved, []);

  const [preset, setPreset]           = useState<Preset>(saved.preset ?? '30d');
  const [customStart, setCustomStart] = useState(saved.customStart ?? format(subDays(new Date(), 29), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd]     = useState(saved.customEnd   ?? '__today__');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ preset, customStart, customEnd }));
  }, [preset, customStart, customEnd]);

  const allLogs = useLiveQuery(() => db.dayLogs.orderBy('date').toArray(), []);

  const firstDate = allLogs?.[0]?.date ?? todayStr;

  const resolvedEnd = customEnd === '__today__' ? todayStr : customEnd;

  function getRange() {
    const now = new Date();
    if (preset === '7d')  return { start: format(subDays(now, 6),  'yyyy-MM-dd'), end: todayStr };
    if (preset === '30d') return { start: format(subDays(now, 29), 'yyyy-MM-dd'), end: todayStr };
    if (preset === '90d') return { start: format(subDays(now, 89), 'yyyy-MM-dd'), end: todayStr };
    if (preset === 'all') return { start: firstDate, end: todayStr };
    return { start: customStart, end: resolvedEnd };
  }

  const { start, end } = getRange();
  const effectiveEnd = end > todayStr ? todayStr : end;

  const logs = useLiveQuery(
    () => start <= effectiveEnd
      ? db.dayLogs.where('date').between(start, effectiveEnd, true, true).toArray()
      : Promise.resolve([] as DayLog[]),
    [start, effectiveEnd],
  );

  const completed = logs?.filter(l => l.status === 'completed').length ?? 0;
  const partial   = logs?.filter(l => l.status === 'partial').length   ?? 0;
  const skipped   = logs?.filter(l => l.status === 'skipped').length   ?? 0;
  const totalDays = start <= effectiveEnd
    ? differenceInDays(parseISO(effectiveEnd), parseISO(start)) + 1
    : 0;
  const notLogged = Math.max(0, totalDays - completed - partial - skipped);

  const streak = useMemo(
    () => allLogs ? calcStreak(allLogs, todayStr) : 0,
    [allLogs, todayStr],
  );

  const inputCls = 'px-2 py-1 rounded-lg border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400';

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <p className="text-xs font-medium text-gray-500 mb-2">Stats</p>

      <div className="flex flex-wrap gap-1 mb-3">
        {PRESETS.map(p => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              preset === p.key
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {preset === 'custom' && (
        <div className="flex flex-wrap gap-2 items-center mb-3">
          <input
            type="date"
            value={customStart}
            onChange={e => setCustomStart(e.target.value)}
            className={inputCls}
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={customEnd === '__today__' ? todayStr : customEnd}
            onChange={e => setCustomEnd(e.target.value)}
            disabled={customEnd === '__today__'}
            className={`${inputCls} ${customEnd === '__today__' ? 'opacity-50' : ''}`}
          />
          <button
            onClick={() => setCustomEnd(v => v === '__today__' ? todayStr : '__today__')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              customEnd === '__today__'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Today
          </button>
        </div>
      )}

      {streak > 0 && (
        <div className="flex items-center justify-between mb-3 px-3 py-2 bg-orange-50 rounded-xl border border-orange-100">
          <span className="text-xs text-gray-500">Current streak</span>
          <span className="text-sm font-bold text-orange-600">
            {streak} {streak === 1 ? 'day' : 'days'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {([
          { label: 'Completed', value: completed, color: 'text-green-600',  icon: '✓' },
          { label: 'Partial',   value: partial,   color: 'text-yellow-500', icon: '~' },
          { label: 'Skipped',   value: skipped,   color: 'text-red-400',    icon: '✗' },
          { label: 'Not logged',value: notLogged, color: 'text-gray-400',   icon: '·' },
        ] as const).map(({ label, value, color, icon }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-2.5 text-center">
            <div className={`text-xl font-bold ${color}`}>{value}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{icon} {label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
