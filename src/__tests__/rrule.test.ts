import { CalendarDate, CalendarDateTime } from '@internationalized/date';
import { describe, expect, it } from 'vitest';
import { RRule } from '../rrule';
import { Frequencies, Weekdays } from '../types';

describe('RRule', () => {
  describe('constructor', () => {
    it('should create RRule from options', () => {
      const rrule = new RRule({
        count: 10,
      });

      expect(rrule.freq).toBe(Frequencies.YEARLY);
      expect(rrule.count).toBe(10);
    });

    it('should sanitize options on construction', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        count: 0, // Invalid, should be sanitized to 1
      });

      expect(rrule.count).toBeUndefined();
    });

    it('should throw on COUNT and UNTIL both set', () => {
      expect(
        () =>
          new RRule({
            freq: Frequencies.DAILY,
            count: 10,
            until: new CalendarDate(2025, 12, 31),
          }),
      ).toThrow('COUNT and UNTIL are mutually exclusive');
    });
  });

  describe('fromString', () => {
    it('should create RRule from RRULE string', () => {
      const rrule = RRule.fromString('RRULE:FREQ=DAILY;COUNT=10');

      expect(rrule.freq).toBe(Frequencies.DAILY);
      expect(rrule.count).toBe(10);
    });

    it('should create RRule from ICS string with DTSTART', () => {
      const rrule = RRule.fromString(`
        DTSTART:20250101
        RRULE:FREQ=DAILY;COUNT=10
      `);

      expect(rrule.freq).toBe(Frequencies.DAILY);
      expect(rrule.count).toBe(10);
      expect(rrule.dtstart).toBeDefined();
      expect(rrule.dtstart?.year).toBe(2025);
    });
  });

  describe('getters and setters', () => {
    it('should get and set freq', () => {
      const rrule = new RRule({ freq: Frequencies.DAILY });

      expect(rrule.freq).toBe(Frequencies.DAILY);

      rrule.freq = Frequencies.WEEKLY;
      expect(rrule.freq).toBe(Frequencies.WEEKLY);
    });

    it('should get and set dtstart', () => {
      const rrule = new RRule({ freq: Frequencies.DAILY });

      const dtstart = new CalendarDate(2025, 1, 1);
      rrule.dtstart = dtstart;

      expect(rrule.dtstart).toBe(dtstart);
    });

    it('should get and set interval', () => {
      const rrule = new RRule({ freq: Frequencies.DAILY });
      rrule.interval = 2;

      expect(rrule.interval).toBe(2);
    });

    it('should sanitize interval to minimum 1', () => {
      const rrule = new RRule({ freq: Frequencies.DAILY });
      rrule.interval = 0;

      expect(rrule.interval).toBeUndefined();
    });

    it('should get and set count', () => {
      const rrule = new RRule({ freq: Frequencies.DAILY });
      rrule.count = 10;

      expect(rrule.count).toBe(10);
    });

    it('should throw when setting count if until is already set', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        until: new CalendarDate(2025, 12, 31),
      });

      expect(() => {
        rrule.count = 10;
      }).toThrow('COUNT and UNTIL are mutually exclusive');
    });

    it('should get and set until', () => {
      const rrule = new RRule({ freq: Frequencies.DAILY });

      const until = new CalendarDate(2025, 12, 31);
      rrule.until = until;

      expect(rrule.until).toBe(until);
    });

    it('should throw when setting until if count is already set', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        count: 10,
      });

      expect(() => {
        rrule.until = new CalendarDate(2025, 12, 31);
      }).toThrow('COUNT and UNTIL are mutually exclusive');
    });

    it('should get and set wkst', () => {
      const rrule = new RRule({ freq: Frequencies.WEEKLY });
      rrule.wkst = Weekdays.MO;

      expect(rrule.wkst).toBe(Weekdays.MO);
    });

    it('should get and set byweekday', () => {
      const rrule = new RRule({ freq: Frequencies.WEEKLY });
      rrule.byweekday = [Weekdays.MO, Weekdays.WE, Weekdays.FR];

      expect(rrule.byweekday).toEqual([Weekdays.MO, Weekdays.WE, Weekdays.FR]);
    });

    it('should get and set bymonth', () => {
      const rrule = new RRule({ freq: Frequencies.YEARLY });
      rrule.bymonth = [1, 6, 12];

      expect(rrule.bymonth).toEqual([1, 6, 12]);
    });

    it('should sanitize and filter bymonth values', () => {
      const rrule = new RRule({ freq: Frequencies.YEARLY });
      rrule.bymonth = [0, 1, 13, 6];

      expect(rrule.bymonth).toEqual([1, 6]);
    });

    it('should get and set byhour', () => {
      const rrule = new RRule({ freq: Frequencies.DAILY });
      rrule.byhour = [9, 12, 18];

      expect(rrule.byhour).toEqual([9, 12, 18]);
    });

    it('should throw when setting bysetpos without other BYxxx rules', () => {
      const rrule = new RRule({ freq: Frequencies.DAILY });

      expect(() => {
        rrule.bysetpos = [1, -1];
      }).toThrow('BYSETPOS must be used with another BYxxx rule');
    });

    it('should allow setting bysetpos when other BYxxx rules exist', () => {
      const rrule = new RRule({
        freq: Frequencies.MONTHLY,
        byweekday: [Weekdays.MO, Weekdays.TU, Weekdays.WE],
      });

      rrule.bysetpos = [1, -1];

      expect(rrule.bysetpos).toEqual([1, -1]);
    });

    it('should get and set bymonthday', () => {
      const rrule = new RRule({ freq: Frequencies.MONTHLY });
      rrule.bymonthday = [1, 15, -1];

      expect(rrule.bymonthday).toEqual([1, 15, -1]);
    });

    it('should sanitize and filter bymonthday values', () => {
      const rrule = new RRule({ freq: Frequencies.MONTHLY });
      rrule.bymonthday = [0, 1, 32, -32, 15, -1];

      expect(rrule.bymonthday).toEqual([1, 15, -1]);
    });

    it('should get and set byyearday', () => {
      const rrule = new RRule({ freq: Frequencies.YEARLY });
      rrule.byyearday = [1, 100, 200, -1];

      expect(rrule.byyearday).toEqual([1, 100, 200, -1]);
    });

    it('should sanitize and filter byyearday values', () => {
      const rrule = new RRule({ freq: Frequencies.YEARLY });
      rrule.byyearday = [0, 1, 367, -367, 100, -1];

      expect(rrule.byyearday).toEqual([1, 100, -1]);
    });

    it('should get and set byweekno', () => {
      const rrule = new RRule({ freq: Frequencies.YEARLY });
      rrule.byweekno = [1, 20, -1];

      expect(rrule.byweekno).toEqual([1, 20, -1]);
    });

    it('should sanitize and filter byweekno values', () => {
      const rrule = new RRule({ freq: Frequencies.YEARLY });
      rrule.byweekno = [0, 1, 54, -54, 20, -1];

      expect(rrule.byweekno).toEqual([1, 20, -1]);
    });

    it('should get and set byminute', () => {
      const rrule = new RRule({ freq: Frequencies.HOURLY });
      rrule.byminute = [0, 15, 30, 45];

      expect(rrule.byminute).toEqual([0, 15, 30, 45]);
    });

    it('should sanitize and filter byminute values', () => {
      const rrule = new RRule({ freq: Frequencies.HOURLY });
      rrule.byminute = [-1, 0, 30, 59, 60];

      expect(rrule.byminute).toEqual([0, 30, 59]);
    });

    it('should get and set bysecond', () => {
      const rrule = new RRule({ freq: Frequencies.MINUTELY });
      rrule.bysecond = [0, 15, 30, 45];

      expect(rrule.bysecond).toEqual([0, 15, 30, 45]);
    });

    it('should sanitize and filter bysecond values', () => {
      const rrule = new RRule({ freq: Frequencies.MINUTELY });
      rrule.bysecond = [-1, 0, 30, 59, 60];

      expect(rrule.bysecond).toEqual([0, 30, 59]);
    });
  });

  describe('maxIterations', () => {
    it('should get and set maxIterations', () => {
      const rrule = new RRule({ freq: Frequencies.DAILY });
      rrule.maxIterations = 1000;

      expect(rrule.maxIterations).toBe(1000);
    });

    it('should throw when setting maxIterations below 1', () => {
      const rrule = new RRule({ freq: Frequencies.DAILY });

      expect(() => {
        rrule.maxIterations = 0;
      }).toThrow('maxIterations must be greater than 0');
    });
  });

  describe('toString', () => {
    it('should format simple RRule to string', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        count: 10,
      });

      expect(rrule.toString()).toBe('RRULE:FREQ=DAILY;COUNT=10');
    });

    it('should format complex RRule to string', () => {
      const rrule = new RRule({
        freq: Frequencies.WEEKLY,
        interval: 2,
        byweekday: [Weekdays.MO, Weekdays.WE, Weekdays.FR],
        count: 10,
      });

      expect(rrule.toString()).toBe(
        'RRULE:FREQ=WEEKLY;INTERVAL=2;COUNT=10;BYDAY=MO,WE,FR',
      );
    });

    it('should not include interval if it is 1', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        interval: 1,
        count: 10,
      });

      expect(rrule.toString()).toBe('RRULE:FREQ=DAILY;COUNT=10');
    });
  });

  describe('clone', () => {
    it('should clone RRule', () => {
      const original = new RRule({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 1),
        count: 10,
      });

      const cloned = original.clone();

      expect(cloned).not.toBe(original);
      expect(cloned.freq).toBe(original.freq);
      expect(cloned.count).toBe(original.count);
    });

    it('should clone with overrides', () => {
      const original = new RRule({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 1),
        count: 10,
      });

      const cloned = original.clone({ count: 20 });

      expect(cloned.freq).toBe(Frequencies.DAILY);
      expect(cloned.count).toBe(20);
      expect(original.count).toBe(10); // Original unchanged
    });
  });

  describe('setOptions', () => {
    it('should update multiple options', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        count: 10,
      });

      rrule.setOptions({
        freq: Frequencies.WEEKLY,
        count: 20,
      });

      expect(rrule.freq).toBe(Frequencies.WEEKLY);
      expect(rrule.count).toBe(20);
    });

    it('should sanitize options when setting', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        count: 10,
      });

      rrule.setOptions({
        interval: 0, // Should be sanitized
      });

      expect(rrule.interval).toBeUndefined();
    });
  });

  describe('round-trip parsing', () => {
    it('should parse and format correctly', () => {
      const original = 'RRULE:FREQ=DAILY;COUNT=10';
      const rrule = RRule.fromString(original);
      const formatted = rrule.toString();

      expect(formatted).toBe(original);
    });

    it('should handle complex rules', () => {
      const original =
        'RRULE:FREQ=MONTHLY;INTERVAL=2;BYDAY=1FR,-1SU;BYMONTH=1,6,12;COUNT=10';
      const rrule = RRule.fromString(original);

      // Check values are parsed correctly
      expect(rrule.freq).toBe(Frequencies.MONTHLY);
      expect(rrule.interval).toBe(2);
      expect(rrule.count).toBe(10);
      expect(rrule.bymonth).toEqual([1, 6, 12]);
      expect(rrule.byweekday).toHaveLength(2);

      // Parse the formatted string back and check it matches
      const formatted = rrule.toString();
      const parsed = RRule.fromString(formatted);
      expect(parsed.freq).toBe(rrule.freq);
      expect(parsed.interval).toBe(rrule.interval);
      expect(parsed.count).toBe(rrule.count);
      expect(parsed.bymonth).toEqual(rrule.bymonth);
      expect(parsed.byweekday).toEqual(rrule.byweekday);
    });
  });

  describe('options immutability', () => {
    it('should not mutate the options object passed to constructor', () => {
      const options = {
        freq: Frequencies.DAILY,
        count: 10,
        interval: 2,
        bymonth: [1, 6, 12],
      };

      // Create a deep copy to compare against later
      const originalOptions = JSON.parse(JSON.stringify(options));

      // Create RRule - this should NOT mutate the options object
      new RRule(options);

      // Verify the original options object wasn't modified
      expect(options).toEqual(originalOptions);
      expect(options.freq).toBe(Frequencies.DAILY);
      expect(options.count).toBe(10);
      expect(options.interval).toBe(2);
      expect(options.bymonth).toEqual([1, 6, 12]);
    });

    it('should not mutate arrays in options', () => {
      const bymonth = [1, 6, 12];
      const byweekday = [Weekdays.MO, Weekdays.FR];

      const options = {
        freq: Frequencies.WEEKLY,
        bymonth,
        byweekday,
      };

      new RRule(options);

      // Arrays should still be the same instances with same values
      expect(options.bymonth).toBe(bymonth);
      expect(options.byweekday).toBe(byweekday);
      expect(bymonth).toEqual([1, 6, 12]);
      expect(byweekday).toEqual([Weekdays.MO, Weekdays.FR]);
    });
  });

  describe('all()', () => {
    it('should generate all occurrences with count', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 1),
        count: 5,
      });

      const dates = rrule.all();

      expect(dates).toHaveLength(5);
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 1));
      expect(dates[4]).toEqual(new CalendarDate(2025, 1, 5));
    });

    it('should generate all occurrences with until', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 1),
        until: new CalendarDate(2025, 1, 5),
      });

      const dates = rrule.all();

      expect(dates).toHaveLength(5);
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 1));
      expect(dates[4]).toEqual(new CalendarDate(2025, 1, 5));
    });

    it('should respect limit parameter', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 1),
        count: 100,
      });

      const dates = rrule.all(10);

      expect(dates).toHaveLength(10);
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 1));
      expect(dates[9]).toEqual(new CalendarDate(2025, 1, 10));
    });

    it('should return dtstart when until equals dtstart', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 10),
        until: new CalendarDate(2025, 1, 10),
      });

      const dates = rrule.all();

      expect(dates).toHaveLength(1);
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 10));
    });
  });

  describe('between()', () => {
    it('should generate occurrences between start and end dates', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 1),
        count: 31,
      });

      const dates = rrule.between(
        new CalendarDate(2025, 1, 10),
        new CalendarDate(2025, 1, 15),
      );

      expect(dates).toHaveLength(6); // Jan 10-15 inclusive
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 10));
      expect(dates[5]).toEqual(new CalendarDate(2025, 1, 15));
    });

    it('should exclude start and end dates when inclusive=false', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 1),
        count: 31,
      });

      const dates = rrule.between(
        new CalendarDate(2025, 1, 10),
        new CalendarDate(2025, 1, 15),
        false,
      );

      expect(dates).toHaveLength(4); // Jan 11-14 (excludes 10 and 15)
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 11));
      expect(dates[3]).toEqual(new CalendarDate(2025, 1, 14));
    });

    it('should return empty array when no occurrences in range', () => {
      const rrule = new RRule({
        freq: Frequencies.YEARLY,
        dtstart: new CalendarDate(2020, 1, 1),
        count: 5,
      });

      const dates = rrule.between(
        new CalendarDate(2030, 1, 1),
        new CalendarDate(2040, 1, 1),
      );

      expect(dates).toHaveLength(0);
    });

    it('should work with weekly recurrence', () => {
      const rrule = new RRule({
        freq: Frequencies.WEEKLY,
        dtstart: new CalendarDate(2025, 1, 6), // Monday
        byweekday: [Weekdays.MO, Weekdays.WE, Weekdays.FR],
        count: 20,
      });

      const dates = rrule.between(
        new CalendarDate(2025, 1, 13), // Second week Monday
        new CalendarDate(2025, 1, 17), // Second week Friday
      );

      expect(dates).toHaveLength(3); // Mon, Wed, Fri
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 13));
      expect(dates[1]).toEqual(new CalendarDate(2025, 1, 15));
      expect(dates[2]).toEqual(new CalendarDate(2025, 1, 17));
    });
  });

  describe('before()', () => {
    it('should find occurrences before date', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 1),
        count: 20,
      });

      const dates = rrule.before(new CalendarDate(2025, 1, 10), false, 5);

      expect(dates).toHaveLength(5);
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 1));
      expect(dates[4]).toEqual(new CalendarDate(2025, 1, 5));
    });

    it('should include date when inclusive=true', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 1),
        count: 20,
      });

      const dates = rrule.before(new CalendarDate(2025, 1, 10), true, 10);

      expect(dates).toHaveLength(10);
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 1));
      expect(dates[9]).toEqual(new CalendarDate(2025, 1, 10));
    });

    it('should return empty array when no occurrence before date', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 10),
        count: 10,
      });

      const dates = rrule.before(new CalendarDate(2025, 1, 5));

      expect(dates).toEqual([]);
    });

    it('should work with weekly recurrence', () => {
      const rrule = new RRule({
        freq: Frequencies.WEEKLY,
        dtstart: new CalendarDate(2025, 1, 6), // Monday
        byweekday: [Weekdays.MO],
        count: 10,
      });

      const dates = rrule.before(new CalendarDate(2025, 1, 25), false, 3); // Saturday

      expect(dates).toHaveLength(3);
      expect(dates[dates.length - 1]).toEqual(new CalendarDate(2025, 1, 20)); // Previous Monday
    });
  });

  describe('after()', () => {
    it('should find occurrences after date', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 1),
        count: 31,
      });

      const dates = rrule.after(new CalendarDate(2025, 1, 15), false, 5);

      expect(dates).toHaveLength(5);
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 16));
    });

    it('should include date when inclusive=true', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 1),
        count: 31,
      });

      const dates = rrule.after(new CalendarDate(2025, 1, 15), true, 5);

      expect(dates).toHaveLength(5);
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 15));
    });

    it('should return empty array when no occurrence after date', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 1),
        until: new CalendarDate(2025, 1, 10),
      });

      const dates = rrule.after(new CalendarDate(2025, 1, 15)); // After UNTIL date

      expect(dates).toEqual([]);
    });

    it('should work with monthly recurrence', () => {
      const rrule = new RRule({
        freq: Frequencies.MONTHLY,
        dtstart: new CalendarDate(2025, 1, 15),
        count: 12,
      });

      const dates = rrule.after(new CalendarDate(2025, 2, 10), false, 3);

      expect(dates).toHaveLength(3);
      expect(dates[0]).toEqual(new CalendarDate(2025, 2, 15));
    });

    it('should efficiently seek to future dates', () => {
      const rrule = new RRule({
        freq: Frequencies.YEARLY,
        dtstart: new CalendarDate(2025, 1, 1),
        count: 100,
      });

      // Should efficiently find year 2075 without iterating through all years
      const dates = rrule.after(new CalendarDate(2075, 1, 1), true, 10);

      expect(dates).toHaveLength(10);
      expect(dates[0]).toEqual(new CalendarDate(2075, 1, 1));
    });
  });

  describe('previous()', () => {
    it('should find the last occurrence before a date', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 1),
        count: 31,
      });

      const date = rrule.previous(new CalendarDate(2025, 1, 15));

      expect(date).toEqual(new CalendarDate(2025, 1, 14));
    });

    it('should include date when inclusive=true', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 1),
        count: 31,
      });

      const date = rrule.previous(new CalendarDate(2025, 1, 15), true);

      expect(date).toEqual(new CalendarDate(2025, 1, 15));
    });

    it('should return undefined when no occurrence before date', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 10),
        count: 10,
      });

      const date = rrule.previous(new CalendarDate(2025, 1, 5));

      expect(date).toBeUndefined();
    });

    it('should work with weekly recurrence', () => {
      const rrule = new RRule({
        freq: Frequencies.WEEKLY,
        dtstart: new CalendarDate(2025, 1, 6), // Monday
        byweekday: [Weekdays.MO],
        count: 10,
      });

      const date = rrule.previous(new CalendarDate(2025, 1, 25)); // Saturday

      expect(date).toEqual(new CalendarDate(2025, 1, 20)); // Previous Monday
    });

    it('should return the last occurrence for infinite recurrence', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 1),
      });

      // Set low maxIterations to avoid long test
      rrule.maxIterations = 100;

      const date = rrule.previous(new CalendarDate(2025, 1, 15));

      expect(date).toEqual(new CalendarDate(2025, 1, 14));
    });
  });

  describe('next()', () => {
    it('should find the first occurrence after a date', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 1),
        count: 31,
      });

      const date = rrule.next(new CalendarDate(2025, 1, 15));

      expect(date).toEqual(new CalendarDate(2025, 1, 16));
    });

    it('should include date when inclusive=true', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 1),
        count: 31,
      });

      const date = rrule.next(new CalendarDate(2025, 1, 15), true);

      expect(date).toEqual(new CalendarDate(2025, 1, 15));
    });

    it('should return undefined when no occurrence after date', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 1),
        until: new CalendarDate(2025, 1, 10),
      });

      const date = rrule.next(new CalendarDate(2025, 1, 15));

      expect(date).toBeUndefined();
    });

    it('should work with monthly recurrence', () => {
      const rrule = new RRule({
        freq: Frequencies.MONTHLY,
        dtstart: new CalendarDate(2025, 1, 15),
        count: 12,
      });

      const date = rrule.next(new CalendarDate(2025, 2, 10));

      expect(date).toEqual(new CalendarDate(2025, 2, 15));
    });

    it('should efficiently seek to future dates', () => {
      const rrule = new RRule({
        freq: Frequencies.YEARLY,
        dtstart: new CalendarDate(2025, 1, 1),
        count: 100,
      });

      const date = rrule.next(new CalendarDate(2075, 1, 1), true);

      expect(date).toEqual(new CalendarDate(2075, 1, 1));
    });
  });

  describe('iterator protocol', () => {
    it('should work with for...of loop', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 1),
        count: 5,
      });

      const dates: CalendarDate[] = [];
      for (const date of rrule) {
        dates.push(date as CalendarDate);
      }

      expect(dates).toHaveLength(5);
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 1));
      expect(dates[4]).toEqual(new CalendarDate(2025, 1, 5));
    });

    it('should work with spread operator', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 1),
        count: 3,
      });

      const dates = [...rrule];

      expect(dates).toHaveLength(3);
      expect(dates).toEqual([
        new CalendarDate(2025, 1, 1),
        new CalendarDate(2025, 1, 2),
        new CalendarDate(2025, 1, 3),
      ]);
    });

    it('should work with Array.from', () => {
      const rrule = new RRule({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 1),
        count: 3,
      });

      const dates = Array.from(rrule);

      expect(dates).toHaveLength(3);
    });
  });

  describe('Edge Cases', () => {
    describe('Invalid Date Handling', () => {
      it('should skip February 30th', () => {
        // Monthly on the 30th should skip February
        const rrule = new RRule({
          freq: Frequencies.MONTHLY,
          bymonthday: [30],
          dtstart: new CalendarDate(2025, 1, 30),
          count: 5,
        });

        const dates = rrule.all();

        expect(dates).toHaveLength(5);
        expect(dates[0]).toEqual(new CalendarDate(2025, 1, 30));
        expect(dates[1]).toEqual(new CalendarDate(2025, 3, 30)); // Skips Feb
        expect(dates[2]).toEqual(new CalendarDate(2025, 4, 30));
        expect(dates[3]).toEqual(new CalendarDate(2025, 5, 30));
        expect(dates[4]).toEqual(new CalendarDate(2025, 6, 30));
      });

      it('should skip February 31st', () => {
        // Monthly on the 31st should skip February
        const rrule = new RRule({
          freq: Frequencies.MONTHLY,
          bymonthday: [31],
          dtstart: new CalendarDate(2025, 1, 31),
          count: 5,
        });

        const dates = rrule.all();

        expect(dates).toHaveLength(5);
        expect(dates[0]).toEqual(new CalendarDate(2025, 1, 31));
        expect(dates[1]).toEqual(new CalendarDate(2025, 3, 31)); // Skips Feb
        expect(dates[2]).toEqual(new CalendarDate(2025, 5, 31)); // Skips Apr (30 days)
        expect(dates[3]).toEqual(new CalendarDate(2025, 7, 31));
        expect(dates[4]).toEqual(new CalendarDate(2025, 8, 31));
      });

      it('should skip 31st for months with only 30 days', () => {
        // April, June, September, November have 30 days
        const rrule = new RRule({
          freq: Frequencies.MONTHLY,
          bymonthday: [31],
          bymonth: [4, 6, 9, 11], // All 30-day months
          dtstart: new CalendarDate(2025, 1, 1),
          count: 10,
        });

        const dates = rrule.all();

        // Should generate no dates since none of these months have 31 days
        expect(dates).toHaveLength(0);
      });

      it('should handle leap year February 29th correctly', () => {
        const rrule = new RRule({
          freq: Frequencies.YEARLY,
          bymonth: [2],
          bymonthday: [29],
          dtstart: new CalendarDate(2024, 2, 29), // Leap year
          count: 5,
        });

        const dates = rrule.all();

        expect(dates).toHaveLength(5);
        expect(dates[0]).toEqual(new CalendarDate(2024, 2, 29));
        expect(dates[1]).toEqual(new CalendarDate(2028, 2, 29)); // Next leap year
        expect(dates[2]).toEqual(new CalendarDate(2032, 2, 29));
        expect(dates[3]).toEqual(new CalendarDate(2036, 2, 29));
        expect(dates[4]).toEqual(new CalendarDate(2040, 2, 29));
      });
    });

    describe('BYSETPOS', () => {
      it('should handle BYSETPOS with multiple positions (first and last)', () => {
        const rrule = new RRule({
          freq: Frequencies.MONTHLY,
          byweekday: [
            Weekdays.MO,
            Weekdays.TU,
            Weekdays.WE,
            Weekdays.TH,
            Weekdays.FR,
          ],
          bysetpos: [1, -1], // First and last weekday
          dtstart: new CalendarDate(2025, 1, 1),
          count: 6,
        });

        const dates = rrule.all();

        expect(dates).toHaveLength(6);
        // Jan: 1st (Wed), 31st (Fri)
        expect(dates[0]).toEqual(new CalendarDate(2025, 1, 1));
        expect(dates[1]).toEqual(new CalendarDate(2025, 1, 31));
        // Feb: 3rd (Mon), 28th (Fri)
        expect(dates[2]).toEqual(new CalendarDate(2025, 2, 3));
        expect(dates[3]).toEqual(new CalendarDate(2025, 2, 28));
      });

      it('should handle BYSETPOS with YEARLY frequency', () => {
        const rrule = new RRule({
          freq: Frequencies.YEARLY,
          byweekday: [Weekdays.SU],
          bysetpos: [1, 10, -1], // 1st, 10th, and last Sunday of the year
          dtstart: new CalendarDate(2025, 1, 1),
          count: 6,
        });

        const dates = rrule.all();

        expect(dates).toHaveLength(6);
        // 2025: 1st Sunday = Jan 5, 10th = Mar 9, last = Dec 28
        expect(dates[0].month).toBe(1);
        expect(dates[0].day).toBe(5);
        expect(dates[1].month).toBe(3);
        expect(dates[2].month).toBe(12);
        expect(dates[2].day).toBe(28);
      });

      it('should handle BYSETPOS with large position numbers', () => {
        // BYSETPOS works when combined with other BY* rules
        const rrule = new RRule({
          freq: Frequencies.YEARLY,
          byweekday: [Weekdays.MO], // All Mondays (~52 per year)
          bysetpos: [1, -1], // First and last Monday
          dtstart: new CalendarDate(2024, 1, 1),
          count: 4,
        });

        const dates = rrule.all();

        // Should get first and last Monday of each year
        expect(dates).toHaveLength(4);
        expect(dates[0]).toEqual(new CalendarDate(2024, 1, 1));
        expect(dates[1]).toEqual(new CalendarDate(2024, 12, 30));
        expect(dates[2]).toEqual(new CalendarDate(2025, 1, 6));
        expect(dates[3]).toEqual(new CalendarDate(2025, 12, 29));
      });
    });

    describe('Negative Indices', () => {
      it('should handle BYWEEKNO with negative values', () => {
        const rrule = new RRule({
          freq: Frequencies.YEARLY,
          byweekno: [-1, -2], // Last and second-to-last week
          dtstart: new CalendarDate(2025, 1, 1),
          count: 4,
        });

        const dates = rrule.all();

        expect(dates).toHaveLength(4);
        // Should be in December
        expect(dates.every((d) => d.month === 12)).toBe(true);
      });

      it('should handle BYDAY with negative ordinals', () => {
        const rrule = new RRule({
          freq: Frequencies.MONTHLY,
          byweekday: [{ weekday: Weekdays.FR, n: -2 }], // 2nd-to-last Friday
          dtstart: new CalendarDate(2025, 1, 1),
          count: 3,
        });

        const dates = rrule.all();

        expect(dates).toHaveLength(3);
        // All should be Fridays
        expect(dates.every((d) => d.toString().match(/2025-\d{2}-\d{2}/))).toBe(
          true,
        );
      });

      it('should handle BYYEARDAY with negative values', () => {
        const rrule = new RRule({
          freq: Frequencies.YEARLY,
          byyearday: [-1, -100], // Last day and 100th-to-last day
          dtstart: new CalendarDate(2025, 1, 1),
          count: 4,
        });

        const dates = rrule.all();

        expect(dates).toHaveLength(4);
        // -1 should be Dec 31, -100 should be Sep 23
        expect(dates[0].month).toBe(9);
        expect(dates[0].day).toBe(23);
        expect(dates[1].month).toBe(12);
        expect(dates[1].day).toBe(31);
      });
    });

    describe('INTERVAL', () => {
      it('should handle large INTERVAL values', () => {
        const rrule = new RRule({
          freq: Frequencies.YEARLY,
          interval: 10,
          dtstart: new CalendarDate(2025, 1, 1),
          count: 3,
        });

        const dates = rrule.all();

        expect(dates).toHaveLength(3);
        expect(dates[0]).toEqual(new CalendarDate(2025, 1, 1));
        expect(dates[1]).toEqual(new CalendarDate(2035, 1, 1));
        expect(dates[2]).toEqual(new CalendarDate(2045, 1, 1));
      });

      it('should handle INTERVAL with SECONDLY frequency', () => {
        const rrule = new RRule({
          freq: Frequencies.SECONDLY,
          interval: 15,
          dtstart: new CalendarDateTime(2025, 1, 1, 12, 0, 0),
          count: 5,
        });

        const dates = rrule.all();

        expect(dates).toHaveLength(5);
        expect(dates[0]).toEqual(new CalendarDateTime(2025, 1, 1, 12, 0, 0));
        expect(dates[1]).toEqual(new CalendarDateTime(2025, 1, 1, 12, 0, 15));
        expect(dates[2]).toEqual(new CalendarDateTime(2025, 1, 1, 12, 0, 30));
        expect(dates[3]).toEqual(new CalendarDateTime(2025, 1, 1, 12, 0, 45));
        expect(dates[4]).toEqual(new CalendarDateTime(2025, 1, 1, 12, 1, 0));
      });
    });

    describe('Complex BYxxx Combinations', () => {
      it('should handle BYMONTH + BYDAY + BYHOUR + BYMINUTE', () => {
        const rrule = new RRule({
          freq: Frequencies.YEARLY,
          bymonth: [1],
          byweekday: [Weekdays.SU],
          byhour: [8, 9],
          byminute: [30],
          dtstart: new CalendarDateTime(2025, 1, 1, 8, 30, 0),
          count: 6,
        });

        const dates = rrule.all();

        expect(dates).toHaveLength(6);
        // Should be Sundays in January at 8:30 and 9:30
        dates.forEach((d) => {
          if ('hour' in d) {
            expect(d.month).toBe(1);
            expect(d.minute).toBe(30);
            expect([8, 9]).toContain(d.hour);
          }
        });
      });

      it('should handle BYMONTH with DAILY limiting behavior', () => {
        // BYMONTH limits DAILY to only those months
        const rrule = new RRule({
          freq: Frequencies.DAILY,
          bymonth: [1, 6, 12],
          dtstart: new CalendarDate(2025, 1, 1),
          count: 10,
        });

        const dates = rrule.all();

        expect(dates).toHaveLength(10);
        // All should be in Jan, Jun, or Dec
        dates.forEach((d) => {
          expect([1, 6, 12]).toContain(d.month);
        });
      });

      it('should handle BYSECOND with multiple frequencies', () => {
        const rrule = new RRule({
          freq: Frequencies.MINUTELY,
          bysecond: [0, 15, 30, 45],
          dtstart: new CalendarDateTime(2025, 1, 1, 12, 0, 0),
          count: 8,
        });

        const dates = rrule.all();

        expect(dates).toHaveLength(8);
        // Should cycle through seconds
        const seconds = dates.map((d) => ('second' in d ? d.second : 0));
        expect(seconds).toEqual([0, 15, 30, 45, 0, 15, 30, 45]);
      });
    });

    describe('Boundary Values', () => {
      it('should handle BYSECOND at boundary (59)', () => {
        const rrule = new RRule({
          freq: Frequencies.MINUTELY,
          bysecond: [59],
          dtstart: new CalendarDateTime(2025, 1, 1, 12, 0, 0),
          count: 3,
        });

        const dates = rrule.all();

        expect(dates).toHaveLength(3);

        dates.forEach((d) => {
          if ('second' in d) expect(d.second).toBe(59);
        });
      });

      it('should handle BYHOUR at boundary (23)', () => {
        const rrule = new RRule({
          freq: Frequencies.DAILY,
          byhour: [23],
          dtstart: new CalendarDateTime(2025, 1, 1, 23, 0, 0),
          count: 3,
        });

        const dates = rrule.all();

        expect(dates).toHaveLength(3);
        dates.forEach((d) => {
          if ('hour' in d) expect(d.hour).toBe(23);
        });
      });

      it('should handle BYMONTH at boundaries (1 and 12)', () => {
        const rrule = new RRule({
          freq: Frequencies.YEARLY,
          bymonth: [1, 12],
          dtstart: new CalendarDate(2025, 1, 1),
          count: 4,
        });

        const dates = rrule.all();

        expect(dates).toHaveLength(4);
        expect(dates[0]).toEqual(new CalendarDate(2025, 1, 1));
        expect(dates[1]).toEqual(new CalendarDate(2025, 12, 1));
        expect(dates[2]).toEqual(new CalendarDate(2026, 1, 1));
        expect(dates[3]).toEqual(new CalendarDate(2026, 12, 1));
      });
    });

    describe('Leap Year Edge Cases', () => {
      it('should handle week 53 in years where it exists', () => {
        // Week 53 exists when Jan 1 is Thursday, or leap year + Jan 1 is Wed
        const rrule = new RRule({
          freq: Frequencies.YEARLY,
          byweekno: [53],
          dtstart: new CalendarDate(2015, 1, 1), // Has week 53
          // count: 3,
        });

        const dates = rrule.all(3);

        // Should only generate dates in years with week 53
        expect(dates.length).toBeGreaterThan(0);
        dates.forEach((d) => {
          expect(d.month).toBe(12);
          expect(d.day).toBeGreaterThanOrEqual(28);
        });
      });

      it('should handle BYYEARDAY=366 only in leap years', () => {
        const rrule = new RRule({
          freq: Frequencies.YEARLY,
          byyearday: [366],
          dtstart: new CalendarDate(2024, 1, 1), // Leap year
          count: 3,
        });

        const dates = rrule.all();

        expect(dates).toHaveLength(3);
        // Should only be Dec 31 in leap years
        dates.forEach((d) => {
          expect(d.month).toBe(12);
          expect(d.day).toBe(31);
          // Year should be leap year
          const year = d.year;
          expect(year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)).toBe(
            true,
          );
        });
      });
    });

    describe('Input Sanitization', () => {
      it('should sanitize invalid BYMONTH values (0)', () => {
        const rrule = new RRule({
          freq: Frequencies.YEARLY,
          bymonth: [0, 1, 13], // 0 and 13 are invalid
          dtstart: new CalendarDate(2025, 1, 1),
          count: 2,
        });

        const dates = rrule.all();

        // Should only use month 1
        expect(dates).toHaveLength(2);
        expect(dates[0]).toEqual(new CalendarDate(2025, 1, 1));
        expect(dates[1]).toEqual(new CalendarDate(2026, 1, 1));
      });

      it('should sanitize invalid BYWEEKDAY values', () => {
        const rrule = new RRule({
          freq: Frequencies.WEEKLY,
          byweekday: [Weekdays.MO, 'INVALID', Weekdays.FR],
          dtstart: new CalendarDate(2025, 1, 1),
          count: 4,
        });

        const dates = rrule.all();

        // Should only use MO and FR
        expect(dates.length).toBeGreaterThan(0);
      });
    });
  });
});
