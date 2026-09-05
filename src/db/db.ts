import Dexie, { type Table } from 'dexie';
import dexieCloud from 'dexie-cloud-addon';
import type { Schedule, DayLog } from '../types';

const db = new Dexie('FastingCalendarDB', { addons: [dexieCloud] }) as Dexie & {
  schedules: Table<Schedule, string>;
  dayLogs: Table<DayLog, string>;
};

db.version(1).stores({
  schedules: '++id, startDate',
  dayLogs: '++id, &date',
});

// Migrate from auto-increment integer ids to Dexie Cloud UUID string ids
db.version(2).stores({
  schedules: '@id, startDate',
  dayLogs: '@id, &date',
}).upgrade(async tx => {
  const schedules = await tx.table('schedules').toArray();
  await tx.table('schedules').clear();
  if (schedules.length > 0) {
    await tx.table('schedules').bulkAdd(
      schedules.map(({ id: _id, ...rest }) => ({ ...rest, id: crypto.randomUUID() }))
    );
  }
  const dayLogs = await tx.table('dayLogs').toArray();
  await tx.table('dayLogs').clear();
  if (dayLogs.length > 0) {
    await tx.table('dayLogs').bulkAdd(
      dayLogs.map(({ id: _id, ...rest }) => ({ ...rest, id: crypto.randomUUID() }))
    );
  }
});

if (import.meta.env.VITE_DEXIE_CLOUD_URL) {
  db.cloud.configure({
    databaseUrl: import.meta.env.VITE_DEXIE_CLOUD_URL,
    requireAuth: false,
  });
}

export { db };
