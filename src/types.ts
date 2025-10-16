import type { DateValue } from '@internationalized/date';

/**
 * Frequency values according to RFC 5545
 */
export const Frequencies = {
  YEARLY: 'YEARLY',
  MONTHLY: 'MONTHLY',
  WEEKLY: 'WEEKLY',
  DAILY: 'DAILY',
  HOURLY: 'HOURLY',
  MINUTELY: 'MINUTELY',
  SECONDLY: 'SECONDLY',
} as const;

export type Frequency = (typeof Frequencies)[keyof typeof Frequencies];

/**
 * Weekday values according to RFC 5545
 */
export const Weekdays = {
  MO: 'MO',
  TU: 'TU',
  WE: 'WE',
  TH: 'TH',
  FR: 'FR',
  SA: 'SA',
  SU: 'SU',
} as const;

export type Weekday = (typeof Weekdays)[keyof typeof Weekdays];

/**
 * Weekday with optional occurrence (e.g., +1MO, -2FR)
 */
export type WeekdayValue =
  | Weekday
  | {
      weekday: Weekday;
      n: number; // +1 means first occurrence, -1 means last occurrence
    };

/**
 * RRule options according to RFC 5545 (input - accepts various formats)
 */
export interface RRuleOptions {
  freq?: Frequency;
  dtstart?: DateValue;
  interval?: number;
  count?: number;
  until?: DateValue;
  wkst?: string | Weekday;
  bysetpos?: number[];
  bymonth?: number[];
  bymonthday?: number[];
  byyearday?: number[];
  byweekday?: (string | WeekdayValue)[]; // Accepts strings, constants, or objects
  byweekno?: number[];
  byhour?: number[];
  byminute?: number[];
  bysecond?: number[];
}

export interface ParsedRRuleOptions extends RRuleOptions {
  freq: Frequency;
  wkst?: Weekday;
  byweekday?: WeekdayValue[];
}
