import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, parseISO } from 'date-fns';
import { db } from '../db/db';
import type { Schedule } from '../types';
import { FASTING_TYPES } from '../data/fastingTypes';
import { ScheduleEditor } from './ScheduleEditor';
import { DataPortability } from './DataPortability';
import { today } from '../utils/schedule';

function ScheduleCard({ schedule, isCurrent, onDelete }: {
  schedule: Schedule;
  isCurrent: boolean;
  onDelete: () => void;
}) {
  const cycleLength = schedule.pattern.reduce((s, seg) => s + seg.days, 0);

  return (
    <div className={`rounded-2xl border p-4 ${isCurrent ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 text-sm">{schedule.name}</h4>
            {isCurrent && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">Active</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Started {format(parseISO(schedule.startDate), 'MMM d, yyyy')}
            {' · '}
            {cycleLength === 1 ? 'Daily' : `${cycleLength}-day cycle`}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="text-gray-300 hover:text-red-400 transition-colors text-sm p-1"
          title="Delete schedule"
        >
          ✕
        </button>
      </div>

      <div className="space-y-1.5">
        {schedule.pattern.map((seg, i) => {
          const ft = FASTING_TYPES.find(t => t.id === seg.fastingTypeId);
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: ft?.color ?? '#e5e7eb' }} />
              <span className="text-sm text-gray-700 font-medium">{ft?.name ?? seg.fastingTypeId}</span>
              <span className="text-xs text-gray-400">
                {seg.days === 1 ? 'every day' : `for ${seg.days} days`}
              </span>
              <span className="text-xs text-gray-400 hidden sm:inline">— {ft?.description}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ScheduleList() {
  const [showEditor, setShowEditor] = useState(false);
  const todayStr = today();

  const schedules = useLiveQuery(
    () => db.schedules.orderBy('startDate').reverse().toArray(),
    [],
  );

  async function deleteSchedule(s: Schedule) {
    if (confirm(`Delete "${s.name}"? This won't affect logged days.`)) {
      await db.schedules.delete(s.id!);
    }
  }

  const currentSchedule = schedules?.find(s => s.startDate <= todayStr) ?? null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">Schedules</h2>
        <button
          onClick={() => setShowEditor(true)}
          className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + New
        </button>
      </div>

      {schedules?.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-medium">No schedules yet</p>
          <p className="text-sm mt-1">Create one to start planning your fasting calendar.</p>
        </div>
      )}

      <div className="space-y-3">
        {schedules?.map(s => (
          <ScheduleCard
            key={s.id}
            schedule={s}
            isCurrent={s.id === currentSchedule?.id}
            onDelete={() => deleteSchedule(s)}
          />
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-2xl text-xs text-gray-500 space-y-1">
        <p className="font-medium text-gray-600">How schedules work</p>
        <p>Each schedule runs from its start date until a newer one takes over. Past days keep their original schedule so your history stays accurate.</p>
        <p>To change your fasting plan, just create a new schedule with tomorrow's date.</p>
      </div>

      <DataPortability />

      {showEditor && <ScheduleEditor onClose={() => setShowEditor(false)} />}
    </div>
  );
}
