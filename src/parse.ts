import {
  parseAbsolute,
  parseDate,
  parseDateTime,
} from '@internationalized/date';
import type { WeekdayValue } from './types';
import { isFrequency, isPositiveInteger, isWeekday, padZero } from './utils';

/**
 * Parses a string to an integer.
 *
 * @param value - The string to parse
 * @returns The parsed integer or NaN if the string is not a valid integer
 */
export function parseInteger(value: string) {
  return Number.parseInt(value, 10);
}

/**
 * Parses a string to a positive integer.
 *
 * @param value - The string to parse
 * @returns The parsed positive integer
 * @throws {Error} If the string is not a positive integer
 */
export function parsePositiveInteger(value: string) {
  const number = parseInteger(value);

  if (!isPositiveInteger(number)) {
    throw new Error(`Invalid positive integer: ${value}`);
  }

  return number;
}

/**
 * Parses a string to a list of items.
 *
 * @param value - The string to parse
 * @param separator - The separator to use (default: ',')
 * @returns The parsed list of items, empty strings are removed
 */
export function parseList(value: string, separator = ',') {
  if (!value.trim()) return [];

  return value
    .split(separator)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * Parses a string to a list of integers.
 *
 * @param value - The string to parse
 * @param separator - The separator to use
 * @returns The parsed list of integers
 */
export function parseIntegerList(value: string, separator = ',') {
  return parseList(value, separator)
    .map((number) => parseInteger(number))
    .filter((number) => !Number.isNaN(number));
}

/**
 * Parses an ICS date value.
 *
 * Supported formats:
 * - YYYYMMDD will return a CalendarDate
 * - YYYYMMDDTHHMMSS will return a CalendarDateTime
 * - YYYYMMDDTHHMMSSZ will return a ZonedDateTime in UTC
 *
 * @param value - The ICS date string to parse
 * @returns The parsed date value
 * @throws {Error} If the ICS date string is invalid
 */
export function parseICSDateValue(value: string) {
  value = value.trim();

  if (!/^\d{8}(?:T\d{6}Z?)?$/.test(value)) {
    throw new Error(`Invalid ICS date format: ${value}`);
  }

  const year = parseInteger(value.slice(0, 4));
  const month = parseInteger(value.slice(4, 6));
  const day = parseInteger(value.slice(6, 8));
  const hour = parseInteger(value.slice(9, 11));
  const minute = parseInteger(value.slice(11, 13));
  const second = parseInteger(value.slice(13, 15));

  const date = `${padZero(year, 4)}-${padZero(month, 2)}-${padZero(day, 2)}`;

  if (Number.isNaN(hour) || Number.isNaN(minute) || Number.isNaN(second)) {
    return parseDate(date);
  }

  const time = `${padZero(hour, 2)}:${padZero(minute, 2)}:${padZero(second, 2)}`;

  if (!value.endsWith('Z')) {
    return parseDateTime(`${date}T${time}`);
  }

  return parseAbsolute(`${date}T${time}Z`, 'UTC');
}

/**
 * Parses a frequency string.
 *
 * @param value - The frequency string to parse
 * @returns The parsed Frequency
 * @throws {Error} If the frequency string is invalid
 */
export function parseFrequency(value: string) {
  value = value.trim().toUpperCase();

  if (!value) {
    throw new Error('Invalid frequency');
  }

  if (!isFrequency(value)) {
    throw new Error(`Invalid frequency: ${value}`);
  }

  return value;
}

/**
 * Parses a weekday string into a Weekday.
 *
 * @param value - The weekday string to parse
 * @returns The parsed Weekday
 * @throws {Error} If the weekday string is invalid
 */
export function parseWeekday(value: string) {
  value = value.trim().toUpperCase();

  if (!value) {
    throw new Error('Invalid weekday');
  }

  if (!isWeekday(value)) {
    throw new Error(`Invalid weekday: ${value}`);
  }

  return value;
}

/**
 * Parses a weekday string into a WeekdayValue object.
 *
 * Supported formats: 'MO', '+1WE', '-2FR'.
 *
 * @param value - The weekday string to parse
 * @returns The parsed WeekdayValue object
 * @throws {Error} If the weekday string is invalid
 */
export function parseWeekdayValue(value: string): WeekdayValue {
  value = value.trim().toUpperCase();

  if (!value) {
    throw new Error('Invalid weekday');
  }

  const match = value.match(/^([+-]?\d{1,2})?([A-Z]{2})$/);

  if (!match) {
    throw new Error(`Invalid weekday format: ${value}`);
  }

  const [, occurrence, weekday] = match;

  if (!isWeekday(weekday)) {
    throw new Error(`Invalid weekday: ${weekday}`);
  }

  if (!occurrence) {
    return weekday;
  }

  const n = parseInteger(occurrence);

  if (n === 0) {
    throw new Error(`Weekday occurrence cannot be 0: ${value}`);
  }

  if (n < -53 || n > 53) {
    throw new Error(`Weekday occurrence must be between -53 and 53: ${value}`);
  }

  return { weekday, n };
}
