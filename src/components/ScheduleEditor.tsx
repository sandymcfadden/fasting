import { useState, useEffect, useCallback } from 'react';
import { db } from '../db/db';
import type { Schedule, ScheduleSegment } from '../types';
import { FASTING_TYPES } from '../data/fastingTypes';
import { today } from '../utils/schedule';

interface Props {
  onClose: () => void;
}

function emptySegment(): ScheduleSegment {
  return { fastingTypeId: '16-8', days: 1 };
}

export function ScheduleEditor({ onClose }: Props) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(today());
  const [pattern, setPattern] = useState<ScheduleSegment[]>([emptySegment()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cycleLength = pattern.reduce((s, seg) => s + seg.days, 0);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  function addSegment() {
    setPattern(p => [...p, emptySegment()]);
  }

  function removeSegment(i: number) {
    setPattern(p => p.filter((_, idx) => idx !== i));
  }

  function updateSegment(i: number, field: keyof ScheduleSegment, value: string | number) {
    setPattern(p => p.map((seg, idx) => idx === i ? { ...seg, [field]: value } : seg));
  }

  async function save() {
    if (!startDate) { setError('Start date is required.'); return; }
    if (pattern.length === 0) { setError('Add at least one fasting segment.'); return; }
    if (pattern.some(s => s.days < 1)) { setError('Each segment needs at least 1 day.'); return; }

    setSaving(true);
    const schedule: Schedule = {
      name: name.trim() || `Schedule from ${startDate}`,
      startDate,
      pattern,
      createdAt: new Date().toISOString(),
    };
    await db.schedules.add(schedule);
    setSaving(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md mx-auto p-5 pb-8 sm:pb-5 max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-900">New Schedule</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Summer 16/8"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Starts on</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Pattern</label>
              {cycleLength > 0 && (
                <span className="text-xs text-gray-400">
                  {cycleLength === 1 ? 'Repeats daily' : `${cycleLength}-day cycle`}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {pattern.map((seg, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={seg.fastingTypeId}
                    onChange={e => updateSegment(i, 'fastingTypeId', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {FASTING_TYPES.map(ft => (
                      <option key={ft.id} value={ft.id}>{ft.name} — {ft.description}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={seg.days}
                      onChange={e => updateSegment(i, 'days', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 px-2 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <span className="text-xs text-gray-400">d</span>
                  </div>
                  {pattern.length > 1 && (
                    <button
                      onClick={() => removeSegment(i)}
                      className="text-gray-300 hover:text-red-400 p-1 rounded"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addSegment}
              className="mt-2 w-full py-2 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
            >
              + Add segment
            </button>
          </div>

          {/* Pattern preview */}
          {pattern.length > 1 && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-medium text-gray-600 mb-2">Preview (first cycle)</p>
              <div className="flex flex-wrap gap-1">
                {pattern.map((seg, i) => {
                  const ft = FASTING_TYPES.find(t => t.id === seg.fastingTypeId);
                  return Array.from({ length: Math.min(seg.days, 14) }).map((_, d) => (
                    <span
                      key={`${i}-${d}`}
                      className="w-5 h-5 rounded-sm"
                      style={{ backgroundColor: ft?.color ?? '#e5e7eb' }}
                      title={`${ft?.name} day ${d + 1}`}
                    />
                  ));
                })}
                {cycleLength > 28 && (
                  <span className="text-xs text-gray-400 self-center">+{cycleLength - 28} more…</span>
                )}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={save}
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-40 hover:bg-blue-700 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
