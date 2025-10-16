import type { CalendarDateTime } from '@internationalized/date';
import { CalendarDate, ZonedDateTime } from '@internationalized/date';
import { describe, expect, it } from 'vitest';
import { parseICS, parseRRule } from '../parser';
import type { WeekdayValue } from '../types';
import { Frequencies, Weekdays } from '../types';

describe('parseICS', () => {
  it('should parse ICS string with DTSTART and RRULE', () => {
    const result = parseICS(`
      DTSTART:20250101T101530Z
      RRULE:FREQ=DAILY;COUNT=10
    `);
    const dtstart = result.dtstart as ZonedDateTime;

    expect(result.freq).toBe(Frequencies.DAILY);
    expect(result.count).toBe(10);
    expect(dtstart).toBeInstanceOf(ZonedDateTime);
    expect(dtstart.year).toBe(2025);
    expect(dtstart.month).toBe(1);
    expect(dtstart.day).toBe(1);
    expect(dtstart.hour).toBe(10);
    expect(dtstart.minute).toBe(15);
    expect(dtstart.second).toBe(30);
    expect(dtstart.timeZone).toBe('UTC');
  });

  it('should parse ICS with date-only DTSTART', () => {
    const result = parseICS(`
      DTSTART:20250101
      RRULE:FREQ=DAILY;COUNT=10
    `);
    const dtstart = result.dtstart as CalendarDate;

    expect(dtstart).toBeInstanceOf(CalendarDate);
    expect(dtstart.year).toBe(2025);
    expect(dtstart.month).toBe(1);
    expect(dtstart.day).toBe(1);
  });

  it('should handle different line endings', () => {
    const result = parseICS(
      'DTSTART:20240101T090000\r\nRRULE:FREQ=DAILY;COUNT=10',
    );

    expect(result.freq).toBe(Frequencies.DAILY);
  });

  it('should handle line folding in ICS', () => {
    const result = parseICS(
      'DTSTART:20240101T090000\nRRULE:FREQ=MONTHLY;BYDAY=MO,TU,WE,\n TH,FR',
    );

    expect(result.freq).toBe(Frequencies.MONTHLY);
    expect(result.byweekday).toHaveLength(5);
  });

  it('should throw if RRULE is missing', () => {
    expect(() => parseICS('DTSTART:20240101T090000')).toThrow(
      'RRULE line not found',
    );
  });

  it('should parse RRULE without DTSTART', () => {
    const result = parseICS('RRULE:FREQ=DAILY;COUNT=10');

    expect(result.freq).toBe(Frequencies.DAILY);
    expect(result.dtstart).toBeUndefined();
  });

  it('should handle empty lines', () => {
    const result = parseICS(`
      DTSTART:20240101T090000


      RRULE:FREQ=DAILY;COUNT=10

    `);

    expect(result.freq).toBe(Frequencies.DAILY);
    expect(result.count).toBe(10);
    expect(result.dtstart).toBeDefined();
  });
});

describe('parseRRule', () => {
  describe('FREQ parsing', () => {
    it('should parse all FREQ values', () => {
      const frequencies = [
        Frequencies.YEARLY,
        Frequencies.MONTHLY,
        Frequencies.WEEKLY,
        Frequencies.DAILY,
        Frequencies.HOURLY,
        Frequencies.MINUTELY,
        Frequencies.SECONDLY,
      ];

      for (const freq of frequencies) {
        const result = parseRRule(`RRULE:FREQ=${freq}`);

        expect(result.freq).toBe(freq);
      }
    });

    it('should parse case-insensitive FREQ', () => {
      const result = parseRRule('RRULE:FREQ=daily');

      expect(result.freq).toBe(Frequencies.DAILY);
    });

    it('should throw if FREQ is missing', () => {
      expect(() => parseRRule('RRULE:COUNT=10')).toThrow(
        'Invalid RRule: FREQ is required',
      );
    });

    it('should throw if FREQ is invalid in strict mode', () => {
      expect(() => parseRRule('RRULE:FREQ=INVALID', true)).toThrow(
        'Invalid FREQ value',
      );
    });

    it('should skip invalid FREQ and use default in lenient mode', () => {
      const result = parseRRule('RRULE:FREQ=INVALID', false);

      expect(result.freq).toBe(Frequencies.YEARLY);
    });
  });

  describe('INTERVAL parsing', () => {
    it('should parse INTERVAL', () => {
      const result = parseRRule('RRULE:FREQ=DAILY;INTERVAL=2');

      expect(result.interval).toBe(2);
    });

    it('should throw on invalid INTERVAL in strict mode', () => {
      expect(() => parseRRule('RRULE:FREQ=DAILY;INTERVAL=0', true)).toThrow(
        'Invalid INTERVAL value: 0',
      );
      expect(() => parseRRule('RRULE:FREQ=DAILY;INTERVAL=-1', true)).toThrow(
        'Invalid INTERVAL value: -1',
      );
      expect(() => parseRRule('RRULE:FREQ=DAILY;INTERVAL=abc', true)).toThrow(
        'Invalid INTERVAL value: abc',
      );
    });

    it('should skip invalid INTERVAL and use default in lenient mode', () => {
      const result = parseRRule('RRULE:FREQ=DAILY;INTERVAL=0', false);
      expect(result.interval).toBe(1);
    });
  });

  describe('COUNT parsing', () => {
    it('should parse COUNT', () => {
      const result = parseRRule('RRULE:FREQ=DAILY;COUNT=10');

      expect(result.count).toBe(10);
    });

    it('should throw on invalid COUNT in strict mode', () => {
      expect(() => parseRRule('RRULE:FREQ=DAILY;COUNT=0', true)).toThrow(
        'Invalid COUNT value: 0',
      );
      expect(() => parseRRule('RRULE:FREQ=DAILY;COUNT=-5', true)).toThrow(
        'Invalid COUNT value: -5',
      );
    });

    it('should skip invalid COUNT in lenient mode', () => {
      const result = parseRRule('RRULE:FREQ=DAILY;COUNT=0', false);
      expect(result.count).toBeUndefined();
    });
  });

  describe('UNTIL parsing', () => {
    it('should parse UNTIL with date only', () => {
      const result = parseRRule('RRULE:FREQ=DAILY;UNTIL=20251231');
      const until = result.until as CalendarDate;

      expect(until).toBeDefined();
      expect(until.year).toBe(2025);
      expect(until.month).toBe(12);
      expect(until.day).toBe(31);
    });

    it('should parse UNTIL with datetime', () => {
      const result = parseRRule('RRULE:FREQ=DAILY;UNTIL=20251231T235959');
      const until = result.until as CalendarDateTime;

      expect(until).toBeDefined();
      expect(until.year).toBe(2025);
      expect(until.month).toBe(12);
      expect(until.day).toBe(31);
      expect(until.hour).toBe(23);
      expect(until.minute).toBe(59);
      expect(until.second).toBe(59);
    });

    it('should parse UNTIL with Z suffix', () => {
      const result = parseRRule('RRULE:FREQ=DAILY;UNTIL=20251231T235959Z');
      const until = result.until as ZonedDateTime;

      expect(until).toBeDefined();
      expect(until.year).toBe(2025);
      expect(until.month).toBe(12);
      expect(until.day).toBe(31);
      expect(until.hour).toBe(23);
      expect(until.minute).toBe(59);
      expect(until.second).toBe(59);
      expect(until.timeZone).toBe('UTC');
    });

    it('should throw on invalid UNTIL format', () => {
      expect(() =>
        parseRRule('RRULE:FREQ=DAILY;UNTIL=2025-12-31', true),
      ).toThrow('Invalid UNTIL value: 2025-12-31');
      expect(() => parseRRule('RRULE:FREQ=DAILY;UNTIL=2026', true)).toThrow(
        'Invalid UNTIL value: 2026',
      );
    });

    it('should skip invalid UNTIL in lenient mode', () => {
      const result = parseRRule('RRULE:FREQ=DAILY;UNTIL=2025-12-31', false);

      expect(result.until).toBeUndefined();
    });
  });

  describe('WKST parsing', () => {
    it('should parse WKST', () => {
      const result = parseRRule('RRULE:FREQ=WEEKLY;WKST=MO');

      expect(result.wkst).toBe(Weekdays.MO);
    });

    it('should parse all weekday values', () => {
      const weekdays = [
        Weekdays.MO,
        Weekdays.TU,
        Weekdays.WE,
        Weekdays.TH,
        Weekdays.FR,
        Weekdays.SA,
        Weekdays.SU,
      ];

      for (const wkst of weekdays) {
        const result = parseRRule(`RRULE:FREQ=WEEKLY;WKST=${wkst}`);

        expect(result.wkst).toBe(wkst);
      }
    });

    it('should throw on invalid WKST', () => {
      expect(() => parseRRule('RRULE:FREQ=WEEKLY;WKST=XX', true)).toThrow(
        'Invalid WKST value: XX',
      );
    });

    it('should skip invalid WKST in lenient mode', () => {
      const result = parseRRule('RRULE:FREQ=WEEKLY;WKST=XX', false);

      expect(result.wkst).toBeUndefined();
    });
  });

  describe('BYDAY parsing', () => {
    it('should parse simple weekday values', () => {
      const result = parseRRule('RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR');
      const byweekday = result.byweekday as WeekdayValue[];

      expect(byweekday).toHaveLength(3);
      expect(byweekday[0]).toEqual(Weekdays.MO);
      expect(byweekday[1]).toEqual(Weekdays.WE);
      expect(byweekday[2]).toEqual(Weekdays.FR);
    });

    it('should parse weekdays with occurrence numbers', () => {
      const result = parseRRule('RRULE:FREQ=MONTHLY;BYDAY=1FR,-1SU');
      const byweekday = result.byweekday as WeekdayValue[];

      expect(byweekday).toHaveLength(2);
      expect(byweekday[0]).toEqual({ weekday: Weekdays.FR, n: 1 });
      expect(byweekday[1]).toEqual({ weekday: Weekdays.SU, n: -1 });
    });

    it('should parse mixed simple and occurrence weekdays', () => {
      const result = parseRRule('RRULE:FREQ=MONTHLY;BYDAY=MO,1FR,-1SU');
      const byweekday = result.byweekday as WeekdayValue[];

      expect(byweekday).toHaveLength(3);
      expect(byweekday[0]).toEqual(Weekdays.MO);
      expect(byweekday[1]).toEqual({ weekday: Weekdays.FR, n: 1 });
      expect(byweekday[2]).toEqual({ weekday: Weekdays.SU, n: -1 });
    });

    it('should skip empty BYDAY in lenient mode', () => {
      const result = parseRRule('RRULE:FREQ=WEEKLY;BYDAY=', false);

      expect(result.byweekday).toBeUndefined();
    });

    it('should filter invalid weekdays in lenient mode', () => {
      const result = parseRRule('RRULE:FREQ=WEEKLY;BYDAY=MO,XX,2FR', false);
      const byweekday = result.byweekday as WeekdayValue[];

      expect(byweekday).toHaveLength(2);
      expect(byweekday[0]).toEqual(Weekdays.MO);
      expect(byweekday[1]).toEqual({ weekday: Weekdays.FR, n: 2 });
    });
  });

  describe('BYMONTH parsing', () => {
    it('should parse BYMONTH', () => {
      const result = parseRRule('RRULE:FREQ=YEARLY;BYMONTH=1,6,12');

      expect(result.bymonth).toEqual([1, 6, 12]);
    });

    it('should throw on out-of-range values in strict mode', () => {
      expect(() =>
        parseRRule('RRULE:FREQ=YEARLY;BYMONTH=0,6,12', true),
      ).toThrow('Invalid BYMONTH value: 0');
      expect(() => parseRRule('RRULE:FREQ=YEARLY;BYMONTH=1,13', true)).toThrow(
        'Invalid BYMONTH value: 13',
      );
    });

    it('should filter out-of-range values in lenient mode', () => {
      const result = parseRRule('RRULE:FREQ=YEARLY;BYMONTH=0,6,13', false);

      expect(result.bymonth).toEqual([6]);
    });
  });

  describe('BYMONTHDAY parsing', () => {
    it('should parse positive BYMONTHDAY', () => {
      const result = parseRRule('RRULE:FREQ=MONTHLY;BYMONTHDAY=1,15,31');

      expect(result.bymonthday).toEqual([1, 15, 31]);
    });

    it('should parse negative BYMONTHDAY', () => {
      const result = parseRRule('RRULE:FREQ=MONTHLY;BYMONTHDAY=-1,-7');

      expect(result.bymonthday).toEqual([-1, -7]);
    });

    it('should parse mixed positive and negative', () => {
      const result = parseRRule('RRULE:FREQ=MONTHLY;BYMONTHDAY=1,-1');

      expect(result.bymonthday).toEqual([1, -1]);
    });

    it('should filter zero values', () => {
      const result = parseRRule('RRULE:FREQ=MONTHLY;BYMONTHDAY=1,0,-1', false);

      expect(result.bymonthday).toEqual([1, -1]);
    });

    it('should filter out-of-range values in lenient mode', () => {
      const result = parseRRule(
        'RRULE:FREQ=MONTHLY;BYMONTHDAY=1,32,-32',
        false,
      );

      expect(result.bymonthday).toEqual([1]);
    });
  });

  describe('BYYEARDAY parsing', () => {
    it('should parse BYYEARDAY', () => {
      const result = parseRRule('RRULE:FREQ=YEARLY;BYYEARDAY=1,100,200,-1');

      expect(result.byyearday).toEqual([1, 100, 200, -1]);
    });

    it('should filter zero and out-of-range values', () => {
      const result = parseRRule(
        'RRULE:FREQ=YEARLY;BYYEARDAY=1,0,367,-367',
        false,
      );

      expect(result.byyearday).toEqual([1]);
    });
  });

  describe('BYWEEKNO parsing', () => {
    it('should parse BYWEEKNO', () => {
      const result = parseRRule('RRULE:FREQ=YEARLY;BYWEEKNO=1,20,-1');

      expect(result.byweekno).toEqual([1, 20, -1]);
    });

    it('should filter zero and out-of-range values', () => {
      const result = parseRRule('RRULE:FREQ=YEARLY;BYWEEKNO=1,0,54,-54', false);

      expect(result.byweekno).toEqual([1]);
    });
  });

  describe('BYHOUR parsing', () => {
    it('should parse BYHOUR', () => {
      const result = parseRRule('RRULE:FREQ=DAILY;BYHOUR=9,12,18');

      expect(result.byhour).toEqual([9, 12, 18]);
    });

    it('should filter out-of-range values', () => {
      const result = parseRRule('RRULE:FREQ=DAILY;BYHOUR=0,12,24', false);

      expect(result.byhour).toEqual([0, 12]);
    });
  });

  describe('BYMINUTE parsing', () => {
    it('should parse BYMINUTE', () => {
      const result = parseRRule('RRULE:FREQ=HOURLY;BYMINUTE=0,15,30,45');

      expect(result.byminute).toEqual([0, 15, 30, 45]);
    });

    it('should filter out-of-range values', () => {
      const result = parseRRule('RRULE:FREQ=HOURLY;BYMINUTE=0,30,60', false);

      expect(result.byminute).toEqual([0, 30]);
    });
  });

  describe('BYSECOND parsing', () => {
    it('should parse BYSECOND', () => {
      const result = parseRRule('RRULE:FREQ=MINUTELY;BYSECOND=0,30');

      expect(result.bysecond).toEqual([0, 30]);
    });

    it('should filter out-of-range values', () => {
      const result = parseRRule('RRULE:FREQ=MINUTELY;BYSECOND=0,30,60', false);

      expect(result.bysecond).toEqual([0, 30]);
    });
  });

  describe('BYSETPOS parsing', () => {
    it('should parse BYSETPOS', () => {
      const result = parseRRule('RRULE:FREQ=MONTHLY;BYSETPOS=1,-1');

      expect(result.bysetpos).toEqual([1, -1]);
    });

    it('should filter zero values', () => {
      const result = parseRRule('RRULE:FREQ=MONTHLY;BYSETPOS=1,0,-1', false);

      expect(result.bysetpos).toEqual([1, -1]);
    });
  });

  describe('RRULE parsing', () => {
    it('should parse complex RRULE with multiple parameters', () => {
      const result = parseRRule(`
        RRULE:FREQ=MONTHLY;INTERVAL=2;COUNT=10;BYDAY=1FR,-1SU;BYMONTH=1,6,12
      `);

      expect(result.freq).toBe(Frequencies.MONTHLY);
      expect(result.interval).toBe(2);
      expect(result.count).toBe(10);
      expect(result.byweekday).toHaveLength(2);
      expect(result.bymonth).toEqual([1, 6, 12]);
    });

    it('should handle whitespace', () => {
      const result = parseRRule('  RRULE:FREQ=DAILY ; COUNT=10  ');

      expect(result.freq).toBe(Frequencies.DAILY);
      expect(result.count).toBe(10);
    });

    it('should handle line folding', () => {
      const result = parseRRule('RRULE:FREQ=DAILY;\r\n COUNT=10');

      expect(result.freq).toBe(Frequencies.DAILY);
      expect(result.count).toBe(10);
    });
  });

  describe('COUNT and UNTIL mutual exclusion', () => {
    it('should throw if both COUNT and UNTIL are set', () => {
      expect(() =>
        parseRRule('RRULE:FREQ=DAILY;COUNT=10;UNTIL=20241231'),
      ).toThrow('COUNT and UNTIL are mutually exclusive');
    });

    it('should allow COUNT without UNTIL', () => {
      const result = parseRRule('RRULE:FREQ=DAILY;COUNT=10');
      expect(result.count).toBe(10);
      expect(result.until).toBeUndefined();
    });

    it('should allow UNTIL without COUNT', () => {
      const result = parseRRule('RRULE:FREQ=DAILY;UNTIL=20241231');
      expect(result.until).toBeDefined();
      expect(result.count).toBeUndefined();
    });
  });

  describe('strict vs lenient mode', () => {
    it('should throw on unknown parameter in strict mode', () => {
      expect(() => parseRRule('RRULE:FREQ=DAILY;UNKNOWN=value', true)).toThrow(
        'Unknown RRULE parameter: UNKNOWN',
      );
    });

    it('should ignore unknown parameter in lenient mode', () => {
      const result = parseRRule('RRULE:FREQ=DAILY;UNKNOWN=value', false);

      expect(result.freq).toBe(Frequencies.DAILY);
      expect((result as { unknown?: string }).unknown).toBeUndefined();
    });

    it('should throw on invalid part format in strict mode', () => {
      expect(() => parseRRule('RRULE:FREQ=DAILY;INVALID', true)).toThrow(
        'Invalid RRULE parameter: INVALID',
      );
    });

    it('should skip invalid part format in lenient mode', () => {
      const result = parseRRule('RRULE:FREQ=DAILY;INVALID;COUNT=10', false);

      expect(result.freq).toBe(Frequencies.DAILY);
      expect(result.count).toBe(10);
      expect((result as { invalid?: string }).invalid).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should throw on empty strings', () => {
      expect(() => parseRRule('')).toThrow('Invalid RRULE string');
      expect(() => parseRRule('   ')).toThrow('Invalid RRULE string');
    });

    it('should handle single parameter', () => {
      const result = parseRRule('RRULE:FREQ=DAILY');
      expect(result.freq).toBe(Frequencies.DAILY);
      expect(result.interval).toBeUndefined();
      expect(result.count).toBeUndefined();
    });
  });

  describe('Timezone (TZID) parsing', () => {
    it('should parse DTSTART with TZID parameter (America/New_York)', () => {
      const result = parseICS(`
        DTSTART;TZID=America/New_York:20250315T140000
        RRULE:FREQ=DAILY;COUNT=3
      `);

      const dtstart = result.dtstart as ZonedDateTime;
      expect(dtstart).toBeInstanceOf(ZonedDateTime);
      expect(dtstart.year).toBe(2025);
      expect(dtstart.month).toBe(3);
      expect(dtstart.day).toBe(15);
      expect(dtstart.hour).toBe(14);
      expect(dtstart.timeZone).toBe('America/New_York');
    });

    it('should parse DTSTART with TZID parameter (Asia/Tokyo)', () => {
      const result = parseICS(`
        DTSTART;TZID=Asia/Tokyo:20250601T090000
        RRULE:FREQ=WEEKLY;COUNT=5
      `);

      const dtstart = result.dtstart as ZonedDateTime;
      expect(dtstart).toBeInstanceOf(ZonedDateTime);
      expect(dtstart.timeZone).toBe('Asia/Tokyo');
      expect(dtstart.hour).toBe(9);
    });

    it('should parse DTSTART with TZID parameter (Europe/London)', () => {
      const result = parseICS(`
        DTSTART;TZID=Europe/London:20251010T153000
        RRULE:FREQ=MONTHLY;INTERVAL=2
      `);

      const dtstart = result.dtstart as ZonedDateTime;
      expect(dtstart).toBeInstanceOf(ZonedDateTime);
      expect(dtstart.timeZone).toBe('Europe/London');
      expect(dtstart.hour).toBe(15);
      expect(dtstart.minute).toBe(30);
    });

    it('should parse DTSTART with TZID parameter (Australia/Sydney)', () => {
      const result = parseICS(`
        DTSTART;TZID=Australia/Sydney:20250120T080000
        RRULE:FREQ=DAILY;COUNT=10
      `);

      const dtstart = result.dtstart as ZonedDateTime;
      expect(dtstart).toBeInstanceOf(ZonedDateTime);
      expect(dtstart.timeZone).toBe('Australia/Sydney');
      expect(dtstart.year).toBe(2025);
      expect(dtstart.month).toBe(1);
      expect(dtstart.day).toBe(20);
      expect(dtstart.hour).toBe(8);
    });

    it('should parse DTSTART with TZID parameter (Pacific/Auckland)', () => {
      const result = parseICS(`
        DTSTART;TZID=Pacific/Auckland:20250301T123000
        RRULE:FREQ=YEARLY;BYMONTH=3
      `);

      const dtstart = result.dtstart as ZonedDateTime;
      expect(dtstart).toBeInstanceOf(ZonedDateTime);
      expect(dtstart.timeZone).toBe('Pacific/Auckland');
      expect(dtstart.hour).toBe(12);
      expect(dtstart.minute).toBe(30);
    });

    it('should parse DTSTART with TZID parameter (America/Los_Angeles)', () => {
      const result = parseICS(`
        DTSTART;TZID=America/Los_Angeles:20250715T180000
        RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR
      `);

      const dtstart = result.dtstart as ZonedDateTime;
      expect(dtstart).toBeInstanceOf(ZonedDateTime);
      expect(dtstart.timeZone).toBe('America/Los_Angeles');
      expect(dtstart.hour).toBe(18);
    });

    it('should parse DTSTART with TZID parameter (Europe/Paris)', () => {
      const result = parseICS(`
        DTSTART;TZID=Europe/Paris:20250501T120000
        RRULE:FREQ=MONTHLY;BYMONTHDAY=1,15
      `);

      const dtstart = result.dtstart as ZonedDateTime;
      expect(dtstart).toBeInstanceOf(ZonedDateTime);
      expect(dtstart.timeZone).toBe('Europe/Paris');
      expect(dtstart.month).toBe(5);
      expect(dtstart.day).toBe(1);
    });

    it('should handle TZID with UTC-like zones', () => {
      const result = parseICS(`
        DTSTART;TZID=Etc/UTC:20250101T120000
        RRULE:FREQ=DAILY;COUNT=5
      `);

      const dtstart = result.dtstart as ZonedDateTime;
      expect(dtstart).toBeInstanceOf(ZonedDateTime);
      expect(dtstart.timeZone).toBe('Etc/UTC');
    });
  });
});
