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
  id?: number;
  name: string;
  startDate: string; // YYYY-MM-DD
  pattern: ScheduleSegment[];
  createdAt: string;
}

export type DayStatus = 'completed' | 'partial' | 'skipped';

export interface DayLog {
  id?: number;
  date: string; // YYYY-MM-DD, unique index
  status: DayStatus;
  notes?: string;
  updatedAt: string;
}
