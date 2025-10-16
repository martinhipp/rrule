import {
  CalendarDate,
  CalendarDateTime,
  ZonedDateTime,
} from '@internationalized/date';
import { describe, expect, it } from 'vitest';
import {
  formatDTStart,
  formatICSDateValue,
  formatUntilICSDateValue,
  formatWeekdayValue,
} from '../format';
import { Weekdays } from '../types';

describe('formatICSDateValue', () => {
  it('should format CalendarDate (date only)', () => {
    const date = new CalendarDate(2025, 1, 15);

    expect(formatICSDateValue(date)).toBe('20250115');
  });

  it('should format CalendarDateTime (datetime)', () => {
    const datetime = new CalendarDateTime(2025, 1, 15, 10, 30, 45);

    expect(formatICSDateValue(datetime)).toBe('20250115T103045');
  });

  it('should format ZonedDateTime in UTC', () => {
    const zoned = new ZonedDateTime(2025, 1, 15, 'UTC', 0, 10, 30, 45);

    expect(formatICSDateValue(zoned)).toBe('20250115T103045Z');
  });

  it('should format ZonedDateTime non-UTC (date + time, no Z)', () => {
    const zoned = new ZonedDateTime(
      2025,
      1,
      15,
      'America/New_York',
      -18000000,
      10,
      30,
      45,
    );

    expect(formatICSDateValue(zoned)).toBe('20250115T103045');
  });

  it('should format midnight correctly', () => {
    const datetime = new CalendarDateTime(2025, 1, 15, 0, 0, 0);

    expect(formatICSDateValue(datetime)).toBe('20250115T000000');
  });

  it('pads single digit values', () => {
    const datetime = new CalendarDateTime(2025, 1, 5, 9, 5, 3);

    expect(formatICSDateValue(datetime)).toBe('20250105T090503');
  });
});

describe('formatDTStart', () => {
  it('should format CalendarDate without TZID', () => {
    const date = new CalendarDate(2025, 1, 15);

    expect(formatDTStart(date)).toBe('DTSTART:20250115');
  });

  it('should format CalendarDateTime without TZID', () => {
    const datetime = new CalendarDateTime(2025, 1, 15, 10, 30, 45);

    expect(formatDTStart(datetime)).toBe('DTSTART:20250115T103045');
  });

  it('should format ZonedDateTime in UTC without TZID', () => {
    const zoned = new ZonedDateTime(2025, 1, 15, 'UTC', 0, 10, 30, 45);

    expect(formatDTStart(zoned)).toBe('DTSTART:20250115T103045Z');
  });

  it('should format ZonedDateTime non-UTC with TZID parameter', () => {
    const zoned = new ZonedDateTime(
      2025,
      1,
      15,
      'America/New_York',
      -18000000,
      10,
      30,
      45,
    );

    expect(formatDTStart(zoned)).toBe(
      'DTSTART;TZID=America/New_York:20250115T103045',
    );
  });
});

describe('formatUntilICSDateValue', () => {
  it('should format without DTSTART parameter', () => {
    const date = new CalendarDate(2025, 12, 31);
    const datetime = new CalendarDateTime(2025, 12, 31, 23, 59, 59);
    const zoned = new ZonedDateTime(2025, 12, 31, 'UTC', 0, 23, 59, 59);

    expect(formatUntilICSDateValue(date)).toBe('20251231');
    expect(formatUntilICSDateValue(datetime)).toBe('20251231T235959');
    expect(formatUntilICSDateValue(zoned)).toBe('20251231T235959Z');
  });

  it('preserves CalendarDate when both DTSTART and UNTIL are CalendarDate', () => {
    const start = new CalendarDate(2025, 1, 1);
    const until = new CalendarDate(2025, 12, 31);

    expect(formatUntilICSDateValue(until, start)).toBe('20251231');
  });

  it('preserves CalendarDateTime when both DTSTART and UNTIL are CalendarDateTime', () => {
    const start = new CalendarDateTime(2025, 1, 1, 9, 0, 0);
    const until = new CalendarDateTime(2025, 12, 31, 23, 59, 59);

    expect(formatUntilICSDateValue(until, start)).toBe('20251231T235959');
  });

  it('converts to date-only when DTSTART is CalendarDate', () => {
    const until = new CalendarDateTime(2025, 12, 31, 23, 59, 59);
    const start = new CalendarDate(2025, 1, 1);

    expect(formatUntilICSDateValue(until, start)).toBe('20251231');
  });

  it('converts to datetime when DTSTART is CalendarDateTime', () => {
    const until = new CalendarDate(2025, 12, 31);
    const start = new CalendarDateTime(2025, 1, 1, 9, 0, 0);

    expect(formatUntilICSDateValue(until, start)).toBe('20251231T000000');
  });

  it('converts to UTC when DTSTART is ZonedDateTime (from CalendarDateTime)', () => {
    const until = new CalendarDateTime(2025, 12, 31, 23, 59, 59);
    const start = new ZonedDateTime(
      2025,
      1,
      1,
      'America/New_York',
      -18000000,
      9,
      0,
      0,
    );

    expect(formatUntilICSDateValue(until, start)).toBe('20251231T235959Z');
  });

  it('converts to UTC when DTSTART is ZonedDateTime (from non-UTC ZonedDateTime)', () => {
    const until = new ZonedDateTime(
      2025,
      12,
      31,
      'America/New_York',
      -18000000,
      18,
      0,
      0,
    );
    const start = new ZonedDateTime(2025, 1, 1, 'UTC', 0, 9, 0, 0);

    // America/New_York 18:00 = UTC 23:00 (EST is UTC-5)
    expect(formatUntilICSDateValue(until, start)).toBe('20251231T230000Z');
  });

  it('keeps UTC when DTSTART and UNTIL are both UTC', () => {
    const until = new ZonedDateTime(2025, 12, 31, 'UTC', 0, 23, 59, 59);
    const start = new ZonedDateTime(2025, 1, 1, 'UTC', 0, 9, 0, 0);

    expect(formatUntilICSDateValue(until, start)).toBe('20251231T235959Z');
  });

  it('allows UNTIL to equal DTSTART', () => {
    const date = new CalendarDate(2025, 1, 1);

    expect(formatUntilICSDateValue(date, date)).toBe('20250101');
  });

  it('throws if UNTIL is before DTSTART', () => {
    const until = new CalendarDate(2025, 5, 1);
    const start = new CalendarDate(2025, 6, 1);

    expect(() => formatUntilICSDateValue(until, start)).toThrow(
      'UNTIL must not be before DTSTART',
    );
  });
});

describe('formatWeekdayValue', () => {
  it('should format simple weekday', () => {
    expect(formatWeekdayValue(Weekdays.MO)).toBe('MO');
    expect(formatWeekdayValue(Weekdays.FR)).toBe('FR');
  });

  it('should format weekday with positive occurrence', () => {
    expect(formatWeekdayValue({ weekday: Weekdays.MO, n: 1 })).toBe('1MO');
    expect(formatWeekdayValue({ weekday: Weekdays.FR, n: 2 })).toBe('2FR');
  });

  it('should format weekday with negative occurrence', () => {
    expect(formatWeekdayValue({ weekday: Weekdays.SU, n: -1 })).toBe('-1SU');
    expect(formatWeekdayValue({ weekday: Weekdays.TH, n: -2 })).toBe('-2TH');
  });

  it('should format zero occurrence as weekday only', () => {
    expect(formatWeekdayValue({ weekday: Weekdays.WE, n: 0 })).toBe('WE');
  });
});

describe('Cross-timezone formatting', () => {
  it('should format DTSTART with Asia/Tokyo timezone', () => {
    const zoned = new ZonedDateTime(
      2025,
      6,
      1,
      'Asia/Tokyo',
      32400000,
      9,
      0,
      0,
    );

    expect(formatDTStart(zoned)).toBe(
      'DTSTART;TZID=Asia/Tokyo:20250601T090000',
    );
  });

  it('should format DTSTART with Europe/London timezone', () => {
    const zoned = new ZonedDateTime(
      2025,
      10,
      10,
      'Europe/London',
      0,
      15,
      30,
      0,
    );

    expect(formatDTStart(zoned)).toBe(
      'DTSTART;TZID=Europe/London:20251010T153000',
    );
  });

  it('should format DTSTART with Australia/Sydney timezone', () => {
    const zoned = new ZonedDateTime(
      2025,
      1,
      20,
      'Australia/Sydney',
      39600000,
      8,
      0,
      0,
    );

    expect(formatDTStart(zoned)).toBe(
      'DTSTART;TZID=Australia/Sydney:20250120T080000',
    );
  });

  it('should format DTSTART with Pacific/Auckland timezone', () => {
    const zoned = new ZonedDateTime(
      2025,
      3,
      1,
      'Pacific/Auckland',
      46800000,
      12,
      30,
      0,
    );

    expect(formatDTStart(zoned)).toBe(
      'DTSTART;TZID=Pacific/Auckland:20250301T123000',
    );
  });

  it('should format DTSTART with America/Los_Angeles timezone', () => {
    const zoned = new ZonedDateTime(
      2025,
      7,
      15,
      'America/Los_Angeles',
      -28800000,
      18,
      0,
      0,
    );

    expect(formatDTStart(zoned)).toBe(
      'DTSTART;TZID=America/Los_Angeles:20250715T180000',
    );
  });

  it('should format DTSTART with Europe/Paris timezone', () => {
    const zoned = new ZonedDateTime(
      2025,
      5,
      1,
      'Europe/Paris',
      3600000,
      12,
      0,
      0,
    );

    expect(formatDTStart(zoned)).toBe(
      'DTSTART;TZID=Europe/Paris:20250501T120000',
    );
  });

  it('should convert non-UTC UNTIL to UTC when DTSTART is ZonedDateTime (Asia/Tokyo)', () => {
    const until = new ZonedDateTime(
      2025,
      12,
      31,
      'Asia/Tokyo',
      32400000,
      23,
      0,
      0,
    );
    const start = new ZonedDateTime(2025, 1, 1, 'UTC', 0, 9, 0, 0);

    // Asia/Tokyo 23:00 = UTC 14:00 (JST is UTC+9)
    expect(formatUntilICSDateValue(until, start)).toBe('20251231T140000Z');
  });

  it('should convert non-UTC UNTIL to UTC when DTSTART is ZonedDateTime (Europe/London)', () => {
    const until = new ZonedDateTime(
      2025,
      6,
      30,
      'Europe/London',
      3600000, // BST: UTC+1
      18,
      0,
      0,
    );
    const start = new ZonedDateTime(2025, 1, 1, 'UTC', 0, 9, 0, 0);

    // Europe/London 18:00 BST = UTC 17:00
    expect(formatUntilICSDateValue(until, start)).toBe('20250630T170000Z');
  });

  it('should convert non-UTC UNTIL to UTC when DTSTART is ZonedDateTime (Australia/Sydney)', () => {
    const until = new ZonedDateTime(
      2025,
      12,
      31,
      'Australia/Sydney',
      39600000, // AEDT: UTC+11
      20,
      0,
      0,
    );
    const start = new ZonedDateTime(2025, 1, 1, 'UTC', 0, 9, 0, 0);

    // Australia/Sydney 20:00 AEDT = UTC 09:00
    expect(formatUntilICSDateValue(until, start)).toBe('20251231T090000Z');
  });
});
