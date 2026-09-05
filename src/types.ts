export interface FastingType {
  id: string;
  name: string;
  fastHours: number;
  eatHours: number;
  description: string;
  color: string;
}

export interface ScheduleSegment {
  fastingTypeId: string;
  days: number;
}

export interface Schedule {
  id?: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  pattern: ScheduleSegment[];
  createdAt: string;
}

export type DayStatus = 'completed' | 'partial' | 'skipped';

export interface DayLog {
  id?: string;
  date: string; // YYYY-MM-DD, unique index
  status?: DayStatus;
  fastingTypeOverride?: string;
  fastingTypeId?: string; // effective type at save time — preserved if schedule is later deleted
  notes?: string;
  updatedAt: string;
}
