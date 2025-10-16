import type { DateValue } from '@internationalized/date';
import {
  CalendarDate,
  CalendarDateTime,
  toCalendarDateTime,
  ZonedDateTime,
} from '@internationalized/date';
import type { Weekday } from './types';
import { Weekdays } from './types';

/**
 * Weekdays aligned with Julian Day (0 = Monday, 6 = Sunday)
 */
const WEEKDAYS: Weekday[] = [
  Weekdays.MO,
  Weekdays.TU,
  Weekdays.WE,
  Weekdays.TH,
  Weekdays.FR,
  Weekdays.SA,
  Weekdays.SU,
] as const;

/**
 * Get the zero-based day of the week (0 = Monday, 1 = Tuesday, ..., 6 = Sunday)
 *
 * @param date - The date to get the weekday from
 * @returns The day of the week (0-6, where 0 = Monday)
 */
export function getDayOfWeek(date: DateValue) {
  const julianDay = date.calendar.toJulianDay(date);

  return Math.floor(julianDay) % 7;
}

/**
 * Get the Weekday value for a date.
 *
 * @param date - The date to get the weekday from
 * @returns The Weekday value (MO, TU, WE, TH, FR, SA, SU)
 */
export function getWeekday(date: DateValue) {
  const weekday = getDayOfWeek(date);

  return WEEKDAYS[weekday];
}

/**
 * Get the zero-based index of a weekday.
 *
 * @param weekday - The weekday to get the index of
 * @returns The zero-based index of the weekday
 */
export function getWeekdayIndex(weekday: Weekday) {
  return WEEKDAYS.indexOf(weekday);
}

/**
 * Checks if a value is a DateValue.
 *
 * @param value - The value to check
 * @returns True if the value is a DateValue (CalendarDate, CalendarDateTime, or ZonedDateTime)
 */
export function isDateValue(value: unknown): value is DateValue {
  return (
    value instanceof CalendarDate ||
    value instanceof CalendarDateTime ||
    value instanceof ZonedDateTime
  );
}

/**
 * Check if a year is a leap year.
 *
 * @param year - The year to check
 * @returns True if the year is a leap year
 */
export function isLeapYear(year: number | DateValue) {
  if (isDateValue(year)) {
    year = year.year;
  }

  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Calculate the difference in milliseconds between two dates.
 *
 * @param start - The start date
 * @param end - The end date
 * @returns The difference in milliseconds
 */
export function calculateDifference(start: DateValue, end: DateValue) {
  return end.toDate('UTC').getTime() - start.toDate('UTC').getTime();
}

/**
 * Calculate the difference in seconds between two dates.
 *
 * @param start - The start date
 * @param end - The end date
 * @returns The difference in seconds
 */
export function calculateDifferenceInSeconds(start: DateValue, end: DateValue) {
  return Math.floor(calculateDifference(start, end) / 1000);
}

/**
 * Calculate the difference in minutes between two dates.
 *
 * @param start - The start date
 * @param end - The end date
 * @returns The difference in minutes
 */
export function calculateDifferenceInMinutes(start: DateValue, end: DateValue) {
  return Math.floor(calculateDifference(start, end) / 60_000);
}

/**
 * Calculate the difference in hours between two dates.
 *
 * @param start - The start date
 * @param end - The end date
 * @returns The difference in hours
 */
export function calculateDifferenceInHours(start: DateValue, end: DateValue) {
  return Math.floor(calculateDifference(start, end) / 3_600_000);
}

/**
 * Calculates the difference in days between two dates.
 *
 * @param start - The start date
 * @param end - The end date
 * @returns The difference in days
 */
export function calculateDifferenceInDays(start: DateValue, end: DateValue) {
  return Math.floor(calculateDifference(start, end) / 86_400_000);
}

type DateTimeDuration = {
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
};

/**
 * Calculate the duration between two dates as a broken-down time structure.
 * Uses calendar-aware iteration for accurate year and month calculations,
 * matching the algorithm used in the Temporal polyfill.
 *
 * This properly handles:
 * - Variable month lengths (28-31 days)
 * - Leap years
 * - Calendar system differences
 * - End-of-month edge cases (e.g., Jan 31 + 1 month = Feb 28/29)
 *
 * @param start - The start date
 * @param end - The end date
 * @returns A duration object with years, months, weeks, days, hours, minutes, seconds, milliseconds
 *
 * @example
 * const start = new CalendarDate(2020, 1, 31);
 * const end = new CalendarDate(2020, 3, 1);
 * const duration = calculateDuration(start, end);
 * // { years: 0, months: 1, weeks: 0, days: 1, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }
 * // (Jan 31 + 1 month = Feb 29 in 2020, then 1 more day = Mar 1)
 */
export function calculateDuration(
  start: DateValue,
  end: DateValue,
): Required<DateTimeDuration> {
  const comparison = compareDates(end, start);
  const sign = comparison >= 0 ? 1 : -1;

  // If dates are equal, return zero duration
  if (comparison === 0) {
    return {
      years: 0,
      months: 0,
      weeks: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    };
  }

  // Ensure start < end for calculation
  const [earlier, later] = sign >= 0 ? [start, end] : [end, start];

  let years = 0;
  let months = 0;

  // Calculate years using calendar-aware iteration (like Temporal polyfill)
  // Start one less than the year difference to avoid overshooting
  let candidateYears = Math.max(0, later.year - earlier.year - 1);

  // Iterate forward to find the exact year difference
  let intermediate = earlier.add({ years: candidateYears });
  while (compareDates(intermediate, later) < 0) {
    const nextCandidate = earlier.add({ years: candidateYears + 1 });
    if (compareDates(nextCandidate, later) <= 0) {
      candidateYears += 1;
      intermediate = nextCandidate;
    } else {
      break;
    }
  }
  years = candidateYears;

  // Calculate months using calendar-aware iteration
  let candidateMonths = 0;
  intermediate = earlier.add({ years });

  while (compareDates(intermediate, later) < 0) {
    const nextCandidate = earlier.add({ years, months: candidateMonths + 1 });
    if (compareDates(nextCandidate, later) <= 0) {
      candidateMonths += 1;
      intermediate = nextCandidate;
    } else {
      break;
    }
  }
  months = candidateMonths;

  // Calculate remaining time after years and months
  intermediate = earlier.add({ years, months });
  let remaining = Math.abs(calculateDifference(intermediate, later));

  // Break down remaining milliseconds into weeks, days, hours, minutes, seconds
  const weeks = Math.floor(remaining / 604_800_000); // 7 * 24 * 60 * 60 * 1000
  remaining -= weeks * 604_800_000;

  const days = Math.floor(remaining / 86_400_000); // 24 * 60 * 60 * 1000
  remaining -= days * 86_400_000;

  const hours = Math.floor(remaining / 3_600_000); // 60 * 60 * 1000
  remaining -= hours * 3_600_000;

  const minutes = Math.floor(remaining / 60_000); // 60 * 1000
  remaining -= minutes * 60_000;

  const seconds = Math.floor(remaining / 1000);
  remaining -= seconds * 1000;

  const milliseconds = remaining;

  return {
    years: years * sign,
    months: months * sign,
    weeks: weeks * sign,
    days: days * sign,
    hours: hours * sign,
    minutes: minutes * sign,
    seconds: seconds * sign,
    milliseconds: milliseconds * sign,
  };
}

/**
 * Add a duration to a date
 * @param date - The date to add to
 * @param duration - The duration to add
 * @returns A new date with the duration added
 */
export function addDuration(date: DateValue, duration: DateTimeDuration) {
  return date.add(duration);
}

/**
 * Subtract a duration from a date
 * @param date - The date to subtract from
 * @param duration - The duration to subtract
 * @returns A new date with the duration subtracted
 */
export function subtractDuration(date: DateValue, duration: DateTimeDuration) {
  return date.subtract(duration);
}

/**
 * Get the start of the day for a date.
 *
 * @param date - The date to get the start of the day for
 * @returns The start of the day
 */
export function getStartOfDay(date: DateValue) {
  if (date instanceof CalendarDate) {
    date = toCalendarDateTime(date);
  }

  return date.subtract({
    hours: date.hour,
    minutes: date.minute,
    seconds: date.second,
    milliseconds: date.millisecond,
  });
}

/**
 * Get the end of the day for a date.
 *
 * @param date - The date to get the end of the day for
 * @returns The end of the day
 */
export function getEndOfDay(date: DateValue) {
  const startOfDay = getStartOfDay(date);

  return startOfDay.add({
    hours: 23,
    minutes: 59,
    seconds: 59,
    milliseconds: 999,
  });
}

/**
 * Get the start of the week for a date.
 *
 * @param date - The date to get the start of the week for
 * @param wkst - The weekday to start the week on
 * @returns The start of the week
 */
export function getStartOfWeek(date: DateValue, wkst: Weekday = Weekdays.MO) {
  const currentWeekday = getWeekday(date);
  const currentIndex = getWeekdayIndex(currentWeekday);
  const wkstIndex = getWeekdayIndex(wkst);
  const daysBack = (currentIndex - wkstIndex + 7) % 7;

  return date.subtract({ days: daysBack });
}

/**
 * Get the end of the week for a date.
 *
 * @param date - The date to get the end of the week for
 * @param wkst - The weekday to start the week on
 * @returns The end of the week
 */
export function getEndOfWeek(date: DateValue, wkst?: Weekday) {
  const startOfWeek = getStartOfWeek(date, wkst);

  return getEndOfDay(startOfWeek).add({ days: 6 });
}

/**
 * Get the start of the month for a date.
 *
 * @param date - The date to get the start of the month for
 * @returns The start of the month
 */
export function getStartOfMonth(date: DateValue) {
  return getStartOfDay(date).subtract({ days: date.day - 1 });
}

/**
 * Get the end of the month for a date.
 *
 * @param date - The date to get the end of the month for
 * @returns The end of the month
 */
export function getEndOfMonth(date: DateValue) {
  return getEndOfDay(date).add({
    days: getDaysInMonth(date) - date.day,
  });
}

/**
 * Get the start of the year for a date.
 *
 * @param date - The date to get the start of the year for
 * @returns The start of the year
 */
export function getStartOfYear(date: DateValue) {
  return getStartOfMonth(date).subtract({ months: date.month - 1 });
}

/**
 * Get the end of the year for a date.
 *
 * @param date - The date to get the end of the year for
 * @returns The end of the year
 */
export function getEndOfYear(date: DateValue) {
  return getEndOfMonth(date).add({
    months: getMonthsInYear(date) - date.month,
  });
}

/**
 * Gets the day of the year (1-366)
 * @param date - The date to get the day of year from
 * @returns The day of the year (1-366)
 */
export function getDayOfYear(date: DateValue) {
  const startOfYear = getStartOfYear(date);
  const diffInDays = calculateDifferenceInDays(startOfYear, date);

  return diffInDays + 1;
}

/**
 * Gets the ISO week number of the year (1-53).
 *
 * ISO weeks start on Monday and week 1 contains the first Thursday of the year
 *
 * @param date - The date to get the week number from
 * @returns The ISO week number (1-53)
 */
export function getISOWeekOfYear(date: DateValue) {
  const thursday = date.add({ days: 4 - getDayOfWeek(date) });
  const startOfYear = getStartOfYear(thursday);
  const diffInDays = calculateDifferenceInDays(startOfYear, thursday);

  return Math.floor(diffInDays / 7) + 1;
}

/**
 * Gets the week number of the year based on a specific week start day.
 *
 * @param date - The date to get the week number from
 * @param wkst - Week start day (default: Monday)
 * @returns The week number (1-53)
 */
export function getWeekOfYear(
  date: DateValue,
  wkst: Weekday = Weekdays.MO,
): number {
  const wkstIndex = getWeekdayIndex(wkst);

  // Find the first day of the year
  const startOfYear = getStartOfYear(date);
  const firstWeekdayIndex = getDayOfWeek(startOfYear);

  // Calculate which day is the first WKST of the year
  const daysToFirstWeekStart = (wkstIndex - firstWeekdayIndex + 7) % 7;
  const firstWeekStart = startOfYear.add({
    days: daysToFirstWeekStart === 0 ? 0 : daysToFirstWeekStart,
  });

  // If date is before first week start, it's in week 0 or last week of previous year
  if (date.compare(firstWeekStart) < 0) {
    // It's in the last week of the previous year
    const prevYear = date.subtract({ years: 1 });

    return getWeeksInYear(prevYear, wkst);
  }

  // Calculate week number
  const daysSinceFirstWeek = calculateDifferenceInDays(firstWeekStart, date);

  return Math.floor(daysSinceFirstWeek / 7) + 1;
}

/**
 * Gets the number of weeks in a year
 * @param date - A date in the year
 * @param wkst - Week start day (MO, TU, etc.)
 * @returns The number of weeks in the year (52 or 53)
 */
export function getWeeksInYear(
  date: DateValue,
  wkst: Weekday = Weekdays.MO,
): number {
  const startOfYear = getStartOfYear(date);
  // const endOfYear = getEndOfYear(date);
  const firstWeekday = getDayOfWeek(startOfYear);
  // const lastWeekday = getDayOfWeek(endOfYear);
  const wkstIndex = getWeekdayIndex(wkst);

  if (firstWeekday === wkstIndex) {
    return 53;
  }

  if (isLeapYear(startOfYear) && firstWeekday === (wkstIndex - 1 + 7) % 7) {
    return 53;
  }

  return 52;
}

/**
 * Get the number of days in the month of the given date.
 *
 * @param date - The date to get days in month for
 * @returns The number of days in the month (28-31)
 */
export function getDaysInMonth(date: DateValue) {
  return date.calendar.getDaysInMonth(date);
}

/**
 * Get the number of months in the year of the given date.
 *
 * @param date - The date to get months in year for
 * @returns The number of months in the year
 */
export function getMonthsInYear(date: DateValue) {
  return date.calendar.getMonthsInYear(date);
}

type DateComparison = -1 | 0 | 1;

/**
 * Compare two dates
 * @param a - First date
 * @param b - Second date
 * @returns Negative if a < b, 0 if equal, positive if a > b
 */
export function compareDates(a: DateValue, b: DateValue): DateComparison {
  const comparison = a.compare(b);

  if (comparison === 0) {
    return 0;
  }

  return comparison > 0 ? 1 : -1;
}

/**
 * Fields to set on a date
 */
type DateTimeFields = {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  millisecond?: number;
};

/**
 * Set specific fields on a date, returning a new date.
 *
 * @param date - The date to set fields on
 * @param fields - The fields to set
 * @returns A new date with the fields set
 */
export function setFields(date: DateValue, fields: DateTimeFields) {
  return date.set(fields);
}
