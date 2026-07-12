import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, parseISO } from 'date-fns';
import { db } from '../db/db';
import { getFastingTypeForDate, today } from '../utils/schedule';
import type { DayStatus } from '../types';

interface Props {
  date: string;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: DayStatus; label: string; emoji: string; activeClass: string }[] = [
  { value: 'completed', label: 'Completed', emoji: '✓', activeClass: 'bg-green-500 text-white' },
  { value: 'partial', label: 'Partial', emoji: '~', activeClass: 'bg-yellow-400 text-white' },
  { value: 'skipped', label: 'Skipped', emoji: '✗', activeClass: 'bg-red-400 text-white' },
];

export function DayDetail({ date, onClose }: Props) {
  const schedules = useLiveQuery(() => db.schedules.toArray(), []);
  const log = useLiveQuery(() => db.dayLogs.where('date').equals(date).first(), [date]);

  const [status, setStatus] = useState<DayStatus | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (log) {
      setStatus(log.status);
      setNotes(log.notes ?? '');
    } else {
      setStatus(null);
      setNotes('');
    }
  }, [log]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const fastingType = schedules ? getFastingTypeForDate(schedules, date) : null;
  const todayStr = today();
  const isFuture = date > todayStr;

  async function save() {
    if (!status) return;
    setSaving(true);
    const now = new Date().toISOString();
    if (log) {
      await db.dayLogs.update(log.id!, { status, notes: notes || undefined, updatedAt: now });
    } else {
      await db.dayLogs.add({ date, status, notes: notes || undefined, updatedAt: now });
    }
    setSaving(false);
    onClose();
  }

  async function clearLog() {
    if (log) {
      await db.dayLogs.delete(log.id!);
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm mx-auto p-5 pb-8 sm:pb-5">
        {/* Drag handle (mobile) */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {format(parseISO(date), 'EEEE')}
            </p>
            <h3 className="text-xl font-semibold text-gray-900">
              {format(parseISO(date), 'MMMM d, yyyy')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 -mt-1 -mr-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {fastingType ? (
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-5"
            style={{ backgroundColor: fastingType.color + '33' }}
          >
            <span
              className="w-4 h-4 rounded-sm flex-shrink-0"
              style={{ backgroundColor: fastingType.color }}
            />
            <div>
              <p className="font-semibold text-gray-800 text-sm">
                {fastingType.name}
              </p>
              <p className="text-xs text-gray-600">{fastingType.description}</p>
            </div>
          </div>
        ) : (
          <div className="px-3 py-2.5 rounded-xl bg-gray-100 mb-5">
            <p className="text-sm text-gray-500">No schedule for this day</p>
          </div>
        )}

        {!isFuture && (
          <>
            <p className="text-xs font-medium text-gray-600 mb-2">How did it go?</p>
            <div className="flex gap-2 mb-4">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(s => s === opt.value ? null : opt.value)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                    status === opt.value
                      ? opt.activeClass + ' border-transparent'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-base leading-none mb-0.5">{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>

            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
            />

            <div className="flex gap-2">
              {log && (
                <button
                  onClick={clearLog}
                  className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                onClick={save}
                disabled={!status || saving}
                className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-40 hover:bg-blue-700 transition-colors"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </>
        )}

        {isFuture && (
          <p className="text-sm text-gray-400 text-center py-2">
            Can't log a future day yet.
          </p>
        )}
      </div>
    </div>
  );
}
