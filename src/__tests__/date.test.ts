import { CalendarDate, CalendarDateTime } from '@internationalized/date';
import { describe, expect, it } from 'vitest';
import {
  addDuration,
  calculateDifference,
  calculateDifferenceInDays,
  calculateDifferenceInHours,
  calculateDifferenceInMinutes,
  calculateDifferenceInSeconds,
  calculateDuration,
  compareDates,
  getDayOfWeek,
  getDayOfYear,
  getDaysInMonth,
  getEndOfDay,
  getEndOfMonth,
  getEndOfWeek,
  getEndOfYear,
  getISOWeekOfYear,
  getMonthsInYear,
  getStartOfDay,
  getStartOfMonth,
  getStartOfWeek,
  getStartOfYear,
  getWeekday,
  getWeekdayIndex,
  getWeekOfYear,
  getWeeksInYear,
  isDateValue,
  isLeapYear,
  setFields,
  subtractDuration,
} from '../date';
import { Weekdays } from '../types';

describe('getDayOfWeek', () => {
  it('should return 0 for Monday', () => {
    expect(getDayOfWeek(new CalendarDate(2025, 10, 13))).toBe(0); // Monday
  });

  it('should return 6 for Sunday', () => {
    expect(getDayOfWeek(new CalendarDate(2025, 10, 19))).toBe(6); // Sunday
  });

  it('should return correct values for all days', () => {
    expect(getDayOfWeek(new CalendarDate(2025, 10, 13))).toBe(0); // Monday
    expect(getDayOfWeek(new CalendarDate(2025, 10, 14))).toBe(1); // Tuesday
    expect(getDayOfWeek(new CalendarDate(2025, 10, 15))).toBe(2); // Wednesday
    expect(getDayOfWeek(new CalendarDate(2025, 10, 16))).toBe(3); // Thursday
    expect(getDayOfWeek(new CalendarDate(2025, 10, 17))).toBe(4); // Friday
    expect(getDayOfWeek(new CalendarDate(2025, 10, 18))).toBe(5); // Saturday
    expect(getDayOfWeek(new CalendarDate(2025, 10, 19))).toBe(6); // Sunday
  });
});

describe('getDayOfYear', () => {
  it('should return 1 for January 1st', () => {
    expect(getDayOfYear(new CalendarDate(2025, 1, 1))).toBe(1);
  });

  it('should return 365 for December 31st in non-leap year', () => {
    expect(getDayOfYear(new CalendarDate(2025, 12, 31))).toBe(365);
  });

  it('should return 366 for December 31st in leap year', () => {
    expect(getDayOfYear(new CalendarDate(2024, 12, 31))).toBe(366);
  });

  it('should return 32 for February 1st', () => {
    expect(getDayOfYear(new CalendarDate(2025, 2, 1))).toBe(32);
  });
});

describe('getISOWeekOfYear', () => {
  it('should return week number for a date', () => {
    expect(getISOWeekOfYear(new CalendarDate(2025, 1, 6))).toBe(2);
  });
});

describe('calculateDuration', () => {
  it('should calculate duration for simple date range', () => {
    const start = new CalendarDate(2020, 1, 1);
    const end = new CalendarDate(2023, 3, 15);
    const duration = calculateDuration(start, end);

    expect(duration.years).toBe(3);
    expect(duration.months).toBe(2);
    // 14 days = 2 weeks + 0 days
    expect(duration.weeks).toBe(2);
    expect(duration.days).toBe(0);
  });

  it('should handle end-of-month edge case in leap year', () => {
    // Jan 31 + 1 month = Feb 29 (constrained), then + 1 day = Mar 1
    const start = new CalendarDate(2020, 1, 31);
    const end = new CalendarDate(2020, 3, 1);
    const duration = calculateDuration(start, end);

    expect(duration.years).toBe(0);
    expect(duration.months).toBe(1);
    expect(duration.days).toBe(1);
  });

  it('should return zero duration for same date', () => {
    const start = new CalendarDate(2020, 5, 15);
    const end = new CalendarDate(2020, 5, 15);
    const duration = calculateDuration(start, end);

    expect(duration.years).toBe(0);
    expect(duration.months).toBe(0);
    expect(duration.weeks).toBe(0);
    expect(duration.days).toBe(0);
    expect(duration.hours).toBe(0);
    expect(duration.minutes).toBe(0);
    expect(duration.seconds).toBe(0);
    expect(duration.milliseconds).toBe(0);
  });

  it('should handle negative duration (backwards)', () => {
    const start = new CalendarDate(2023, 6, 1);
    const end = new CalendarDate(2022, 1, 1);
    const duration = calculateDuration(start, end);

    expect(duration.years).toBe(-1);
    expect(duration.months).toBe(-5);
    expect(duration.days === 0).toBe(true);
  });

  it('should handle leap year to non-leap year', () => {
    const start = new CalendarDate(2020, 2, 29);
    const end = new CalendarDate(2021, 2, 28);
    const duration = calculateDuration(start, end);

    // Feb 29, 2020 + 1 year = Feb 28, 2021 (constrained due to no leap day)
    // This is exactly 1 year by calendar reckoning
    expect(duration.years).toBe(1);
    expect(duration.months).toBe(0);
    // Feb 29 -> Feb 28 is constrained to end of month, so 0 days remaining
    expect(duration.days).toBe(0);
  });

  it('should calculate weeks correctly', () => {
    const start = new CalendarDate(2020, 1, 1);
    const end = new CalendarDate(2020, 1, 22);
    const duration = calculateDuration(start, end);

    expect(duration.years).toBe(0);
    expect(duration.months).toBe(0);
    expect(duration.weeks).toBe(3);
    expect(duration.days).toBe(0);
  });

  it('should handle year boundaries', () => {
    const start = new CalendarDate(2019, 12, 31);
    const end = new CalendarDate(2020, 1, 1);
    const duration = calculateDuration(start, end);

    expect(duration.years).toBe(0);
    expect(duration.months).toBe(0);
    expect(duration.days).toBe(1);
  });
});

describe('date helper functions', () => {
  const date = new CalendarDate(2024, 3, 15); // March 15, 2024 (leap year, Friday)
  const datetime = new CalendarDateTime(2024, 3, 15, 14, 30, 45, 123);

  describe('isLeapYear', () => {
    it('should return true for leap years', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2000)).toBe(true);
    });

    it('should return false for non-leap years', () => {
      expect(isLeapYear(2023)).toBe(false);
      expect(isLeapYear(1900)).toBe(false);
      expect(isLeapYear(2100)).toBe(false);
    });

    it('should work with DateValue objects', () => {
      expect(isLeapYear(new CalendarDate(2024, 1, 1))).toBe(true);
      expect(isLeapYear(new CalendarDate(2023, 1, 1))).toBe(false);
    });
  });

  describe('getWeekday', () => {
    it('should return correct weekday string', () => {
      expect(getWeekday(new CalendarDate(2025, 10, 13))).toBe('MO'); // Monday
      expect(getWeekday(new CalendarDate(2025, 10, 14))).toBe('TU');
      expect(getWeekday(new CalendarDate(2025, 10, 19))).toBe('SU'); // Sunday
    });
  });

  describe('getMonthsInYear', () => {
    it('should return 12 for Gregorian calendar', () => {
      expect(getMonthsInYear(date)).toBe(12);
    });
  });

  describe('getStartOfDay', () => {
    it('should return start of day (midnight)', () => {
      const start = getStartOfDay(datetime);
      expect(start.hour).toBe(0);
      expect(start.minute).toBe(0);
      expect(start.second).toBe(0);
      expect(start.millisecond).toBe(0);
      expect(start.year).toBe(2024);
      expect(start.month).toBe(3);
      expect(start.day).toBe(15);
    });
  });

  describe('getEndOfDay', () => {
    it('should return end of day (23:59:59.999)', () => {
      const end = getEndOfDay(datetime);
      expect(end.hour).toBe(23);
      expect(end.minute).toBe(59);
      expect(end.second).toBe(59);
      expect(end.millisecond).toBe(999);
      expect(end.year).toBe(2024);
      expect(end.month).toBe(3);
      expect(end.day).toBe(15);
    });
  });

  describe('getStartOfWeek', () => {
    it('should return start of week (Monday by default)', () => {
      const start = getStartOfWeek(date); // March 15, 2024 is Friday
      expect(start.year).toBe(2024);
      expect(start.month).toBe(3);
      expect(start.day).toBe(11); // Monday March 11
    });

    it('respects custom week start', () => {
      const start = getStartOfWeek(date, 'SU'); // Start on Sunday
      expect(start.year).toBe(2024);
      expect(start.month).toBe(3);
      expect(start.day).toBe(10); // Sunday March 10
    });
  });

  describe('getEndOfWeek', () => {
    it('should return end of week (Sunday)', () => {
      const end = getEndOfWeek(date); // March 15, 2024 is Friday
      expect(end.year).toBe(2024);
      expect(end.month).toBe(3);
      expect(end.day).toBe(17); // Sunday March 17
      expect(end.hour).toBe(23);
      expect(end.minute).toBe(59);
    });
  });

  describe('getStartOfMonth', () => {
    it('should return first day of month', () => {
      const start = getStartOfMonth(date);
      expect(start.year).toBe(2024);
      expect(start.month).toBe(3);
      expect(start.day).toBe(1);
    });
  });

  describe('getEndOfMonth', () => {
    it('should return last day of month', () => {
      const end = getEndOfMonth(date);
      expect(end.year).toBe(2024);
      expect(end.month).toBe(3);
      expect(end.day).toBe(31); // March has 31 days
    });

    it('should handle February in leap year', () => {
      const feb = new CalendarDate(2024, 2, 15);
      const end = getEndOfMonth(feb);
      expect(end.day).toBe(29); // Leap year
    });

    it('should handle February in non-leap year', () => {
      const feb = new CalendarDate(2023, 2, 15);
      const end = getEndOfMonth(feb);
      expect(end.day).toBe(28); // Non-leap year
    });
  });

  describe('getStartOfYear', () => {
    it('should return January 1st', () => {
      const start = getStartOfYear(date);
      expect(start.year).toBe(2024);
      expect(start.month).toBe(1);
      expect(start.day).toBe(1);
    });
  });

  describe('getEndOfYear', () => {
    it('should return December 31st', () => {
      const end = getEndOfYear(date);
      expect(end.year).toBe(2024);
      expect(end.month).toBe(12);
      expect(end.day).toBe(31);
    });
  });
});

describe('getWeekdayIndex', () => {
  it('should return correct index for each weekday', () => {
    expect(getWeekdayIndex(Weekdays.MO)).toBe(0);
    expect(getWeekdayIndex(Weekdays.TU)).toBe(1);
    expect(getWeekdayIndex(Weekdays.WE)).toBe(2);
    expect(getWeekdayIndex(Weekdays.TH)).toBe(3);
    expect(getWeekdayIndex(Weekdays.FR)).toBe(4);
    expect(getWeekdayIndex(Weekdays.SA)).toBe(5);
    expect(getWeekdayIndex(Weekdays.SU)).toBe(6);
  });
});

describe('isDateValue', () => {
  it('should return true for CalendarDate', () => {
    expect(isDateValue(new CalendarDate(2025, 1, 1))).toBe(true);
  });

  it('should return true for CalendarDateTime', () => {
    expect(isDateValue(new CalendarDateTime(2025, 1, 1, 12, 0, 0))).toBe(true);
  });

  it('should return false for non-DateValue types', () => {
    expect(isDateValue(null)).toBe(false);
    expect(isDateValue(undefined)).toBe(false);
    expect(isDateValue({})).toBe(false);
    expect(isDateValue('2025-01-01')).toBe(false);
    expect(isDateValue(new Date())).toBe(false);
  });
});

describe('calculateDifference', () => {
  it('should return difference in milliseconds', () => {
    const start = new CalendarDateTime(2025, 1, 1, 0, 0, 0);
    const end = new CalendarDateTime(2025, 1, 1, 1, 0, 0);

    expect(calculateDifference(start, end)).toBe(3_600_000); // 1 hour in ms
  });

  it('should return negative for end before start', () => {
    const start = new CalendarDateTime(2025, 1, 2, 0, 0, 0);
    const end = new CalendarDateTime(2025, 1, 1, 0, 0, 0);

    expect(calculateDifference(start, end)).toBe(-86_400_000); // -1 day in ms
  });
});

describe('calculateDifferenceInSeconds', () => {
  it('should return difference in seconds', () => {
    const start = new CalendarDateTime(2025, 1, 1, 0, 0, 0);
    const end = new CalendarDateTime(2025, 1, 1, 0, 1, 30);

    expect(calculateDifferenceInSeconds(start, end)).toBe(90); // 1.5 minutes
  });
});

describe('calculateDifferenceInMinutes', () => {
  it('should return difference in minutes', () => {
    const start = new CalendarDateTime(2025, 1, 1, 0, 0, 0);
    const end = new CalendarDateTime(2025, 1, 1, 2, 30, 0);

    expect(calculateDifferenceInMinutes(start, end)).toBe(150); // 2.5 hours
  });
});

describe('calculateDifferenceInHours', () => {
  it('should return difference in hours', () => {
    const start = new CalendarDateTime(2025, 1, 1, 0, 0, 0);
    const end = new CalendarDateTime(2025, 1, 2, 12, 0, 0);

    expect(calculateDifferenceInHours(start, end)).toBe(36); // 1.5 days
  });
});

describe('calculateDifferenceInDays', () => {
  it('should return difference in days', () => {
    const start = new CalendarDate(2025, 1, 1);
    const end = new CalendarDate(2025, 1, 10);

    expect(calculateDifferenceInDays(start, end)).toBe(9);
  });

  it('should handle month boundaries', () => {
    const start = new CalendarDate(2025, 1, 25);
    const end = new CalendarDate(2025, 2, 5);

    expect(calculateDifferenceInDays(start, end)).toBe(11);
  });
});

describe('addDuration', () => {
  it('should add days to a date', () => {
    const date = new CalendarDate(2025, 1, 1);
    const result = addDuration(date, { days: 10 });

    expect(result.year).toBe(2025);
    expect(result.month).toBe(1);
    expect(result.day).toBe(11);
  });

  it('should add months to a date', () => {
    const date = new CalendarDate(2025, 1, 15);
    const result = addDuration(date, { months: 2 });

    expect(result.year).toBe(2025);
    expect(result.month).toBe(3);
    expect(result.day).toBe(15);
  });

  it('should add years to a date', () => {
    const date = new CalendarDate(2025, 1, 1);
    const result = addDuration(date, { years: 5 });

    expect(result.year).toBe(2030);
  });

  it('should handle complex durations', () => {
    const date = new CalendarDateTime(2025, 1, 1, 10, 30, 0);
    const result = addDuration(date, {
      days: 1,
      hours: 2,
      minutes: 30,
    }) as CalendarDateTime;

    expect(result.day).toBe(2);
    expect(result.hour).toBe(13);
    expect(result.minute).toBe(0);
  });
});

describe('subtractDuration', () => {
  it('should subtract days from a date', () => {
    const date = new CalendarDate(2025, 1, 15);
    const result = subtractDuration(date, { days: 10 });

    expect(result.year).toBe(2025);
    expect(result.month).toBe(1);
    expect(result.day).toBe(5);
  });

  it('should subtract months from a date', () => {
    const date = new CalendarDate(2025, 3, 15);
    const result = subtractDuration(date, { months: 2 });

    expect(result.year).toBe(2025);
    expect(result.month).toBe(1);
    expect(result.day).toBe(15);
  });
});

describe('getWeekOfYear', () => {
  it('should return week number for a date', () => {
    // January 6, 2025 is a Monday (week 2 with Monday start)
    const date = new CalendarDate(2025, 1, 6);
    const week = getWeekOfYear(date, Weekdays.MO);

    expect(week).toBeGreaterThan(0);
    expect(week).toBeLessThanOrEqual(53);
  });

  it('should handle different week start days', () => {
    const date = new CalendarDate(2025, 1, 15);
    const weekMO = getWeekOfYear(date, Weekdays.MO);
    const weekSU = getWeekOfYear(date, Weekdays.SU);

    // Week numbers may differ based on week start
    expect(weekMO).toBeGreaterThan(0);
    expect(weekSU).toBeGreaterThan(0);
  });

  it('should handle year boundary dates', () => {
    const lastDayOfYear = new CalendarDate(2024, 12, 31);
    const week = getWeekOfYear(lastDayOfYear, Weekdays.MO);

    expect(week).toBeGreaterThan(0);
  });
});

describe('getWeeksInYear', () => {
  it('should return 52 or 53 weeks', () => {
    const date2025 = new CalendarDate(2025, 1, 1);
    const weeks = getWeeksInYear(date2025, Weekdays.MO);

    expect(weeks === 52 || weeks === 53).toBe(true);
  });

  it('should return 53 when year starts on week start day', () => {
    // Find a year that starts on Monday
    const date2024 = new CalendarDate(2024, 1, 1); // 2024 starts on Monday
    const weeks = getWeeksInYear(date2024, Weekdays.MO);

    expect(weeks).toBe(53);
  });
});

describe('getDaysInMonth', () => {
  it('should return 31 for January', () => {
    const date = new CalendarDate(2025, 1, 1);
    expect(getDaysInMonth(date)).toBe(31);
  });

  it('should return 28 for February in non-leap year', () => {
    const date = new CalendarDate(2025, 2, 1);
    expect(getDaysInMonth(date)).toBe(28);
  });

  it('should return 29 for February in leap year', () => {
    const date = new CalendarDate(2024, 2, 1);
    expect(getDaysInMonth(date)).toBe(29);
  });

  it('should return 30 for April', () => {
    const date = new CalendarDate(2025, 4, 1);
    expect(getDaysInMonth(date)).toBe(30);
  });
});

describe('compareDates', () => {
  it('should return 0 for equal dates', () => {
    const date1 = new CalendarDate(2025, 1, 1);
    const date2 = new CalendarDate(2025, 1, 1);

    expect(compareDates(date1, date2)).toBe(0);
  });

  it('should return -1 when first date is before second', () => {
    const date1 = new CalendarDate(2025, 1, 1);
    const date2 = new CalendarDate(2025, 1, 2);

    expect(compareDates(date1, date2)).toBe(-1);
  });

  it('should return 1 when first date is after second', () => {
    const date1 = new CalendarDate(2025, 1, 2);
    const date2 = new CalendarDate(2025, 1, 1);

    expect(compareDates(date1, date2)).toBe(1);
  });
});

describe('setFields', () => {
  it('sets individual fields on a date', () => {
    const date = new CalendarDate(2025, 1, 1);
    const result = setFields(date, { day: 15 });

    expect(result.year).toBe(2025);
    expect(result.month).toBe(1);
    expect(result.day).toBe(15);
  });

  it('sets multiple fields on a date', () => {
    const date = new CalendarDate(2025, 1, 1);
    const result = setFields(date, { year: 2026, month: 3, day: 20 });

    expect(result.year).toBe(2026);
    expect(result.month).toBe(3);
    expect(result.day).toBe(20);
  });

  it('sets time fields on datetime', () => {
    const date = new CalendarDateTime(2025, 1, 1, 10, 30, 0);
    const result = setFields(date, {
      hour: 15,
      minute: 45,
    }) as CalendarDateTime;

    expect(result.hour).toBe(15);
    expect(result.minute).toBe(45);
    expect(result.second).toBe(0);
  });
});
