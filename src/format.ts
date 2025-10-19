import type { DateValue } from '@internationalized/date';
import {
  CalendarDate,
  CalendarDateTime,
  toCalendarDate,
  toCalendarDateTime,
  toTimeZone,
  toZoned,
  ZonedDateTime,
} from '@internationalized/date';
import type { ParsedRRuleOptions, WeekdayValue } from './types';
import { isWeekday, padZero } from './utils';

/**
 * Formats a DateValue to ICS date format.
 *
 * @param value - The DateValue to format
 * @returns The formatted string (e.g., "20250101", "20250101T101530", "20250101T101530Z")
 */
export function formatICSDateValue(value: DateValue) {
  const date = `${padZero(value.year, 4)}${padZero(value.month, 2)}${padZero(value.day, 2)}`;

  if (value instanceof CalendarDate) {
    return date;
  }

  const time = `${padZero(value.hour, 2)}${padZero(value.minute, 2)}${padZero(value.second, 2)}`;

  if (value instanceof ZonedDateTime && value.timeZone === 'UTC') {
    return `${date}T${time}Z`;
  }

  return `${date}T${time}`;
}

/**
 * Formats a DTSTART line.
 *
 * @param value - The DateValue to format
 * @returns The formatted DTSTART string (e.g., "DTSTART:20250101", "DTSTART;TZID=America/New_York:20250101T101530")
 */
export function formatDTStart(value: DateValue) {
  if (
    value instanceof CalendarDate ||
    value instanceof CalendarDateTime ||
    (value instanceof ZonedDateTime && value.timeZone === 'UTC')
  ) {
    return `DTSTART:${formatICSDateValue(value)}`;
  }

  return `DTSTART;TZID=${value.timeZone}:${formatICSDateValue(value)}`;
}

/**
 * Formats an UNTIL DateValue to ICS date format.
 *
 * Per RFC 5545, UNTIL must be in the same format as DTSTART:
 * - If DTSTART is a date, UNTIL is formatted as a date
 * - If DTSTART is a datetime, UNTIL is formatted as a datetime
 * - If DTSTART is a ZonedDateTime, UNTIL is converted to UTC with Z suffix
 *
 * @param value - The UNTIL DateValue to format
 * @param start - The DTSTART value (optional, used to determine format)
 * @returns The formatted UNTIL string
 * @throws {Error} If the UNTIL value is before the DTSTART value
 */
export function formatUntilICSDateValue(value: DateValue, start?: DateValue) {
  if (!start) {
    return formatICSDateValue(value);
  }

  if (value.compare(start) < 0) {
    throw new Error('UNTIL must not be before DTSTART');
  }

  if (start instanceof CalendarDate) {
    value = toCalendarDate(value);
  }

  if (start instanceof CalendarDateTime) {
    value = toCalendarDateTime(value);
  }

  if (start instanceof ZonedDateTime) {
    if (value instanceof CalendarDate || value instanceof CalendarDateTime) {
      value = toZoned(value, 'UTC');
    }

    if (value instanceof ZonedDateTime && value.timeZone !== 'UTC') {
      value = toTimeZone(value, 'UTC');
    }
  }

  return formatICSDateValue(value);
}

/**
 * Formats a WeekdayValue object into a string.
 *
 * @param value - The WeekdayValue to format
 * @returns The formatted weekday string (e.g., "MO", "1MO", "-2FR")
 */
export function formatWeekdayValue(value: WeekdayValue) {
  if (isWeekday(value)) {
    return value;
  }

  const { weekday, n } = value;

  if (!n) {
    return weekday;
  }

  return `${n}${weekday}`;
}

/**
 * Formats RRuleOptions into an RRULE string.
 *
 * @param options - The RRuleOptions to format
 * @returns The formatted RRULE string (e.g., "RRULE:FREQ=DAILY;COUNT=10")
 */
export function formatRRule(options: ParsedRRuleOptions): string {
  const parts: string[] = [`FREQ=${options.freq}`];

  if (options.interval !== undefined && options.interval !== 1) {
    parts.push(`INTERVAL=${options.interval}`);
  }

  if (options.count !== undefined) {
    parts.push(`COUNT=${options.count}`);
  }

  if (options.until !== undefined) {
    const untilValue = formatUntilICSDateValue(options.until, options.dtstart);

    parts.push(`UNTIL=${untilValue}`);
  }

  if (options.wkst !== undefined) {
    parts.push(`WKST=${options.wkst}`);
  }

  if (options.bymonth !== undefined && options.bymonth.length > 0) {
    parts.push(`BYMONTH=${options.bymonth.join(',')}`);
  }

  if (options.bymonthday !== undefined && options.bymonthday.length > 0) {
    parts.push(`BYMONTHDAY=${options.bymonthday.join(',')}`);
  }

  if (options.byyearday !== undefined && options.byyearday.length > 0) {
    parts.push(`BYYEARDAY=${options.byyearday.join(',')}`);
  }

  if (options.byweekno !== undefined && options.byweekno.length > 0) {
    parts.push(`BYWEEKNO=${options.byweekno.join(',')}`);
  }

  if (options.byweekday !== undefined && options.byweekday.length > 0) {
    const weekdays = options.byweekday.map(formatWeekdayValue).join(',');

    parts.push(`BYDAY=${weekdays}`);
  }

  if (options.byhour !== undefined && options.byhour.length > 0) {
    parts.push(`BYHOUR=${options.byhour.join(',')}`);
  }

  if (options.byminute !== undefined && options.byminute.length > 0) {
    parts.push(`BYMINUTE=${options.byminute.join(',')}`);
  }

  if (options.bysecond !== undefined && options.bysecond.length > 0) {
    parts.push(`BYSECOND=${options.bysecond.join(',')}`);
  }

  if (options.bysetpos !== undefined && options.bysetpos.length > 0) {
    parts.push(`BYSETPOS=${options.bysetpos.join(',')}`);
  }

  return `RRULE:${parts.join(';')}`;
}

/**
 * Formats RRuleOptions into a full ICS recurrence block with DTSTART and RRULE.
 *
 * @param options - The RRuleOptions to format
 * @returns The formatted ICS string (e.g., "DTSTART:20250101T100000Z\nRRULE:FREQ=DAILY;COUNT=10")
 */
export function formatICS(options: ParsedRRuleOptions): string {
  const rrule = formatRRule(options);

  if (!options.dtstart) {
    return rrule;
  }

  const dtstart = formatDTStart(options.dtstart);

  return `${dtstart}\n${rrule}`;
}
