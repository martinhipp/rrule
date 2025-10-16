import type { DateValue } from '@internationalized/date';
import { CalendarDate, toCalendarDate } from '@internationalized/date';
import {
  addDuration,
  calculateDifferenceInDays,
  compareDates,
  getDaysInMonth,
  getEndOfYear,
  getStartOfWeek,
  getStartOfYear,
  getWeekday,
  getWeekdayIndex,
  getWeeksInYear,
  setFields,
  subtractDuration,
} from './date';
import type {
  Frequency,
  ParsedRRuleOptions,
  RRuleOptions,
  Weekday,
  WeekdayValue,
} from './types';
import { Frequencies, Weekdays } from './types';
import { addToMap, isFrequency, isWeekday } from './utils';

/**
 * Generates dates according to the recurrence rule using an expansion-based approach.
 *
 * @param options - The RRule options to generate dates from
 * @param maxIterations - The maximum number of iterations to prevent infinite loops (default: 10000)
 * @param after - The optional date to start generating from (for efficient seeking)
 * @yields Date values that match the recurrence rule
 */
export function* generateDates(
  options: ParsedRRuleOptions,
  maxIterations = 10_000,
  after?: DateValue,
) {
  const { freq, dtstart, interval = 1, count, until } = options;

  if (!dtstart) {
    throw new Error('DTSTART is required for generating occurrences');
  }

  // Early exit if interval is 0 (would cause infinite loop)
  if (interval === 0) {
    return;
  }

  // Early exit if UNTIL is before DTSTART
  if (until !== undefined && compareDates(until, dtstart) < 0) {
    return;
  }

  let emitted = 0;
  let iterations = 0;
  let consecutiveEmptyPeriods = 0;

  // Determine which expansion function to use based on frequency
  const expandPeriod = getFrequencyExpander(freq);

  // Start with a cursor at the beginning of the period containing dtstart
  let cursor = getPeriodStart(dtstart, freq);

  // If seeking after a specific date, advance the cursor to approximately that period
  // This avoids iterating through many periods when seeking far in the future
  if (after && compareDates(after, dtstart) > 0) {
    cursor = advanceCursorToDate(cursor, after, freq, interval);
  }

  while (true) {
    // Safety check to prevent infinite loops
    if (iterations++ > maxIterations) {
      throw new Error(
        `Max iterations (${maxIterations}) exceeded. Possible infinite loop in recurrence rule.`,
      );
    }

    // Expand all candidate dates in this period
    const candidates = expandPeriod(cursor, options);

    // Apply time expansion if needed
    const expanded = candidates.flatMap((date) => expandByTime(date, options));

    // Apply BYSETPOS to filter positions
    const filtered = applyBySetPos(expanded, options);

    let yieldedThisPeriod = false;

    // Yield all dates that are >= dtstart and match until/count limits
    for (const date of filtered) {
      // Skip dates before dtstart
      if (compareDates(date, dtstart) < 0) {
        continue;
      }

      // Check until limit
      if (until !== undefined && compareDates(date, until) > 0) {
        return;
      }

      yield date;
      emitted++;
      yieldedThisPeriod = true;

      // Check count limit
      if (count !== undefined && emitted >= count) {
        return;
      }
    }

    // Track consecutive empty periods to detect impossible rules
    if (yieldedThisPeriod) {
      consecutiveEmptyPeriods = 0;
    } else {
      consecutiveEmptyPeriods++;

      // If we've had 1000 consecutive empty periods and haven't emitted anything,
      // the rule is impossible (e.g., Feb 31, week 53 in years without it, day 31 in 30-day months)
      if (consecutiveEmptyPeriods >= 1000 && emitted === 0) {
        return;
      }
    }

    // Advance to next period
    cursor = advancePeriod(cursor, freq, interval);
  }
}

/**
 * Get the expansion function for a given frequency.
 */
function getFrequencyExpander(
  freq: Frequency,
): (cursor: DateValue, options: ParsedRRuleOptions) => DateValue[] {
  switch (freq) {
    case Frequencies.YEARLY:
      return expandYearly;
    case Frequencies.MONTHLY:
      return expandMonthly;
    case Frequencies.WEEKLY:
      return expandWeekly;
    case Frequencies.DAILY:
      return expandDaily;
    case Frequencies.HOURLY:
      return expandHourly;
    case Frequencies.MINUTELY:
      return expandMinutely;
    case Frequencies.SECONDLY:
      return expandSecondly;
    default:
      throw new Error(`Unknown RRule frequency: ${freq}`);
  }
}

/**
 * Get the start of the period containing the given date.
 */
function getPeriodStart(date: DateValue, freq: Frequency) {
  if (!isFrequency(freq)) {
    throw new Error(`Unknown RRule frequency: ${freq}`);
  }

  return date;
}

/**
 * Advance the cursor to the next period.
 */
function advancePeriod(cursor: DateValue, freq: string, interval: number) {
  switch (freq) {
    case Frequencies.YEARLY:
      return addDuration(cursor, { years: interval });
    case Frequencies.MONTHLY:
      return addDuration(cursor, { months: interval });
    case Frequencies.WEEKLY:
      return addDuration(cursor, { weeks: interval });
    case Frequencies.DAILY:
      return addDuration(cursor, { days: interval });
    case Frequencies.HOURLY:
      return addDuration(cursor, { hours: interval });
    case Frequencies.MINUTELY:
      return addDuration(cursor, { minutes: interval });
    case Frequencies.SECONDLY:
      return addDuration(cursor, { seconds: interval });
    default:
      throw new Error(`Unknown RRule frequency: ${freq}`);
  }
}

/**
 * Advance the cursor to approximately the target date for efficient seeking.
 * This calculates roughly how many periods to skip.
 */
function advanceCursorToDate(
  cursor: DateValue,
  target: DateValue,
  freq: Frequency,
  interval: number,
) {
  switch (freq) {
    case Frequencies.YEARLY: {
      const yearDiff = target.year - cursor.year;
      const periodsToSkip = Math.floor(yearDiff / interval);
      return periodsToSkip > 0
        ? addDuration(cursor, { years: periodsToSkip * interval })
        : cursor;
    }
    case Frequencies.MONTHLY: {
      const monthDiff =
        (target.year - cursor.year) * 12 + (target.month - cursor.month);
      const periodsToSkip = Math.floor(monthDiff / interval);
      return periodsToSkip > 0
        ? addDuration(cursor, { months: periodsToSkip * interval })
        : cursor;
    }
    case Frequencies.WEEKLY: {
      // Approximate weeks difference (not exact due to month boundaries)
      const dayDiff = calculateDifferenceInDays(cursor, target);
      const weekDiff = Math.floor(dayDiff / 7);
      const periodsToSkip = Math.floor(weekDiff / interval);
      return periodsToSkip > 0
        ? addDuration(cursor, { weeks: periodsToSkip * interval })
        : cursor;
    }
    case Frequencies.DAILY: {
      const dayDiff = calculateDifferenceInDays(cursor, target);
      const periodsToSkip = Math.floor(dayDiff / interval);
      return periodsToSkip > 0
        ? addDuration(cursor, { days: periodsToSkip * interval })
        : cursor;
    }
    // For sub-daily frequencies, don't bother optimizing
    case Frequencies.HOURLY:
    case Frequencies.MINUTELY:
    case Frequencies.SECONDLY:
      return cursor;
    default:
      return cursor;
  }
}

/**
 * Expand daily occurrences.
 * For DAILY frequency, return the cursor date if it matches BY* filters.
 */
function expandDaily(cursor: DateValue, options: RRuleOptions) {
  const { bymonth = [], bymonthday = [], byweekday = [] } = options;

  // Filter by BYMONTH
  if (bymonth.length && !bymonth.includes(cursor.month)) {
    return [];
  }

  // Filter by BYMONTHDAY
  if (bymonthday.length) {
    const daysInMonth = getDaysInMonth(cursor);
    const normalized = bymonthday.map((d) => (d > 0 ? d : daysInMonth + d + 1));

    if (!normalized.includes(cursor.day)) {
      return [];
    }
  }

  // Filter by BYWEEKDAY (only simple weekdays, no ordinals for DAILY)
  if (byweekday.length) {
    const weekday = getWeekday(cursor);
    const simpleWeekdays = byweekday.filter((day) => isWeekday(day));

    if (simpleWeekdays.length > 0 && !simpleWeekdays.includes(weekday)) {
      return [];
    }
  }

  return [cursor];
}

/**
 * Expand weekly occurrences.
 * Generate all target weekdays in the week.
 */
function expandWeekly(cursor: DateValue, options: ParsedRRuleOptions) {
  const { byweekday = [], bymonth = [], bymonthday = [], wkst } = options;

  // Get the start of the week containing cursor
  const startOfWeek = getStartOfWeek(cursor, wkst);

  // Determine which weekdays to generate
  let targetWeekdays: Weekday[];

  if (byweekday.length) {
    // Extract simple weekdays (ignore ordinals in WEEKLY context)
    targetWeekdays = byweekday
      .map((day) => (isWeekday(day) ? day : day.weekday))
      .filter((day, index, days) => days.indexOf(day) === index);
  } else {
    // Default to the weekday of dtstart
    targetWeekdays = [getWeekday(cursor)];
  }

  const results: DateValue[] = [];

  // Generate dates for each target weekday in this week
  for (let i = 0; i < 7; i++) {
    const date = addDuration(startOfWeek, { days: i });
    const weekday = getWeekday(date);

    if (targetWeekdays.includes(weekday)) {
      // Apply additional filters
      if (bymonth.length && !bymonth.includes(date.month)) {
        continue;
      }

      if (bymonthday.length) {
        const daysInMonth = getDaysInMonth(date);
        const normalized = bymonthday.map((d) =>
          d > 0 ? d : daysInMonth + d + 1,
        );

        if (!normalized.includes(date.day)) {
          continue;
        }
      }

      results.push(date);
    }
  }

  return results.sort((a, b) => compareDates(a, b));
}

/**
 * Expand monthly occurrences.
 * Generate all dates in the month matching BYDAY and/or BYMONTHDAY.
 */
function expandMonthly(cursor: DateValue, options: ParsedRRuleOptions) {
  const { bymonth = [], bymonthday = [], byweekday = [] } = options;

  // Filter by BYMONTH if specified
  if (bymonth.length && !bymonth.includes(cursor.month)) {
    return [];
  }

  // If no BYDAY or BYMONTHDAY, return the same day of month as dtstart
  if (!byweekday.length && !bymonthday.length) {
    return [cursor];
  }

  const results: DateValue[] = [];
  const daysInMonth = getDaysInMonth(cursor);

  // Collect days from BYMONTHDAY
  const byMonthDayHits = new Set<number>();

  if (bymonthday.length) {
    for (const d of bymonthday) {
      const normalized = d > 0 ? d : daysInMonth + d + 1;

      if (normalized >= 1 && normalized <= daysInMonth) {
        byMonthDayHits.add(normalized);
      }
    }
  }

  // If we have BYMONTHDAY but no BYDAY, just return those days
  if (byMonthDayHits.size > 0 && !byweekday.length) {
    for (const day of byMonthDayHits) {
      results.push(setFields(cursor, { day }));
    }

    return results.sort((a, b) => compareDates(a, b));
  }

  // Collect days from BYDAY
  if (byweekday.length) {
    const byDayHits = expandByWeekdayInMonth(cursor, byweekday);

    // If we also have BYMONTHDAY, intersect the sets
    if (byMonthDayHits.size > 0) {
      for (const date of byDayHits) {
        if (byMonthDayHits.has(date.day)) {
          results.push(date);
        }
      }
    } else {
      results.push(...byDayHits);
    }
  }

  return results.sort((a, b) => compareDates(a, b));
}

/**
 * Expand BYDAY within a month, handling ordinal positions.
 */
function expandByWeekdayInMonth(cursor: DateValue, byweekday: WeekdayValue[]) {
  const daysInMonth = getDaysInMonth(cursor);
  const results: DateValue[] = [];

  // Bucket all days in the month by weekday
  const buckets: Map<Weekday, DateValue[]> = new Map();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = setFields(cursor, { day });
    const weekday = getWeekday(date);
    const dates = addToMap(buckets, weekday, () => []);

    dates.push(date);
  }

  // Process each BYDAY token
  for (const day of byweekday) {
    if (isWeekday(day)) {
      // Simple weekday - all occurrences (e.g., "MO" = all Mondays)
      const dates = buckets.get(day);

      if (dates) {
        results.push(...dates);
      }
    } else {
      // Weekday with ordinal (e.g., {weekday: "MO", n: 1} = first Monday)
      const dates = buckets.get(day.weekday);

      if (dates && dates.length > 0) {
        const idx = day.n > 0 ? day.n - 1 : dates.length + day.n;

        if (idx >= 0 && idx < dates.length) {
          results.push(dates[idx]);
        }
      }
    }
  }

  return results;
}

/**
 * Expand yearly occurrences.
 * Generate all dates in the year matching BY* rules.
 */
function expandYearly(cursor: DateValue, options: ParsedRRuleOptions) {
  const {
    bymonth = [],
    bymonthday = [],
    byweekday = [],
    byyearday = [],
    byweekno = [],
    wkst,
  } = options;

  let results: DateValue[] = [];

  // Handle ordinal BYDAY for whole year (e.g., 5th Monday of the year)
  const hasOrdinalByDay = byweekday.some((day) => !isWeekday(day));
  if (hasOrdinalByDay && !bymonth.length) {
    results = expandOrdinalByDayInYear(cursor, byweekday);

    return results.sort((a, b) => compareDates(a, b));
  }

  // If BYYEARDAY is specified, use that directly
  if (byyearday.length) {
    const yearDayResults = expandByYearDay(cursor, byyearday);
    // Apply BYMONTH filter if present
    if (bymonth.length) {
      results = yearDayResults.filter((date) => bymonth.includes(date.month));
    } else {
      results = yearDayResults;
    }
  }

  // If BYWEEKNO is specified, expand by week number
  if (byweekno.length) {
    const weekNoResults = expandByWeekNo(cursor, byweekno, byweekday, wkst);

    results.push(...weekNoResults);
  }

  // If neither BYYEARDAY nor BYWEEKNO, expand per-month
  if (!byyearday.length && !byweekno.length) {
    // Determine which months to process
    const targetMonths = bymonth.length
      ? bymonth
      : bymonthday.length || byweekday.length
        ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        : [cursor.month];

    for (const month of targetMonths) {
      // If we have BYDAY or BYMONTHDAY, expand within the month
      if (byweekday.length || bymonthday.length) {
        const monthCursor = setFields(cursor, { month, day: 1 });
        const monthResults = expandMonthly(monthCursor, options);
        results.push(...monthResults);
      } else {
        // No BYDAY/BYMONTHDAY, just use the same day as cursor
        results.push(setFields(cursor, { month }));
      }
    }
  }

  return results.sort((a, b) => compareDates(a, b));
}

/**
 * Expand by year day (BYYEARDAY).
 * Handles positive and negative day numbers.
 */
function expandByYearDay(cursor: DateValue, byyearday: number[]) {
  const results: DateValue[] = [];
  const startOfYear = getStartOfYear(cursor);
  const endOfYear = getEndOfYear(cursor);
  const isCalendarDate = cursor instanceof CalendarDate;

  // Get total days in year
  const daysInYear = calculateDifferenceInDays(startOfYear, endOfYear) + 1;

  for (const yearDay of byyearday) {
    // Normalize negative day numbers
    const dayNum = yearDay > 0 ? yearDay : daysInYear + yearDay + 1;

    // Skip invalid day numbers
    if (dayNum <= 0 || dayNum > daysInYear) {
      continue;
    }

    // Calculate the date by adding days to start of year
    let date = addDuration(startOfYear, { days: dayNum - 1 });

    // Preserve time components from cursor if cursor is CalendarDateTime/ZonedDateTime
    if ('hour' in cursor && 'hour' in date) {
      date = setFields(date, {
        hour: cursor.hour,
        minute: cursor.minute,
        second: cursor.second,
        millisecond: cursor.millisecond,
      });
    }

    // If cursor was CalendarDate, convert result back to CalendarDate
    if (isCalendarDate && 'hour' in date) {
      date = toCalendarDate(date);
    }

    // Ensure the date is still in the same year (should always be true)
    if (date.year === cursor.year) {
      results.push(date);
    }
  }

  return results.sort((a, b) => compareDates(a, b));
}

/**
 * Expand ordinal BYDAY for whole year (e.g., 5th Monday of the year, last Friday of year).
 */
function expandOrdinalByDayInYear(
  cursor: DateValue,
  byweekday: WeekdayValue[],
) {
  const results: DateValue[] = [];
  const isCalendarDate = cursor instanceof CalendarDate;

  for (const day of byweekday) {
    if (typeof day === 'string') {
      // Simple weekday - skip for this function
      continue;
    }

    const { weekday, n } = day;
    const weekdayNum = getWeekdayIndex(weekday);

    let date: DateValue;

    if (n > 0) {
      // Positive ordinal: nth weekday of year (e.g., 5th Monday)
      const startOfYear = getStartOfYear(cursor);
      const firstWeekdayIndex = getWeekdayIndex(getWeekday(startOfYear));
      const delta = (weekdayNum - firstWeekdayIndex + 7) % 7;
      date = addDuration(startOfYear, { days: delta + 7 * (n - 1) });
    } else {
      // Negative ordinal: nth weekday from end of year (e.g., last Monday)
      const endOfYear = getEndOfYear(cursor);
      const lastWeekdayIndex = getWeekdayIndex(getWeekday(endOfYear));
      const delta = (lastWeekdayIndex - weekdayNum + 7) % 7;
      date = subtractDuration(endOfYear, { days: delta + 7 * (-n - 1) });
    }

    // Preserve time components from cursor if it has them
    if ('hour' in cursor && 'hour' in date) {
      date = setFields(date, {
        hour: cursor.hour,
        minute: cursor.minute,
        second: cursor.second,
        millisecond: cursor.millisecond,
      });
    }

    // If cursor was CalendarDate, convert result back to CalendarDate
    if (isCalendarDate && 'hour' in date) {
      date = toCalendarDate(date);
    }

    // Ensure the date is in the correct year
    if (date.year === cursor.year) {
      results.push(date);
    }
  }

  return results;
}

/**
 * Expand by week number (BYWEEKNO).
 */
function expandByWeekNo(
  cursor: DateValue,
  byweekno: number[],
  byweekday: WeekdayValue[] = [],
  wkst: Weekday = Weekdays.MO,
) {
  const results: DateValue[] = [];
  const isCalendarDate = cursor instanceof CalendarDate;
  const weeksInYear = getWeeksInYear(cursor, wkst);

  // If no BYWEEKDAY, use all weekdays (per RFC 5545)
  const targetWeekdays =
    byweekday.length > 0
      ? byweekday.map((day) => (isWeekday(day) ? day : day.weekday))
      : [
          Weekdays.MO,
          Weekdays.TU,
          Weekdays.WE,
          Weekdays.TH,
          Weekdays.FR,
          Weekdays.SA,
          Weekdays.SU,
        ];

  for (const weekNo of byweekno) {
    // Normalize negative week numbers
    const normalizedWeekNo = weekNo > 0 ? weekNo : weeksInYear + weekNo + 1;

    // Skip invalid week numbers
    if (normalizedWeekNo <= 0 || normalizedWeekNo > weeksInYear) {
      continue;
    }

    // ISO 8601 week numbering: Week 1 is the week with the year's first Thursday
    // For WKST=MO (Monday), week starts on Monday
    const startOfYear = getStartOfYear(cursor);

    // Find January 4th (always in week 1 by definition)
    const jan4 = setFields(startOfYear, { month: 1, day: 4 });

    // Get the Monday of the week containing Jan 4
    const week1Monday = getStartOfWeek(jan4, wkst);

    // Add weeks to get to the target week
    const weekStartDate = addDuration(week1Monday, {
      weeks: normalizedWeekNo - 1,
    });

    // Generate all target weekdays in this week
    for (let i = 0; i < 7; i++) {
      let date = addDuration(weekStartDate, { days: i });
      const weekday = getWeekday(date);

      // Only include dates that match target weekdays and are in the correct year
      if (targetWeekdays.includes(weekday) && date.year === cursor.year) {
        // Preserve time components from cursor if it has them
        if ('hour' in cursor && 'hour' in date) {
          date = setFields(date, {
            hour: cursor.hour,
            minute: cursor.minute,
            second: cursor.second,
            millisecond: cursor.millisecond,
          });
        }

        // If cursor was CalendarDate, convert result back to CalendarDate
        if (isCalendarDate && 'hour' in date) {
          date = toCalendarDate(date);
        }

        results.push(date);
      }
    }
  }

  return results;
}

/**
 * Expand hourly occurrences.
 * For sub-daily frequencies, we need datetime types.
 */
function expandHourly(cursor: DateValue, options: ParsedRRuleOptions) {
  const { bymonth = [], bymonthday = [], byweekday = [] } = options;

  // Filter by date-level BY* rules
  if (bymonth.length && !bymonth.includes(cursor.month)) {
    return [];
  }

  if (bymonthday.length) {
    const daysInMonth = getDaysInMonth(cursor);
    const normalized = bymonthday.map((d) => (d > 0 ? d : daysInMonth + d + 1));

    if (!normalized.includes(cursor.day)) {
      return [];
    }
  }

  if (byweekday.length) {
    const weekday = getWeekday(cursor);
    const simpleWeekdays = byweekday.filter((day) => isWeekday(day));

    if (simpleWeekdays.length > 0 && !simpleWeekdays.includes(weekday)) {
      return [];
    }
  }

  // For hourly, return the cursor as-is
  // Time expansion will be handled by expandByTime
  return [cursor];
}

/**
 * Expand minutely occurrences.
 */
function expandMinutely(cursor: DateValue, options: ParsedRRuleOptions) {
  // Same filtering logic as hourly
  return expandHourly(cursor, options);
}

/**
 * Expand secondly occurrences.
 */
function expandSecondly(cursor: DateValue, options: ParsedRRuleOptions) {
  // Same filtering logic as hourly
  return expandHourly(cursor, options);
}

/**
 * Expand a date by time components (BYHOUR, BYMINUTE, BYSECOND).
 * If the date doesn't have time components, or if there are no BY* time rules, return as-is.
 */
function expandByTime(date: DateValue, options: ParsedRRuleOptions) {
  const { byhour = [], byminute = [], bysecond = [] } = options;

  // If no time rules, return the date as-is
  if (!byhour.length && !byminute.length && !bysecond.length) {
    return [date];
  }

  // If the date doesn't have time components, can't expand by time
  if (!('hour' in date)) {
    return [date];
  }

  const results: DateValue[] = [];
  const hours = byhour.length ? byhour : [date.hour];
  const minutes = byminute.length ? byminute : [date.minute];
  const seconds = bysecond.length ? bysecond : [date.second];

  for (const hour of hours) {
    for (const minute of minutes) {
      for (const second of seconds) {
        results.push(setFields(date, { hour, minute, second }));
      }
    }
  }

  return results;
}

/**
 * Apply BYSETPOS to filter positions from an expanded set.
 * If no BYSETPOS, return all dates.
 */
function applyBySetPos(dates: DateValue[], options: RRuleOptions) {
  const { bysetpos = [] } = options;

  if (!bysetpos.length) {
    return dates;
  }

  // Sort dates first
  const sorted = [...dates].sort((a, b) => compareDates(a, b));
  const results: DateValue[] = [];

  for (const position of bysetpos) {
    const index = position > 0 ? position - 1 : sorted.length + position;

    if (index >= 0 && index < sorted.length) {
      results.push(sorted[index]);
    }
  }

  return results.sort((a, b) => compareDates(a, b));
}
