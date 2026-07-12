import type { FastingType } from '../types';

export const FASTING_TYPES: FastingType[] = [
  {
    id: '12-12',
    name: '12/12',
    fastHours: 12,
    eatHours: 12,
    description: 'Fast 12 hrs, eat within 12 hrs',
    color: '#4ade80',
  },
  {
    id: '14-10',
    name: '14/10',
    fastHours: 14,
    eatHours: 10,
    description: 'Fast 14 hrs, eat within 10 hrs',
    color: '#34d399',
  },
  {
    id: '16-8',
    name: '16/8',
    fastHours: 16,
    eatHours: 8,
    description: 'Fast 16 hrs, eat within 8 hrs',
    color: '#60a5fa',
  },
  {
    id: '18-6',
    name: '18/6',
    fastHours: 18,
    eatHours: 6,
    description: 'Fast 18 hrs, eat within 6 hrs',
    color: '#818cf8',
  },
  {
    id: '20-4',
    name: '20/4',
    fastHours: 20,
    eatHours: 4,
    description: 'Fast 20 hrs, eat within 4 hrs',
    color: '#a78bfa',
  },
  {
    id: 'omad',
    name: 'OMAD',
    fastHours: 23,
    eatHours: 1,
    description: 'One Meal A Day — fast ~23 hrs',
    color: '#fb923c',
  },
  {
    id: 'complete',
    name: 'Complete',
    fastHours: 24,
    eatHours: 0,
    description: 'Full 24-hour fast, no eating',
    color: '#f87171',
  },
];

export function getFastingType(id: string): FastingType | undefined {
  return FASTING_TYPES.find(t => t.id === id);
}
