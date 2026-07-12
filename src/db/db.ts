import Dexie, { type Table } from 'dexie';
import type { Schedule, DayLog } from '../types';

class FastingDB extends Dexie {
  schedules!: Table<Schedule>;
  dayLogs!: Table<DayLog>;

  constructor() {
    super('FastingCalendarDB');
    this.version(1).stores({
      schedules: '++id, startDate',
      dayLogs: '++id, &date',
    });
  }
}

export const db = new FastingDB();
