import type { DateValue } from '@internationalized/date';
import { parseWeekday, parseWeekdayValue } from './parse';
import type {
  Frequency,
  ParsedRRuleOptions,
  RRuleOptions,
  Weekday,
  WeekdayValue,
} from './types';
import { Frequencies } from './types';
import {
  isFrequency,
  isWeekday,
  isWeekdayValue,
  unique,
  uniqueWeekdayValues,
} from './utils';

/**
 * Sanitize a frequency.
 *
 * If no frequency is passed, defaults to YEARLY.
 *
 * @param value - The frequency to sanitize
 * @returns The sanitized frequency (defaults to YEARLY)
 * @throws {Error} If the frequency passed is invalid
 */
export function sanitizeFrequency(value?: Frequency) {
  if (value === undefined) {
    return Frequencies.YEARLY;
  }

  if (!isFrequency(value)) {
    throw new Error(`Invalid frequency: ${value}`);
  }

  return value;
}

/**
 * Sanitize a number.
 *
 * @param value - The number to sanitize
 * @param min - The minimum value
 * @param max - The maximum value
 * @param allowZero - Whether to allow zero
 * @returns The sanitized number
 */
export function sanitizeNumber(
  value?: number,
  min?: number,
  max?: number,
  allowZero = false,
) {
  if (value === undefined || (!allowZero && value === 0)) {
    return;
  }

  if (max !== undefined && value > max) {
    value = max;
  }

  if (min !== undefined && value < min) {
    value = min;
  }

  return Math.trunc(value);
}

/**
 * Sanitize an array of numbers.
 *
 * @param values - The array of numbers to sanitize
 * @param min - The minimum value
 * @param max - The maximum value
 * @param allowZero - Allow zero (default: false)
 * @returns The sanitized array of numbers
 */
export function sanitizeNumberArray(
  values?: number[],
  min?: number,
  max?: number,
  allowZero = false,
) {
  if (values === undefined) {
    return;
  }

  const sanitized = values.filter((value) => {
    if (!allowZero && value === 0) {
      return false;
    }

    if (max !== undefined && value > max) {
      return false;
    }

    if (min !== undefined && value < min) {
      return false;
    }

    return true;
  });

  return unique(sanitized);
}

/**
 * Sanitize an until date.
 *
 * @param value - The until date to sanitize
 * @param start - The dtstart date to compare against
 * @returns The sanitized until date
 * @throws {Error} If UNTIL is before DTSTART
 */
export function sanitizeUntilDate(value?: DateValue, start?: DateValue) {
  if (!start) {
    return value;
  }

  if (value !== undefined && value.compare(start) < 0) {
    throw new Error('UNTIL must be greater than or equal to DTSTART');
  }

  return value;
}

/**
 * Sanitize a weekday.
 *
 * @param value - The weekday to sanitize
 * @returns The sanitized weekday
 */
export function sanitizeWeekday(value?: string | Weekday) {
  if (isWeekday(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      return parseWeekday(value);
    } catch {}
  }

  return;
}

export function sanitizeWeekdayValue(value?: string | WeekdayValue) {
  if (isWeekdayValue(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      return parseWeekdayValue(value);
    } catch {}
  }

  return;
}

/**
 * Sanitize an array of WeekdayValues.
 *
 * Accepts:
 * - Weekday constants: Weekdays.MO
 * - String literals: 'MO', '2MO', '-1FR'
 * - Objects: { weekday: 'MO', n: 2 }
 *
 * @param values - The array of WeekdayValues to sanitize
 * @returns The sanitized array of normalized WeekdayValues (strings are parsed)
 */
export function sanitizeWeekdayValueArray(values?: (string | WeekdayValue)[]) {
  if (values === undefined) {
    return;
  }

  const sanitized: WeekdayValue[] = [];

  for (const value of values) {
    const parsed = sanitizeWeekdayValue(value);

    if (parsed) {
      sanitized.push(parsed);
    }
  }

  return uniqueWeekdayValues(sanitized);
}

/**
 * Validate that BYSETPOS is used with at least one other BYxxx rule.
 * Per RFC 5545, BYSETPOS requires another BYxxx rule to operate on.
 */
export function validateBySetPos(parsed: ParsedRRuleOptions) {
  if (parsed.bysetpos === undefined || parsed.bysetpos.length === 0) {
    return true;
  }

  return (
    (parsed.bymonth && parsed.bymonth.length > 0) ||
    (parsed.bymonthday && parsed.bymonthday.length > 0) ||
    (parsed.byyearday && parsed.byyearday.length > 0) ||
    (parsed.byweekday && parsed.byweekday.length > 0) ||
    (parsed.byweekno && parsed.byweekno.length > 0) ||
    (parsed.byhour && parsed.byhour.length > 0) ||
    (parsed.byminute && parsed.byminute.length > 0) ||
    (parsed.bysecond && parsed.bysecond.length > 0)
  );
}

export function sanitizeRRuleOptions(options: Partial<RRuleOptions>) {
  const parsed: ParsedRRuleOptions = {
    freq: sanitizeFrequency(options.freq),
    dtstart: options.dtstart,
    interval: sanitizeNumber(options.interval, 1),
    count: sanitizeNumber(options.count, 1),
    until: sanitizeUntilDate(options.until, options.dtstart),
    wkst: sanitizeWeekday(options.wkst),
    bysetpos: sanitizeNumberArray(options.bysetpos, -366, 366, false),
    bymonth: sanitizeNumberArray(options.bymonth, 1, 12, false),
    bymonthday: sanitizeNumberArray(options.bymonthday, -31, 31, false),
    byyearday: sanitizeNumberArray(options.byyearday, -366, 366, false),
    byweekday: sanitizeWeekdayValueArray(options.byweekday),
    byweekno: sanitizeNumberArray(options.byweekno, -53, 53, false),
    byhour: sanitizeNumberArray(options.byhour, 0, 23, true),
    byminute: sanitizeNumberArray(options.byminute, 0, 59, true),
    bysecond: sanitizeNumberArray(options.bysecond, 0, 59, true),
  };

  if (parsed.count !== undefined && parsed.until !== undefined) {
    throw new Error('COUNT and UNTIL are mutually exclusive');
  }

  if (!validateBySetPos(parsed)) {
    throw new Error('BYSETPOS must be used with another BYxxx rule');
  }

  return parsed;
}
