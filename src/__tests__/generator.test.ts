import type { DateValue } from '@internationalized/date';
import {
  CalendarDate,
  CalendarDateTime,
  ZonedDateTime,
} from '@internationalized/date';
import { describe, expect, it } from 'vitest';
import { generateDates } from '../generator';
import type { Frequency } from '../types';
import { Frequencies, Weekdays } from '../types';

describe('Generator', () => {
  describe('DAILY frequency', () => {
    it('should generate daily occurrences', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.DAILY,
          dtstart: new CalendarDate(2025, 1, 1),
          count: 3,
        }),
      );

      expect(dates).toHaveLength(3);
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 1));
      expect(dates[1]).toEqual(new CalendarDate(2025, 1, 2));
      expect(dates[2]).toEqual(new CalendarDate(2025, 1, 3));
    });

    it('should generate daily with interval', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.DAILY,
          dtstart: new CalendarDate(2025, 1, 1),
          interval: 2,
          count: 3,
        }),
      );

      expect(dates).toHaveLength(3);
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 1));
      expect(dates[1]).toEqual(new CalendarDate(2025, 1, 3));
      expect(dates[2]).toEqual(new CalendarDate(2025, 1, 5));
    });

    it('should generate daily until date', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.DAILY,
          dtstart: new CalendarDate(2025, 1, 1),
          until: new CalendarDate(2025, 1, 3),
        }),
      );

      expect(dates).toHaveLength(3);
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 1));
      expect(dates[1]).toEqual(new CalendarDate(2025, 1, 2));
      expect(dates[2]).toEqual(new CalendarDate(2025, 1, 3));
    });
  });

  describe('WEEKLY frequency', () => {
    it('should generate weekly occurrences', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.WEEKLY,
          dtstart: new CalendarDate(2025, 1, 1), // Wednesday
          count: 3,
        }),
      );

      expect(dates).toHaveLength(3);
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 1));
      expect(dates[1]).toEqual(new CalendarDate(2025, 1, 8));
      expect(dates[2]).toEqual(new CalendarDate(2025, 1, 15));
    });

    it('should generate weekly with BYDAY', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.WEEKLY,
          dtstart: new CalendarDate(2025, 1, 6), // Monday
          byweekday: [Weekdays.MO, Weekdays.WE, Weekdays.FR],
          count: 6,
        }),
      );

      expect(dates).toHaveLength(6);
      // First week: Mon, Wed, Fri
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 6)); // Mon
      expect(dates[1]).toEqual(new CalendarDate(2025, 1, 8)); // Wed
      expect(dates[2]).toEqual(new CalendarDate(2025, 1, 10)); // Fri
      // Second week: Mon, Wed, Fri
      expect(dates[3]).toEqual(new CalendarDate(2025, 1, 13)); // Mon
      expect(dates[4]).toEqual(new CalendarDate(2025, 1, 15)); // Wed
      expect(dates[5]).toEqual(new CalendarDate(2025, 1, 17)); // Fri
    });
  });

  describe('MONTHLY frequency', () => {
    it('should generate monthly occurrences', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.MONTHLY,
          dtstart: new CalendarDate(2025, 1, 15),
          count: 3,
        }),
      );

      expect(dates).toHaveLength(3);
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 15));
      expect(dates[1]).toEqual(new CalendarDate(2025, 2, 15));
      expect(dates[2]).toEqual(new CalendarDate(2025, 3, 15));
    });

    it('should generate monthly with BYMONTHDAY', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.MONTHLY,
          dtstart: new CalendarDate(2025, 1, 1),
          bymonthday: [1, 15, -1], // 1st, 15th, and last day
          count: 6,
        }),
      );

      expect(dates).toHaveLength(6);
      // January: 1, 15, 31
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 1));
      expect(dates[1]).toEqual(new CalendarDate(2025, 1, 15));
      expect(dates[2]).toEqual(new CalendarDate(2025, 1, 31));
      // February: 1, 15, 28
      expect(dates[3]).toEqual(new CalendarDate(2025, 2, 1));
      expect(dates[4]).toEqual(new CalendarDate(2025, 2, 15));
      expect(dates[5]).toEqual(new CalendarDate(2025, 2, 28));
    });

    it('should generate monthly with BYDAY', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.MONTHLY,
          dtstart: new CalendarDate(2025, 1, 1),
          byweekday: [{ weekday: Weekdays.MO, n: 1 }], // First Monday
          count: 3,
        }),
      );

      expect(dates).toHaveLength(3);
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 6)); // First Monday of January
      expect(dates[1]).toEqual(new CalendarDate(2025, 2, 3)); // First Monday of February
      expect(dates[2]).toEqual(new CalendarDate(2025, 3, 3)); // First Monday of March
    });

    it('should generate monthly with BYDAY -1 (last occurrence)', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.MONTHLY,
          dtstart: new CalendarDate(2025, 1, 1),
          byweekday: [{ weekday: Weekdays.FR, n: -1 }], // Last Friday
          count: 3,
        }),
      );

      expect(dates).toHaveLength(3);
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 31)); // Last Friday of January
      expect(dates[1]).toEqual(new CalendarDate(2025, 2, 28)); // Last Friday of February
      expect(dates[2]).toEqual(new CalendarDate(2025, 3, 28)); // Last Friday of March
    });
  });

  describe('YEARLY frequency', () => {
    it('should generate yearly occurrences', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.YEARLY,
          dtstart: new CalendarDate(2025, 1, 1),
          count: 3,
        }),
      );

      expect(dates).toHaveLength(3);
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 1));
      expect(dates[1]).toEqual(new CalendarDate(2026, 1, 1));
      expect(dates[2]).toEqual(new CalendarDate(2027, 1, 1));
    });

    it('should generate yearly with BYMONTH', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.YEARLY,
          dtstart: new CalendarDate(2025, 1, 15),
          bymonth: [1, 6, 12], // Jan, Jun, Dec
          count: 6,
        }),
      );

      expect(dates).toHaveLength(6);
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 15));
      expect(dates[1]).toEqual(new CalendarDate(2025, 6, 15));
      expect(dates[2]).toEqual(new CalendarDate(2025, 12, 15));
      expect(dates[3]).toEqual(new CalendarDate(2026, 1, 15));
      expect(dates[4]).toEqual(new CalendarDate(2026, 6, 15));
      expect(dates[5]).toEqual(new CalendarDate(2026, 12, 15));
    });

    it('should generate yearly with BYYEARDAY', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.YEARLY,
          dtstart: new CalendarDate(2024, 1, 1), // Leap year
          byyearday: [1, 100, 200, 366], // Jan 1, Apr 9 (leap), Jul 18 (leap), Dec 31
          count: 4,
        }),
      );

      expect(dates).toHaveLength(4);
      expect(dates[0]).toEqual(new CalendarDate(2024, 1, 1)); // Day 1 = Jan 1
      expect(dates[1]).toEqual(new CalendarDate(2024, 4, 9)); // Day 100 in leap year
      expect(dates[2]).toEqual(new CalendarDate(2024, 7, 18)); // Day 200 in leap year
      expect(dates[3]).toEqual(new CalendarDate(2024, 12, 31)); // Day 366 in leap year
    });

    it('should generate yearly with negative BYYEARDAY', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.YEARLY,
          dtstart: new CalendarDate(2024, 1, 1),
          byyearday: [-1, -100], // Last day, 100th from end
          count: 2,
        }),
      );

      expect(dates).toHaveLength(2);
      expect(dates[0]).toEqual(new CalendarDate(2024, 9, 23)); // 366-100+1 = day 267 = Sept 23
      expect(dates[1]).toEqual(new CalendarDate(2024, 12, 31)); // Last day
    });

    it('should handle BYYEARDAY in non-leap years', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.YEARLY,
          dtstart: new CalendarDate(2025, 1, 1), // Non-leap year
          byyearday: [1, 100, 200], // Jan 1, Apr 10 (non-leap), Jul 19 (non-leap)
          count: 3,
        }),
      );

      expect(dates).toHaveLength(3);
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 1)); // Day 1 = Jan 1
      expect(dates[1]).toEqual(new CalendarDate(2025, 4, 10)); // Day 100 in non-leap
      expect(dates[2]).toEqual(new CalendarDate(2025, 7, 19)); // Day 200 in non-leap
    });

    it('should skip invalid BYYEARDAY for leap years (day 366 in non-leap)', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.YEARLY,
          dtstart: new CalendarDate(2025, 1, 1), // Non-leap year
          byyearday: [1, 366], // 366 doesn't exist in non-leap years
          count: 4, // Will span 2 years to get 4 valid occurrences
        }),
      );

      expect(dates).toHaveLength(4);
      // 2025: only day 1 (day 366 skipped)
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 1));
      // 2026: only day 1 (day 366 skipped)
      expect(dates[1]).toEqual(new CalendarDate(2026, 1, 1));
      // 2027: only day 1 (day 366 skipped)
      expect(dates[2]).toEqual(new CalendarDate(2027, 1, 1));
      // 2028: day 1 (leap year, so day 366 will come after)
      expect(dates[3]).toEqual(new CalendarDate(2028, 1, 1));
    });

    it('should preserve time components with CalendarDateTime and BYYEARDAY', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.YEARLY,
          dtstart: new CalendarDateTime(2024, 1, 1, 9, 30, 0),
          byyearday: [1, 100],
          count: 2,
        }),
      );

      expect(dates).toHaveLength(2);
      expect(dates[0]).toEqual(new CalendarDateTime(2024, 1, 1, 9, 30, 0));
      expect(dates[1]).toEqual(new CalendarDateTime(2024, 4, 9, 9, 30, 0));
    });

    it('should preserve time components with ZonedDateTime and BYYEARDAY', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.YEARLY,
          dtstart: new ZonedDateTime(
            2024,
            1,
            1,
            'America/New_York',
            -18000000,
            14,
            30,
            0,
            0,
          ),
          byyearday: [1, 100],
          count: 2,
        }),
      );

      expect(dates).toHaveLength(2);

      // Check that time is preserved
      expect(dates[0].year).toBe(2024);
      expect(dates[0].month).toBe(1);
      expect(dates[0].day).toBe(1);
      expect((dates[0] as ZonedDateTime).hour).toBe(14);
      expect((dates[0] as ZonedDateTime).minute).toBe(30);

      expect(dates[1].year).toBe(2024);
      expect(dates[1].month).toBe(4);
      expect(dates[1].day).toBe(9);
      expect((dates[1] as ZonedDateTime).hour).toBe(14);
      expect((dates[1] as ZonedDateTime).minute).toBe(30);
    });
  });

  describe('Iterator protocol', () => {
    it('should work with for...of loop', () => {
      const iterator = generateDates({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 1),
        count: 3,
      });

      const dates: DateValue[] = [];
      for (const date of iterator) {
        dates.push(date);
      }

      expect(dates).toHaveLength(3);
    });

    it('should work with spread operator', () => {
      const iterator = generateDates({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 1),
        count: 3,
      });

      const dates = [...iterator];
      expect(dates).toHaveLength(3);
    });

    it('should work with Array.from', () => {
      const iterator = generateDates({
        freq: Frequencies.DAILY,
        dtstart: new CalendarDate(2025, 1, 1),
        count: 3,
      });

      const dates = Array.from(iterator);
      expect(dates).toHaveLength(3);
    });
  });

  describe('BYSETPOS', () => {
    it('should filter positions with BYSETPOS', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.MONTHLY,
          dtstart: new CalendarDate(2025, 1, 1),
          byweekday: ['MO', 'TU', 'WE', 'TH', 'FR'], // All weekdays
          bysetpos: [-1], // Last weekday of month
          count: 3,
        }),
      );

      expect(dates).toHaveLength(3);
      // Last weekday of each month
      expect(dates[0]).toEqual(new CalendarDate(2025, 1, 31)); // Friday
      expect(dates[1]).toEqual(new CalendarDate(2025, 2, 28)); // Friday
      expect(dates[2]).toEqual(new CalendarDate(2025, 3, 31)); // Monday
    });
  });

  describe('HOURLY frequency', () => {
    it('should generate hourly occurrences', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.HOURLY,
          dtstart: new CalendarDateTime(2025, 1, 1, 9, 0, 0),
          count: 5,
        }),
      );

      expect(dates).toHaveLength(5);
      expect(dates[0]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 0, 0));
      expect(dates[1]).toEqual(new CalendarDateTime(2025, 1, 1, 10, 0, 0));
      expect(dates[2]).toEqual(new CalendarDateTime(2025, 1, 1, 11, 0, 0));
      expect(dates[3]).toEqual(new CalendarDateTime(2025, 1, 1, 12, 0, 0));
      expect(dates[4]).toEqual(new CalendarDateTime(2025, 1, 1, 13, 0, 0));
    });

    it('should generate hourly with interval', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.HOURLY,
          dtstart: new CalendarDateTime(2025, 1, 1, 9, 0, 0),
          interval: 3,
          count: 4,
        }),
      );

      expect(dates).toHaveLength(4);
      expect(dates[0]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 0, 0));
      expect(dates[1]).toEqual(new CalendarDateTime(2025, 1, 1, 12, 0, 0));
      expect(dates[2]).toEqual(new CalendarDateTime(2025, 1, 1, 15, 0, 0));
      expect(dates[3]).toEqual(new CalendarDateTime(2025, 1, 1, 18, 0, 0));
    });

    it('should generate hourly with BYMINUTE', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.HOURLY,
          dtstart: new CalendarDateTime(2025, 1, 1, 9, 0, 0),
          byminute: [0, 30],
          count: 6,
        }),
      );

      expect(dates).toHaveLength(6);
      expect(dates[0]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 0, 0));
      expect(dates[1]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 30, 0));
      expect(dates[2]).toEqual(new CalendarDateTime(2025, 1, 1, 10, 0, 0));
      expect(dates[3]).toEqual(new CalendarDateTime(2025, 1, 1, 10, 30, 0));
    });

    it('should generate hourly with BYSECOND', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.HOURLY,
          dtstart: new CalendarDateTime(2025, 1, 1, 9, 0, 0),
          bysecond: [0, 15, 30, 45],
          count: 4,
        }),
      );

      expect(dates).toHaveLength(4);
      expect(dates[0]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 0, 0));
      expect(dates[1]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 0, 15));
      expect(dates[2]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 0, 30));
      expect(dates[3]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 0, 45));
    });

    it('should generate hourly with BYWEEKDAY filter', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.HOURLY,
          dtstart: new CalendarDateTime(2025, 1, 6, 9, 0, 0), // Monday
          byweekday: [Weekdays.WE], // Only Wed - will skip Mon and Tue
          count: 3,
        }),
      );

      // Should skip Monday and Tuesday, start on Wednesday (1/8)
      expect(dates).toHaveLength(3);
      expect(dates[0]).toEqual(new CalendarDateTime(2025, 1, 8, 0, 0, 0)); // Wed 12am
      expect(dates[1]).toEqual(new CalendarDateTime(2025, 1, 8, 1, 0, 0)); // Wed 1am
      expect(dates[2]).toEqual(new CalendarDateTime(2025, 1, 8, 2, 0, 0)); // Wed 2am
    });

    it('should generate hourly with BYMONTHDAY filter', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.HOURLY,
          dtstart: new CalendarDateTime(2025, 1, 1, 9, 0, 0),
          bymonthday: [15], // Only on 15th - will skip all of 1st
          count: 3,
        }),
      );

      // Should skip Jan 1st through 14th, start on Jan 15th
      expect(dates).toHaveLength(3);
      expect(dates[0]).toEqual(new CalendarDateTime(2025, 1, 15, 0, 0, 0));
      expect(dates[1]).toEqual(new CalendarDateTime(2025, 1, 15, 1, 0, 0));
      expect(dates[2]).toEqual(new CalendarDateTime(2025, 1, 15, 2, 0, 0));
    });

    it('should generate hourly with BYMONTH filter', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.HOURLY,
          dtstart: new CalendarDateTime(2025, 1, 1, 9, 0, 0),
          bymonth: [2], // Only February - skip all of January
          count: 3,
        }),
      );

      // Should skip all of January, start on Feb 1st
      expect(dates).toHaveLength(3);
      expect(dates[0]).toEqual(new CalendarDateTime(2025, 2, 1, 0, 0, 0));
      expect(dates[1]).toEqual(new CalendarDateTime(2025, 2, 1, 1, 0, 0));
      expect(dates[2]).toEqual(new CalendarDateTime(2025, 2, 1, 2, 0, 0));
    });
  });

  describe('MINUTELY frequency', () => {
    it('should generate minutely occurrences', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.MINUTELY,
          dtstart: new CalendarDateTime(2025, 1, 1, 9, 0, 0),
          count: 5,
        }),
      );

      expect(dates).toHaveLength(5);
      expect(dates[0]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 0, 0));
      expect(dates[1]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 1, 0));
      expect(dates[2]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 2, 0));
      expect(dates[3]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 3, 0));
      expect(dates[4]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 4, 0));
    });

    it('should generate minutely with interval', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.MINUTELY,
          dtstart: new CalendarDateTime(2025, 1, 1, 9, 0, 0),
          interval: 15,
          count: 4,
        }),
      );

      expect(dates).toHaveLength(4);
      expect(dates[0]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 0, 0));
      expect(dates[1]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 15, 0));
      expect(dates[2]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 30, 0));
      expect(dates[3]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 45, 0));
    });

    it('should generate minutely with BYSECOND', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.MINUTELY,
          dtstart: new CalendarDateTime(2025, 1, 1, 9, 0, 0),
          bysecond: [0, 30],
          count: 6,
        }),
      );

      expect(dates).toHaveLength(6);
      expect(dates[0]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 0, 0));
      expect(dates[1]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 0, 30));
      expect(dates[2]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 1, 0));
      expect(dates[3]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 1, 30));
      expect(dates[4]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 2, 0));
      expect(dates[5]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 2, 30));
    });
  });

  describe('SECONDLY frequency', () => {
    it('should generate secondly occurrences', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.SECONDLY,
          dtstart: new CalendarDateTime(2025, 1, 1, 9, 0, 0),
          count: 5,
        }),
      );

      expect(dates).toHaveLength(5);
      expect(dates[0]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 0, 0));
      expect(dates[1]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 0, 1));
      expect(dates[2]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 0, 2));
      expect(dates[3]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 0, 3));
      expect(dates[4]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 0, 4));
    });

    it('should generate secondly with interval', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.SECONDLY,
          dtstart: new CalendarDateTime(2025, 1, 1, 9, 0, 0),
          interval: 10,
          count: 6,
        }),
      );

      expect(dates).toHaveLength(6);
      expect(dates[0]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 0, 0));
      expect(dates[1]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 0, 10));
      expect(dates[2]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 0, 20));
      expect(dates[3]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 0, 30));
      expect(dates[4]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 0, 40));
      expect(dates[5]).toEqual(new CalendarDateTime(2025, 1, 1, 9, 0, 50));
    });
  });

  describe('Error handling', () => {
    it('should throw when DTSTART is missing', () => {
      expect(() => {
        Array.from(
          generateDates({
            freq: Frequencies.DAILY,
          }),
        );
      }).toThrow('DTSTART is required for generating occurrences');
    });

    it('should throw when max iterations exceeded', () => {
      expect(() => {
        Array.from(
          generateDates(
            {
              freq: Frequencies.DAILY,
              dtstart: new CalendarDate(2025, 1, 1),
              // No COUNT or UNTIL - infinite rule
            },
            10, // Very low maxIterations
          ),
        );
      }).toThrow('Max iterations (10) exceeded');
    });

    it('should handle interval=0 gracefully (early return)', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.DAILY,
          dtstart: new CalendarDate(2025, 1, 1),
          interval: 0,
          count: 5,
        }),
      );

      expect(dates).toHaveLength(0);
    });

    it('should handle UNTIL before DTSTART gracefully (early return)', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.DAILY,
          dtstart: new CalendarDate(2025, 1, 10),
          until: new CalendarDate(2025, 1, 1),
          count: 5,
        }),
      );

      expect(dates).toHaveLength(0);
    });

    it('should throw if the FREQ is invalid', () => {
      expect(() => {
        Array.from(
          generateDates({
            freq: 'INVALID' as Frequency,
            dtstart: new CalendarDate(2025, 1, 10),
          }),
        );
      }).toThrow('Unknown RRule frequency: INVALID');
    });
  });

  describe('Edge cases', () => {
    describe('Negative BYMONTHDAY with leap years', () => {
      it('should handle BYMONTHDAY=-1 across leap year February', () => {
        const dates = Array.from(
          generateDates({
            freq: Frequencies.MONTHLY,
            dtstart: new CalendarDate(2024, 1, 1), // 2024 is a leap year
            bymonthday: [-1], // Last day of month
            count: 6,
          }),
        );

        expect(dates).toHaveLength(6);
        expect(dates[0]).toEqual(new CalendarDate(2024, 1, 31)); // Jan 31
        expect(dates[1]).toEqual(new CalendarDate(2024, 2, 29)); // Feb 29 (leap year)
        expect(dates[2]).toEqual(new CalendarDate(2024, 3, 31)); // Mar 31
        expect(dates[3]).toEqual(new CalendarDate(2024, 4, 30)); // Apr 30
        expect(dates[4]).toEqual(new CalendarDate(2024, 5, 31)); // May 31
        expect(dates[5]).toEqual(new CalendarDate(2024, 6, 30)); // Jun 30
      });

      it('should handle BYMONTHDAY=-1 in non-leap year February', () => {
        const dates = Array.from(
          generateDates({
            freq: Frequencies.MONTHLY,
            dtstart: new CalendarDate(2025, 1, 1), // 2025 is NOT a leap year
            bymonthday: [-1], // Last day of month
            count: 3,
          }),
        );

        expect(dates).toHaveLength(3);
        expect(dates[0]).toEqual(new CalendarDate(2025, 1, 31)); // Jan 31
        expect(dates[1]).toEqual(new CalendarDate(2025, 2, 28)); // Feb 28 (non-leap)
        expect(dates[2]).toEqual(new CalendarDate(2025, 3, 31)); // Mar 31
      });

      it('should handle BYMONTHDAY=-3 (3rd-to-last day)', () => {
        const dates = Array.from(
          generateDates({
            freq: Frequencies.MONTHLY,
            dtstart: new CalendarDate(2024, 1, 1),
            bymonthday: [-3],
            count: 3,
          }),
        );

        expect(dates).toHaveLength(3);
        expect(dates[0]).toEqual(new CalendarDate(2024, 1, 29)); // Jan: 31-3+1 = 29
        expect(dates[1]).toEqual(new CalendarDate(2024, 2, 27)); // Feb leap: 29-3+1 = 27
        expect(dates[2]).toEqual(new CalendarDate(2024, 3, 29)); // Mar: 31-3+1 = 29
      });
    });

    describe('Invalid dates (silently skipped per RFC 5545)', () => {
      it('should skip February 30th', () => {
        const dates = Array.from(
          generateDates({
            freq: Frequencies.MONTHLY,
            dtstart: new CalendarDate(2025, 1, 30),
            bymonthday: [30],
            count: 6,
          }),
        );

        // Should skip February (no 30th), include Jan, Mar, Apr, May, Jun, Jul
        expect(dates).toHaveLength(6);
        expect(dates[0]).toEqual(new CalendarDate(2025, 1, 30)); // Jan 30
        expect(dates[1]).toEqual(new CalendarDate(2025, 3, 30)); // Mar 30 (skips Feb)
        expect(dates[2]).toEqual(new CalendarDate(2025, 4, 30)); // Apr 30
        expect(dates[3]).toEqual(new CalendarDate(2025, 5, 30)); // May 30
        expect(dates[4]).toEqual(new CalendarDate(2025, 6, 30)); // Jun 30
        expect(dates[5]).toEqual(new CalendarDate(2025, 7, 30)); // Jul 30
      });

      it('should skip February 31st', () => {
        const dates = Array.from(
          generateDates({
            freq: Frequencies.MONTHLY,
            dtstart: new CalendarDate(2025, 1, 31),
            bymonthday: [31],
            count: 7,
          }),
        );

        // Should only include months with 31 days
        expect(dates).toHaveLength(7);
        expect(dates[0]).toEqual(new CalendarDate(2025, 1, 31)); // Jan 31
        expect(dates[1]).toEqual(new CalendarDate(2025, 3, 31)); // Mar 31 (skips Feb)
        expect(dates[2]).toEqual(new CalendarDate(2025, 5, 31)); // May 31 (skips Apr)
        expect(dates[3]).toEqual(new CalendarDate(2025, 7, 31)); // Jul 31 (skips Jun)
      });
    });
  });

  describe('Timezone Handling', () => {
    it('should generate daily occurrences in Asia/Tokyo timezone', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.DAILY,
          dtstart: new ZonedDateTime(
            2025,
            1,
            1,
            'Asia/Tokyo',
            32400000, // UTC+9
            9,
            0,
            0,
          ),
          count: 3,
        }),
      );

      expect(dates).toHaveLength(3);
      expect(dates[0]).toEqual(
        new ZonedDateTime(2025, 1, 1, 'Asia/Tokyo', 32400000, 9, 0, 0),
      );
      expect(dates[1]).toEqual(
        new ZonedDateTime(2025, 1, 2, 'Asia/Tokyo', 32400000, 9, 0, 0),
      );
      expect(dates[2]).toEqual(
        new ZonedDateTime(2025, 1, 3, 'Asia/Tokyo', 32400000, 9, 0, 0),
      );
    });

    it('should generate weekly occurrences in Europe/London timezone', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.WEEKLY,
          dtstart: new ZonedDateTime(
            2025,
            1,
            6,
            'Europe/London',
            0, // UTC+0 in winter
            14,
            30,
            0,
          ),
          count: 3,
        }),
      );

      expect(dates).toHaveLength(3);
      expect(dates[0]).toEqual(
        new ZonedDateTime(2025, 1, 6, 'Europe/London', 0, 14, 30, 0),
      );
      expect(dates[1]).toEqual(
        new ZonedDateTime(2025, 1, 13, 'Europe/London', 0, 14, 30, 0),
      );
      expect(dates[2]).toEqual(
        new ZonedDateTime(2025, 1, 20, 'Europe/London', 0, 14, 30, 0),
      );
    });

    it('should generate monthly occurrences in Australia/Sydney timezone', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.MONTHLY,
          dtstart: new ZonedDateTime(
            2025,
            1,
            15,
            'Australia/Sydney',
            39600000, // UTC+11 in summer
            16,
            0,
            0,
          ),
          count: 3,
        }),
      );

      expect(dates).toHaveLength(3);
      expect(dates[0].year).toBe(2025);
      expect(dates[0].month).toBe(1);
      expect(dates[0].day).toBe(15);
      expect((dates[0] as ZonedDateTime).hour).toBe(16);
      expect((dates[0] as ZonedDateTime).timeZone).toBe('Australia/Sydney');

      expect(dates[1].year).toBe(2025);
      expect(dates[1].month).toBe(2);
      expect(dates[1].day).toBe(15);
      expect((dates[1] as ZonedDateTime).hour).toBe(16);

      expect(dates[2].year).toBe(2025);
      expect(dates[2].month).toBe(3);
      expect(dates[2].day).toBe(15);
      expect((dates[2] as ZonedDateTime).hour).toBe(16);
    });

    it('should generate yearly occurrences in Pacific/Auckland timezone', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.YEARLY,
          dtstart: new ZonedDateTime(
            2025,
            3,
            1,
            'Pacific/Auckland',
            46800000, // UTC+13 in summer
            10,
            30,
            0,
          ),
          count: 3,
        }),
      );

      expect(dates).toHaveLength(3);
      expect(dates[0]).toEqual(
        new ZonedDateTime(2025, 3, 1, 'Pacific/Auckland', 46800000, 10, 30, 0),
      );
      expect(dates[1]).toEqual(
        new ZonedDateTime(2026, 3, 1, 'Pacific/Auckland', 46800000, 10, 30, 0),
      );
      expect(dates[2]).toEqual(
        new ZonedDateTime(2027, 3, 1, 'Pacific/Auckland', 46800000, 10, 30, 0),
      );
    });

    it('should handle BYWEEKDAY filter with timezone', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.WEEKLY,
          dtstart: new ZonedDateTime(
            2025,
            1,
            6,
            'America/Los_Angeles',
            -28800000, // UTC-8
            18,
            0,
            0,
          ),
          byweekday: [Weekdays.MO, Weekdays.WE, Weekdays.FR],
          count: 6,
        }),
      );

      expect(dates).toHaveLength(6);
      // Jan 6 is Monday
      expect(dates[0]).toEqual(
        new ZonedDateTime(
          2025,
          1,
          6,
          'America/Los_Angeles',
          -28800000,
          18,
          0,
          0,
        ),
      );
      // Jan 8 is Wednesday
      expect(dates[1]).toEqual(
        new ZonedDateTime(
          2025,
          1,
          8,
          'America/Los_Angeles',
          -28800000,
          18,
          0,
          0,
        ),
      );
      // Jan 10 is Friday
      expect(dates[2]).toEqual(
        new ZonedDateTime(
          2025,
          1,
          10,
          'America/Los_Angeles',
          -28800000,
          18,
          0,
          0,
        ),
      );
    });

    it('should handle BYMONTH filter with timezone', () => {
      const dates = Array.from(
        generateDates({
          freq: Frequencies.MONTHLY,
          dtstart: new ZonedDateTime(
            2025,
            1,
            1,
            'Europe/Paris',
            3600000, // UTC+1
            12,
            0,
            0,
          ),
          bymonth: [1, 6, 12],
          count: 6,
        }),
      );

      expect(dates).toHaveLength(6);
      expect(dates[0].month).toBe(1);
      expect(dates[1].month).toBe(6);
      expect(dates[2].month).toBe(12);
      expect(dates[3].month).toBe(1);
      expect(dates[4].month).toBe(6);
      expect(dates[5].month).toBe(12);

      dates.forEach((date) => {
        expect((date as ZonedDateTime).hour).toBe(12);
        expect((date as ZonedDateTime).timeZone).toBe('Europe/Paris');
      });
    });

    describe('DST (Daylight Saving Time) transitions', () => {
      it('should handle spring forward DST transition (America/New_York)', () => {
        // March 9, 2025 - DST starts (2:00 AM -> 3:00 AM)
        const dates = Array.from(
          generateDates({
            freq: Frequencies.DAILY,
            dtstart: new ZonedDateTime(
              2025,
              3,
              8,
              'America/New_York',
              -18000000, // EST: UTC-5
              1,
              30,
              0,
            ),
            count: 3,
          }),
        );

        expect(dates).toHaveLength(3);
        expect(dates[0].day).toBe(8);
        expect(dates[1].day).toBe(9); // DST transition day
        expect(dates[2].day).toBe(10);

        // All should maintain 1:30 local time
        dates.forEach((date) => {
          expect((date as ZonedDateTime).hour).toBe(1);
          expect((date as ZonedDateTime).minute).toBe(30);
        });
      });

      it('should handle fall back DST transition (America/New_York)', () => {
        // November 2, 2025 - DST ends (2:00 AM -> 1:00 AM)
        const dates = Array.from(
          generateDates({
            freq: Frequencies.DAILY,
            dtstart: new ZonedDateTime(
              2025,
              11,
              1,
              'America/New_York',
              -14400000, // EDT: UTC-4
              1,
              30,
              0,
            ),
            count: 3,
          }),
        );

        expect(dates).toHaveLength(3);
        expect(dates[0].day).toBe(1);
        expect(dates[1].day).toBe(2); // DST transition day
        expect(dates[2].day).toBe(3);

        // All should maintain 1:30 local time
        dates.forEach((date) => {
          expect((date as ZonedDateTime).hour).toBe(1);
          expect((date as ZonedDateTime).minute).toBe(30);
        });
      });

      it('should handle weekly recurrence across DST spring forward', () => {
        const dates = Array.from(
          generateDates({
            freq: Frequencies.WEEKLY,
            dtstart: new ZonedDateTime(
              2025,
              3,
              3,
              'America/New_York',
              -18000000, // EST
              10,
              0,
              0,
            ),
            count: 3,
          }),
        );

        expect(dates).toHaveLength(3);
        expect(dates[0]).toEqual(
          new ZonedDateTime(
            2025,
            3,
            3,
            'America/New_York',
            -18000000,
            10,
            0,
            0,
          ),
        );
        expect(dates[1].day).toBe(10); // After DST
        expect(dates[2].day).toBe(17);

        // Hour should stay consistent in local time
        dates.forEach((date) => {
          expect((date as ZonedDateTime).hour).toBe(10);
        });
      });

      it('should handle Europe/London DST transition', () => {
        // March 30, 2025 - BST starts (1:00 AM -> 2:00 AM)
        // 1:30 AM doesn't exist on March 30, library adjusts to 2:30 AM
        const dates = Array.from(
          generateDates({
            freq: Frequencies.DAILY,
            dtstart: new ZonedDateTime(
              2025,
              3,
              29,
              'Europe/London',
              0, // GMT: UTC+0
              1,
              30,
              0,
            ),
            count: 3,
          }),
        );

        expect(dates).toHaveLength(3);
        expect(dates[0].day).toBe(29);
        expect((dates[0] as ZonedDateTime).hour).toBe(1);
        expect((dates[0] as ZonedDateTime).minute).toBe(30);

        // March 30 - DST transition day
        // 1:30 AM doesn't exist, library correctly adjusts to 2:30 AM BST
        expect(dates[1].day).toBe(30);
        expect((dates[1] as ZonedDateTime).hour).toBe(2);
        expect((dates[1] as ZonedDateTime).minute).toBe(30);
        expect((dates[1] as ZonedDateTime).offset).toBe(3600000); // BST: UTC+1

        // March 31 - stays at 2:30 AM BST
        expect(dates[2].day).toBe(31);
        expect((dates[2] as ZonedDateTime).hour).toBe(2);
        expect((dates[2] as ZonedDateTime).minute).toBe(30);
      });

      it('should handle Australia/Sydney DST transition (Southern Hemisphere)', () => {
        // April 6, 2025 - DST ends (3:00 AM -> 2:00 AM)
        const dates = Array.from(
          generateDates({
            freq: Frequencies.DAILY,
            dtstart: new ZonedDateTime(
              2025,
              4,
              5,
              'Australia/Sydney',
              39600000, // AEDT: UTC+11
              2,
              30,
              0,
            ),
            count: 3,
          }),
        );

        expect(dates).toHaveLength(3);
        expect(dates[0].day).toBe(5);
        expect(dates[1].day).toBe(6); // DST ends
        expect(dates[2].day).toBe(7);

        dates.forEach((date) => {
          expect((date as ZonedDateTime).hour).toBe(2);
          expect((date as ZonedDateTime).minute).toBe(30);
        });
      });
    });
  });
});
