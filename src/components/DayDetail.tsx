import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, parseISO } from 'date-fns';
import { db } from '../db/db';
import { getFastingTypeForDate, today } from '../utils/schedule';
import { FASTING_TYPES, getFastingType } from '../data/fastingTypes';
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
  const [fastingTypeOverride, setFastingTypeOverride] = useState<string | null>(null);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (log) {
      setStatus(log.status ?? null);
      setNotes(log.notes ?? '');
      setFastingTypeOverride(log.fastingTypeOverride ?? null);
    } else {
      setStatus(null);
      setNotes('');
      setFastingTypeOverride(null);
    }
    setShowTypePicker(false);
  }, [log]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const scheduledType = schedules ? getFastingTypeForDate(schedules, date) : null;
  const displayType = fastingTypeOverride ? getFastingType(fastingTypeOverride) : scheduledType;
  const hasOverride = fastingTypeOverride !== null && fastingTypeOverride !== scheduledType?.id;

  const todayStr = today();
  const isFuture = date > todayStr;

  const canSave = status !== null || hasOverride;

  async function save() {
    if (!canSave) return;
    setSaving(true);
    const now = new Date().toISOString();
    const data = {
      date,
      ...(status ? { status } : {}),
      ...(hasOverride ? { fastingTypeOverride: fastingTypeOverride! } : {}),
      notes: notes || undefined,
      updatedAt: now,
    };
    if (log) {
      await db.dayLogs.update(log.id!, {
        status: status ?? undefined,
        fastingTypeOverride: hasOverride ? fastingTypeOverride! : undefined,
        notes: notes || undefined,
        updatedAt: now,
      });
    } else {
      await db.dayLogs.add(data);
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

  function selectOverride(id: string) {
    if (id === scheduledType?.id) {
      setFastingTypeOverride(null);
    } else {
      setFastingTypeOverride(id);
    }
    setShowTypePicker(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm mx-auto p-5 pb-8 sm:pb-5">
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

        {/* Fasting type display + override */}
        <div className="mb-5">
          {displayType ? (
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ backgroundColor: displayType.color + '33' }}
            >
              <span
                className="w-4 h-4 rounded-sm flex-shrink-0"
                style={{ backgroundColor: displayType.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-gray-800 text-sm">{displayType.name}</p>
                  {hasOverride && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/70 text-gray-500 font-medium">
                      overridden
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600">{displayType.description}</p>
              </div>
              <button
                onClick={() => setShowTypePicker(p => !p)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium shrink-0"
              >
                {showTypePicker ? 'Cancel' : 'Change'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-100">
              <p className="text-sm text-gray-500">No schedule for this day</p>
              <button
                onClick={() => setShowTypePicker(p => !p)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                {showTypePicker ? 'Cancel' : 'Set type'}
              </button>
            </div>
          )}

          {/* Type picker */}
          {showTypePicker && (
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {FASTING_TYPES.map(ft => {
                const isSelected = (fastingTypeOverride ?? scheduledType?.id) === ft.id;
                const isScheduled = ft.id === scheduledType?.id;
                return (
                  <button
                    key={ft.id}
                    onClick={() => selectOverride(ft.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-left transition-colors ${
                      isSelected
                        ? 'border-transparent text-white'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    style={isSelected ? { backgroundColor: ft.color } : {}}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : ft.color }}
                    />
                    <div className="min-w-0">
                      <span className={`text-xs font-semibold block ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                        {ft.name}
                      </span>
                      {isScheduled && (
                        <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                          scheduled
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              {hasOverride && (
                <button
                  onClick={() => { setFastingTypeOverride(null); setShowTypePicker(false); }}
                  className="col-span-2 py-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Reset to scheduled type
                </button>
              )}
            </div>
          )}
        </div>

        {/* Logging (past + today only) */}
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
          </>
        )}

        {isFuture && hasOverride && (
          <p className="text-xs text-gray-400 mb-4">
            Override saved — this day will show the new type on the calendar.
          </p>
        )}

        <div className="flex gap-2">
          {log && (
            <button
              onClick={clearLog}
              className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              Clear
            </button>
          )}
          {canSave && (
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-40 hover:bg-blue-700 transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
          {!canSave && !log && (
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-500 text-sm font-medium"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
