import {
  CalendarDate,
  CalendarDateTime,
  ZonedDateTime,
} from '@internationalized/date';
import { describe, expect, it } from 'vitest';
import {
  parseFrequency,
  parseICSDateValue,
  parseInteger,
  parseIntegerList,
  parseList,
  parsePositiveInteger,
  parseWeekdayValue,
} from '../parse';
import { Frequencies, Weekdays } from '../types';

describe('parseInteger', () => {
  it('should parse integer correctly', () => {
    expect(parseInteger('123')).toBe(123);
    expect(parseInteger('-123')).toBe(-123);
    expect(parseInteger('+123')).toBe(123);
    expect(parseInteger('123.456')).toBe(123);
    expect(parseInteger('0')).toBe(0);
    expect(parseInteger('0123')).toBe(123);
    expect(parseInteger('123abc')).toBe(123);
  });

  it('should return NaN for invalid value', () => {
    expect(parseInteger('abc')).toBeNaN();
    expect(parseInteger('abc123')).toBeNaN();
  });
});

describe('parsePositiveInteger', () => {
  it('should parse positive integer correctly', () => {
    expect(parsePositiveInteger('123')).toBe(123);
    expect(parsePositiveInteger('+123')).toBe(123);
    expect(parsePositiveInteger('0123')).toBe(123);
    expect(parsePositiveInteger('123.456')).toBe(123);
  });

  it('should throw on invalid value', () => {
    expect(() => parsePositiveInteger('-123')).toThrow(
      'Invalid positive integer: -123',
    );
    expect(() => parsePositiveInteger('0')).toThrow(
      'Invalid positive integer: 0',
    );
    expect(() => parsePositiveInteger('abc')).toThrow(
      'Invalid positive integer: abc',
    );
    expect(() => parsePositiveInteger('abc123')).toThrow(
      'Invalid positive integer: abc123',
    );
  });
});

describe('parseList', () => {
  it('should parse list correctly', () => {
    expect(parseList('a,b,c')).toEqual(['a', 'b', 'c']);
    expect(parseList('a,,c')).toEqual(['a', 'c']);
    expect(parseList('1, 2, 3')).toEqual(['1', '2', '3']);
    expect(parseList(' 1, 2, 3, ')).toEqual(['1', '2', '3']);
    expect(parseList('1| 2 |3 | a| b |c', '|')).toEqual([
      '1',
      '2',
      '3',
      'a',
      'b',
      'c',
    ]);
  });

  it('should return empty array for empty string', () => {
    expect(parseList('')).toEqual([]);
    expect(parseList(' ')).toEqual([]);
  });
});

describe('parseIntegerList', () => {
  it('should parse list of integers correctly', () => {
    expect(parseIntegerList('1,2,3')).toEqual([1, 2, 3]);
    expect(parseIntegerList('1,,3')).toEqual([1, 3]);
    expect(parseIntegerList('1, 2, 3')).toEqual([1, 2, 3]);
    expect(parseIntegerList(' 1, 2 , 3 ')).toEqual([1, 2, 3]);
    expect(parseIntegerList('1| 2 |3', '|')).toEqual([1, 2, 3]);
    expect(parseIntegerList('1.25 2.5 3.75', ' ')).toEqual([1, 2, 3]);
    expect(parseIntegerList('a,b,c')).toEqual([]);
    expect(parseIntegerList('1, a, 2, b, 3, c')).toEqual([1, 2, 3]);
  });
});

describe('parseICSDateValue', () => {
  it('should parse date-only value correctly', () => {
    const result = parseICSDateValue('20250101');

    expect(result).toBeInstanceOf(CalendarDate);
    expect(result.year).toBe(2025);
    expect(result.month).toBe(1);
    expect(result.day).toBe(1);
  });

  it('should parse date-time value correctly', () => {
    const result = parseICSDateValue('20250101T101530');

    expect(result).toBeInstanceOf(CalendarDateTime);
    expect(result.year).toBe(2025);
    expect(result.month).toBe(1);
    expect(result.day).toBe(1);
    expect((result as CalendarDateTime).hour).toBe(10);
    expect((result as CalendarDateTime).minute).toBe(15);
    expect((result as CalendarDateTime).second).toBe(30);
  });

  it('should parse UTC date-time value correctly', () => {
    const result = parseICSDateValue('20250101T101530Z');

    expect(result).toBeInstanceOf(ZonedDateTime);
    expect(result.year).toBe(2025);
    expect(result.month).toBe(1);
    expect(result.day).toBe(1);
    expect((result as ZonedDateTime).hour).toBe(10);
    expect((result as ZonedDateTime).minute).toBe(15);
    expect((result as ZonedDateTime).second).toBe(30);
    expect((result as ZonedDateTime).timeZone).toBe('UTC');
    expect((result as ZonedDateTime).offset).toBe(0);
  });

  it('should throw on invalid date value', () => {
    expect(() => parseICSDateValue('2025')).toThrow(
      'Invalid ICS date format: 2025',
    );
    expect(() => parseICSDateValue('202501')).toThrow(
      'Invalid ICS date format: 202501',
    );
    expect(() => parseICSDateValue('20250101T')).toThrow(
      'Invalid ICS date format: 20250101T',
    );
    expect(() => parseICSDateValue('20250101T10')).toThrow(
      'Invalid ICS date format: 20250101T10',
    );
    expect(() => parseICSDateValue('20250101T1015')).toThrow(
      'Invalid ICS date format: 20250101T1015',
    );
    expect(() => parseICSDateValue('20250101T1015Z')).toThrow(
      'Invalid ICS date format: 20250101T1015Z',
    );
    expect(() => parseICSDateValue('2025-01-01')).toThrow(
      'Invalid ICS date format: 2025-01-01',
    );
    expect(() => parseICSDateValue('2025-01-01T10:15:30')).toThrow(
      'Invalid ICS date format: 2025-01-01T10:15:30',
    );
    expect(() => parseICSDateValue('2025-01-01T10:15:30Z')).toThrow(
      'Invalid ICS date format: 2025-01-01T10:15:30Z',
    );
  });
});

describe('parseFrequency', () => {
  it('should parse frequency correctly', () => {
    expect(parseFrequency('YEARLY')).toBe(Frequencies.YEARLY);
    expect(parseFrequency('MONTHLY')).toBe(Frequencies.MONTHLY);
    expect(parseFrequency('WEEKLY')).toBe(Frequencies.WEEKLY);
    expect(parseFrequency('DAILY')).toBe(Frequencies.DAILY);
    expect(parseFrequency('HOURLY')).toBe(Frequencies.HOURLY);
    expect(parseFrequency('MINUTELY')).toBe(Frequencies.MINUTELY);
    expect(parseFrequency('SECONDLY')).toBe(Frequencies.SECONDLY);
  });

  it('should parse frequency case-insensitively', () => {
    expect(parseFrequency('yearly')).toBe(Frequencies.YEARLY);
    expect(parseFrequency('monthly')).toBe(Frequencies.MONTHLY);
    expect(parseFrequency('weekly')).toBe(Frequencies.WEEKLY);
    expect(parseFrequency('daily')).toBe(Frequencies.DAILY);
    expect(parseFrequency('hourly')).toBe(Frequencies.HOURLY);
    expect(parseFrequency('minutely')).toBe(Frequencies.MINUTELY);
    expect(parseFrequency('secondly')).toBe(Frequencies.SECONDLY);
  });

  it('should trim frequency', () => {
    expect(parseFrequency(' YEARLY ')).toBe(Frequencies.YEARLY);
    expect(parseFrequency(' MONTHLY ')).toBe(Frequencies.MONTHLY);
    expect(parseFrequency(' WEEKLY ')).toBe(Frequencies.WEEKLY);
    expect(parseFrequency(' DAILY ')).toBe(Frequencies.DAILY);
    expect(parseFrequency(' HOURLY ')).toBe(Frequencies.HOURLY);
    expect(parseFrequency(' MINUTELY ')).toBe(Frequencies.MINUTELY);
    expect(parseFrequency(' SECONDLY ')).toBe(Frequencies.SECONDLY);
  });

  it('should throw on invalid frequency', () => {
    expect(() => parseFrequency('FORTNIGHTLY')).toThrow(
      'Invalid frequency: FORTNIGHTLY',
    );
    expect(() => parseFrequency('biweekly')).toThrow(
      'Invalid frequency: BIWEEKLY',
    );
    expect(() => parseFrequency('')).toThrow('Invalid frequency');
  });
});

describe('parseWeekdayValue', () => {
  it('should parse simple weekday', () => {
    expect(parseWeekdayValue('MO')).toEqual(Weekdays.MO);
    expect(parseWeekdayValue('FR')).toEqual(Weekdays.FR);
  });

  it('should parse weekday with positive occurrence', () => {
    expect(parseWeekdayValue('+1MO')).toEqual({ weekday: Weekdays.MO, n: 1 });
    expect(parseWeekdayValue('2FR')).toEqual({ weekday: Weekdays.FR, n: 2 });
  });

  it('should parse weekday with negative occurrence', () => {
    expect(parseWeekdayValue('-1SU')).toEqual({ weekday: Weekdays.SU, n: -1 });
    expect(parseWeekdayValue('-2TH')).toEqual({ weekday: Weekdays.TH, n: -2 });
  });

  it('should parse weekday case-insensitively', () => {
    expect(parseWeekdayValue('mo')).toEqual(Weekdays.MO);
    expect(parseWeekdayValue('fr')).toEqual(Weekdays.FR);
    expect(parseWeekdayValue('+1mo')).toEqual({ weekday: Weekdays.MO, n: 1 });
    expect(parseWeekdayValue('2fr')).toEqual({ weekday: Weekdays.FR, n: 2 });
    expect(parseWeekdayValue('-1su')).toEqual({ weekday: Weekdays.SU, n: -1 });
    expect(parseWeekdayValue('-2th')).toEqual({ weekday: Weekdays.TH, n: -2 });
  });

  it('should trim weekday', () => {
    expect(parseWeekdayValue(' MO ')).toEqual(Weekdays.MO);
    expect(parseWeekdayValue(' 2FR ')).toEqual({ weekday: Weekdays.FR, n: 2 });
    expect(parseWeekdayValue(' +1SU ')).toEqual({
      weekday: Weekdays.SU,
      n: +1,
    });
    expect(parseWeekdayValue(' -2TH ')).toEqual({
      weekday: Weekdays.TH,
      n: -2,
    });
  });

  it('should throw on invalid weekday', () => {
    expect(() => parseWeekdayValue('')).toThrow('Invalid weekday');
    expect(() => parseWeekdayValue('XX')).toThrow('Invalid weekday: XX');
  });

  it('should throw on invalid format', () => {
    expect(() => parseWeekdayValue('1MO2')).toThrow(
      'Invalid weekday format: 1MO2',
    );
    expect(() => parseWeekdayValue('MO1')).toThrow(
      'Invalid weekday format: MO1',
    );
    expect(() => parseWeekdayValue('100MO')).toThrow(
      'Invalid weekday format: 100MO',
    );
    expect(() => parseWeekdayValue('-1000MO')).toThrow(
      'Invalid weekday format: -1000MO',
    );
  });

  it('should throw when occurrence is 0', () => {
    expect(() => parseWeekdayValue('0MO')).toThrow(
      'Weekday occurrence cannot be 0: 0MO',
    );
    expect(() => parseWeekdayValue('+0WE')).toThrow(
      'Weekday occurrence cannot be 0: +0WE',
    );
    expect(() => parseWeekdayValue('-0TH')).toThrow(
      'Weekday occurrence cannot be 0: -0TH',
    );
  });

  it('should throw when occurrence is out of range', () => {
    expect(() => parseWeekdayValue('54MO')).toThrow(
      'Weekday occurrence must be between -53 and 53: 54MO',
    );
    expect(() => parseWeekdayValue('-54MO')).toThrow(
      'Weekday occurrence must be between -53 and 53: -54MO',
    );
  });
});
