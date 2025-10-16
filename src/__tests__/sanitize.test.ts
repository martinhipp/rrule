import { CalendarDate } from '@internationalized/date';
import { describe, expect, it } from 'vitest';
import {
  sanitizeFrequency,
  sanitizeNumber,
  sanitizeNumberArray,
  sanitizeRRuleOptions,
  sanitizeUntilDate,
  sanitizeWeekday,
  sanitizeWeekdayValue,
  sanitizeWeekdayValueArray,
} from '../sanitize';
import type { Frequency } from '../types';
import { Frequencies, Weekdays } from '../types';

describe('sanitizeFrequency', () => {
  it('should return the frequency if it is valid', () => {
    expect(sanitizeFrequency('YEARLY')).toBe(Frequencies.YEARLY);
    expect(sanitizeFrequency('MONTHLY')).toBe(Frequencies.MONTHLY);
    expect(sanitizeFrequency('WEEKLY')).toBe(Frequencies.WEEKLY);
    expect(sanitizeFrequency('DAILY')).toBe(Frequencies.DAILY);
    expect(sanitizeFrequency('HOURLY')).toBe(Frequencies.HOURLY);
    expect(sanitizeFrequency('MINUTELY')).toBe(Frequencies.MINUTELY);
    expect(sanitizeFrequency('SECONDLY')).toBe(Frequencies.SECONDLY);
  });

  it('should return YEARLY as default when undefined', () => {
    expect(sanitizeFrequency(undefined)).toBe(Frequencies.YEARLY);
  });

  it('should throw error for invalid frequency', () => {
    expect(() => sanitizeFrequency('INVALID' as Frequency)).toThrow(
      'Invalid frequency: INVALID',
    );
    expect(() => sanitizeFrequency('FORTNIGHTLY' as Frequency)).toThrow(
      'Invalid frequency: FORTNIGHTLY',
    );
  });
});

describe('sanitizeNumber', () => {
  it('should return the number if it is valid', () => {
    expect(sanitizeNumber(1)).toBe(1);
    expect(sanitizeNumber(1, 5)).toBe(5);
    expect(sanitizeNumber(0, 0, 10, false)).toBeUndefined();
    expect(sanitizeNumber(0, 0, 10, true)).toBe(0);
    expect(sanitizeNumber(11, 0, 10)).toBe(10);
    expect(sanitizeNumber(-1, 0, 10)).toBe(0);
  });
});

describe('sanitizeNumberArray', () => {
  it('should return the array if it is valid', () => {
    expect(sanitizeNumberArray([1, 2, 3])).toEqual([1, 2, 3]);
    expect(sanitizeNumberArray([1, 2, 3], 2)).toEqual([2, 3]);
    expect(sanitizeNumberArray([-2, 0, 2, 3], -1, 2, true)).toEqual([0, 2]);
    expect(sanitizeNumberArray([0, 1, 2, 3], 1, 10, false)).toEqual([1, 2, 3]);
  });
});

describe('sanitizeUntilDate', () => {
  it('should return the date if it is valid', () => {
    const start = new CalendarDate(2025, 1, 1);
    const until = new CalendarDate(2025, 12, 31);

    expect(sanitizeUntilDate(until)).toBe(until);
    expect(sanitizeUntilDate(until, start)).toBe(until);
    expect(sanitizeUntilDate(start, start)).toBe(start);
  });

  it('should throw error when UNTIL is before DTSTART', () => {
    const start = new CalendarDate(2025, 12, 31);
    const until = new CalendarDate(2025, 1, 1);

    expect(() => sanitizeUntilDate(until, start)).toThrow(
      'UNTIL must be greater than or equal to DTSTART',
    );
  });
});

describe('sanitizeWeekday', () => {
  it('should return the weekday if it is valid', () => {
    expect(sanitizeWeekday('MO')).toEqual(Weekdays.MO);
    expect(sanitizeWeekday('TU')).toEqual(Weekdays.TU);
    expect(sanitizeWeekday('WE')).toEqual(Weekdays.WE);
    expect(sanitizeWeekday('TH')).toEqual(Weekdays.TH);
    expect(sanitizeWeekday('FR')).toEqual(Weekdays.FR);
    expect(sanitizeWeekday('SA')).toEqual(Weekdays.SA);
    expect(sanitizeWeekday('SU')).toEqual(Weekdays.SU);
  });

  it('should return undefined if the weekday is invalid', () => {
    expect(sanitizeWeekday('INVALID')).toBeUndefined();
  });
});

describe('sanitizeWeekdayValue', () => {
  it('should return simple weekday constants as-is', () => {
    expect(sanitizeWeekdayValue(Weekdays.MO)).toBe(Weekdays.MO);
    expect(sanitizeWeekdayValue(Weekdays.FR)).toBe(Weekdays.FR);
  });

  it('should return weekday objects with occurrence as-is', () => {
    const value = { weekday: Weekdays.MO, n: 2 };
    expect(sanitizeWeekdayValue(value)).toBe(value);
  });

  it('should parse simple weekday strings', () => {
    expect(sanitizeWeekdayValue('MO')).toBe(Weekdays.MO);
    expect(sanitizeWeekdayValue('WE')).toBe(Weekdays.WE);
    expect(sanitizeWeekdayValue('FR')).toBe(Weekdays.FR);
  });

  it('should parse weekday strings with positive occurrence', () => {
    expect(sanitizeWeekdayValue('2MO')).toEqual({ weekday: Weekdays.MO, n: 2 });
    expect(sanitizeWeekdayValue('+1FR')).toEqual({
      weekday: Weekdays.FR,
      n: 1,
    });
  });

  it('should parse weekday strings with negative occurrence', () => {
    expect(sanitizeWeekdayValue('-1FR')).toEqual({
      weekday: Weekdays.FR,
      n: -1,
    });
    expect(sanitizeWeekdayValue('-2TU')).toEqual({
      weekday: Weekdays.TU,
      n: -2,
    });
  });

  it('should return undefined for invalid strings', () => {
    expect(sanitizeWeekdayValue('INVALID')).toBeUndefined();
    expect(sanitizeWeekdayValue('2XX')).toBeUndefined();
    expect(sanitizeWeekdayValue('999MO')).toBeUndefined();
  });

  it('should return undefined when value is undefined', () => {
    expect(sanitizeWeekdayValue(undefined)).toBeUndefined();
  });
});

describe('sanitizeWeekdayValueArray', () => {
  it('should return undefined when array is undefined', () => {
    expect(sanitizeWeekdayValueArray(undefined)).toBeUndefined();
  });

  it('should sanitize all values in the array', () => {
    expect(
      sanitizeWeekdayValueArray([
        Weekdays.MO,
        'TU',
        '2WE',
        { weekday: Weekdays.TH, n: -1 },
      ]),
    ).toEqual([
      Weekdays.MO,
      Weekdays.TU,
      { weekday: Weekdays.WE, n: 2 },
      { weekday: Weekdays.TH, n: -1 },
    ]);
  });

  it('should filter out invalid values', () => {
    expect(sanitizeWeekdayValueArray(['MO', 'INVALID', '2XX', 'FR'])).toEqual([
      Weekdays.MO,
      Weekdays.FR,
    ]);
  });

  it('should deduplicate weekday values', () => {
    expect(sanitizeWeekdayValueArray(['MO', 'MO', '2TU', '2TU', 'WE'])).toEqual(
      [Weekdays.MO, { weekday: Weekdays.TU, n: 2 }, Weekdays.WE],
    );
  });

  it('should handle empty array', () => {
    expect(sanitizeWeekdayValueArray([])).toEqual([]);
  });
});

describe('sanitizeRRuleOptions', () => {
  it('should throw when COUNT and UNTIL are both provided', () => {
    expect(() =>
      sanitizeRRuleOptions({
        freq: 'DAILY',
        dtstart: new CalendarDate(2025, 1, 1),
        count: 10,
        until: new CalendarDate(2025, 12, 31),
      }),
    ).toThrow('COUNT and UNTIL are mutually exclusive');
  });

  it('should throw when UNTIL is before DTSTART', () => {
    expect(() =>
      sanitizeRRuleOptions({
        freq: 'DAILY',
        dtstart: new CalendarDate(2025, 1, 10),
        until: new CalendarDate(2025, 1, 1),
      }),
    ).toThrow('UNTIL must be greater than or equal to DTSTART');
  });

  it('should sanitize all BY* rules correctly', () => {
    const result = sanitizeRRuleOptions({
      freq: 'YEARLY',
      dtstart: new CalendarDate(2025, 1, 1),
      bymonth: [0, 1, 13], // 0 and 13 invalid
      bymonthday: [-32, -1, 0, 1, 32], // -32, 0, 32 invalid
      byhour: [0, 12, 23, 24], // 24 invalid
      byminute: [0, 30, 59, 60], // 60 invalid
      bysecond: [0, 30, 59, 60], // 60 invalid
      byweekday: ['MO', 'INVALID', '2TU'],
    });

    expect(result.bymonth).toEqual([1]);
    expect(result.bymonthday).toEqual([-1, 1]);
    expect(result.byhour).toEqual([0, 12, 23]);
    expect(result.byminute).toEqual([0, 30, 59]);
    expect(result.bysecond).toEqual([0, 30, 59]);
    expect(result.byweekday).toHaveLength(2);
    expect(result.byweekday?.[0]).toBe(Weekdays.MO);
    expect(result.byweekday?.[1]).toEqual({ weekday: Weekdays.TU, n: 2 });
  });

  it('should throw when BYSETPOS is used without other BYxxx rules', () => {
    expect(() =>
      sanitizeRRuleOptions({
        freq: 'DAILY',
        dtstart: new CalendarDate(2025, 1, 1),
        bysetpos: [1, -1],
      }),
    ).toThrow('BYSETPOS must be used with another BYxxx rule');
  });
});
