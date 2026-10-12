import { useState } from 'react';
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

export function StatsBar() {
  const todayStr = today();
  const [preset, setPreset] = useState<Preset>('30d');
  const [customStart, setCustomStart] = useState(() => format(subDays(new Date(), 29), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd]     = useState(todayStr);

  function getRange() {
    const now = new Date();
    if (preset === '7d')  return { start: format(subDays(now, 6),  'yyyy-MM-dd'), end: todayStr };
    if (preset === '30d') return { start: format(subDays(now, 29), 'yyyy-MM-dd'), end: todayStr };
    if (preset === '90d') return { start: format(subDays(now, 89), 'yyyy-MM-dd'), end: todayStr };
    if (preset === 'all') return { start: '2000-01-01', end: todayStr };
    return { start: customStart, end: customEnd };
  }

  const { start, end } = getRange();
  const effectiveEnd = end > todayStr ? todayStr : end;

  const logs = useLiveQuery(
    () => start <= effectiveEnd
      ? db.dayLogs.where('date').between(start, effectiveEnd, true, true).toArray()
      : Promise.resolve([] as DayLog[]),
    [start, effectiveEnd],
  );

  const completed  = logs?.filter(l => l.status === 'completed').length ?? 0;
  const partial    = logs?.filter(l => l.status === 'partial').length   ?? 0;
  const skipped    = logs?.filter(l => l.status === 'skipped').length   ?? 0;
  const totalDays  = start <= effectiveEnd
    ? differenceInDays(parseISO(effectiveEnd), parseISO(start)) + 1
    : 0;
  const notLogged  = Math.max(0, totalDays - completed - partial - skipped);

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
            className="px-2 py-1 rounded-lg border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={e => setCustomEnd(e.target.value)}
            className="px-2 py-1 rounded-lg border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
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
