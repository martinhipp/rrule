import type { DateValue } from '@internationalized/date';
import {
  CalendarDate,
  CalendarDateTime,
  toZoned,
  ZonedDateTime,
} from '@internationalized/date';
import {
  parseFrequency,
  parseICSDateValue,
  parseIntegerList,
  parseList,
  parsePositiveInteger,
  parseWeekday,
  parseWeekdayValue,
} from './parse';
import type { ParsedRRuleOptions, RRuleOptions, WeekdayValue } from './types';
import { Frequencies } from './types';
import {
  isNumberInRange,
  splitOnce,
  unfoldLine,
  unique,
  uniqueWeekdayValues,
} from './utils';

/**
 * Parses a full ICS snippet with DTSTART and RRULE.
 *
 * @param icsString - The ICS snippet (e.g., "DTSTART:20240101T090000\nRRULE:FREQ=DAILY;COUNT=10")
 * @param strict - If true, throws an error if any DTSTART or RRULE parameter is invalid (default: true)
 * @returns The parsed RRuleOptions with dtstart set
 * @throws {Error} If the ICS string is invalid, or if strict is true and either the DTSTART or RRULE is invalid
 *
 * @example
 * ```typescript
 * const options = parseICS(`
 *   DTSTART:20250101T101530Z
 *   RRULE:FREQ=DAILY;COUNT=10
 * `);
 * // => { freq: 'DAILY', count: 10, dtstart: ZonedDateTime(2025, 1, 1, 'UTC', 0, 10, 15, 30) }
 * ```
 */
export function parseICS(icsString: string, strict = true) {
  const unfolded = unfoldLine(icsString.trim());
  const lines = unfolded
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let dtstart: DateValue | undefined;
  let rruleLine: string | undefined;

  for (const line of lines) {
    if (/^DTSTART/i.test(line)) {
      dtstart = parseDTStart(line, strict);
    } else if (/^RRULE:/i.test(line)) {
      rruleLine = line;
    }
  }

  if (!rruleLine) {
    throw new Error('RRULE line not found in ICS string');
  }

  const rruleOptions = parseRRule(rruleLine, strict);

  if (dtstart) {
    rruleOptions.dtstart = dtstart;
  }

  return rruleOptions;
}

/**
 * Parses a DTSTART parameter value.
 */
function parseDTStartParam(params: string | undefined, key: 'TZID' | 'VALUE') {
  if (!params) return;

  const [, paramValue] =
    params.match(new RegExp(`;${key}=([^;:]+)`, 'i')) ?? [];

  return paramValue;
}

/**
 * Parses a DTSTART line into a DateValue.
 *
 * @param value - The DTSTART line to parse
 * @param strict - Whether to use strict parsing (default: true)
 * @returns The parsed DateValue
 * @throws {Error} If strict is true and the DTSTART line is invalid
 */
export function parseDTStart(value: string, strict = true) {
  value = value.trim();

  const match = value.match(/^DTSTART([^:]*):(.+)$/i);

  if (!match) {
    if (strict) {
      throw new Error(`Invalid DTSTART: ${value}`);
    }

    return;
  }

  const [, params, dateValue] = match;
  const tzid = parseDTStartParam(params, 'TZID');
  // Not used as the DateValue determines the value type
  // const valueType = parseDTStartParam(params, "VALUE");

  let date = parseICSDateValue(dateValue);

  if (tzid && date instanceof CalendarDateTime) {
    date = toZoned(date, tzid);
  }

  if (strict) {
    if (tzid && date instanceof CalendarDate) {
      throw new Error(
        'Invalid DTSTART: TZID is not compatible with date-only values',
      );
    }

    if (tzid && date instanceof ZonedDateTime && date.timeZone === 'UTC') {
      throw new Error(
        'Invalid DTSTART: TZID is not compatible with UTC datetime values',
      );
    }
  }

  return date;
}

/**
 * Parses an RRULE string into RRuleOptions.
 *
 * @param rruleString - The RRULE string to parse (e.g., "RRULE:FREQ=DAILY;INTERVAL=2;COUNT=10")
 * @param strict - Whether to use strict parsing (default: true)
 * @returns The parsed RRuleOptions
 * @throws {Error} If the RRULE string is invalid, or if strict is true and any RRULE parameter is invalid
 *
 * @example
 * ```typescript
 * const rrule = parseRRule('RRULE:FREQ=DAILY;INTERVAL=2;COUNT=10');
 * // => { freq: 'DAILY', interval: 2, count: 10 }
 * ```
 */
export function parseRRule(rruleString: string, strict = true) {
  const unfolded = unfoldLine(rruleString.trim());
  const match = unfolded.match(/^RRULE:(.+)$/i);

  if (!match) {
    throw new Error(`Invalid RRULE string: ${unfolded}`);
  }

  const [, rrule] = match;

  const params = parseList(rrule, ';');
  const options: RRuleOptions = {};

  for (const param of params) {
    try {
      const [key, value] = splitOnce(param, '=');

      if (!key || !value) {
        throw new Error(`Invalid RRULE parameter: ${param}`);
      }

      switch (key.toUpperCase()) {
        case 'FREQ':
          options.freq = parseRRuleFrequency(value, strict);
          break;
        case 'INTERVAL':
          options.interval = parseRRuleInterval(value, strict);
          break;
        case 'COUNT':
          options.count = parseRRuleCount(value, strict);
          break;
        case 'UNTIL':
          options.until = parseRRuleUntil(value, strict);
          break;
        case 'WKST':
          options.wkst = parseRRuleWkst(value, strict);
          break;
        case 'BYDAY':
        case 'BYWEEKDAY':
          options.byweekday = parseRRuleByDay(value, strict);
          break;
        case 'BYMONTH':
          options.bymonth = parseRRuleNumberList(
            'BYMONTH',
            value,
            1,
            12,
            true,
            strict,
          );
          break;
        case 'BYMONTHDAY':
          options.bymonthday = parseRRuleNumberList(
            'BYMONTHDAY',
            value,
            -31,
            31,
            true,
            strict,
          );
          break;
        case 'BYYEARDAY':
          options.byyearday = parseRRuleNumberList(
            'BYYEARDAY',
            value,
            -366,
            366,
            true,
            strict,
          );
          break;
        case 'BYWEEKNO':
          options.byweekno = parseRRuleNumberList(
            'BYWEEKNO',
            value,
            -53,
            53,
            true,
            strict,
          );
          break;
        case 'BYHOUR':
          options.byhour = parseRRuleNumberList(
            'BYHOUR',
            value,
            0,
            23,
            false,
            strict,
          );
          break;
        case 'BYMINUTE':
          options.byminute = parseRRuleNumberList(
            'BYMINUTE',
            value,
            0,
            59,
            false,
            strict,
          );
          break;
        case 'BYSECOND':
          options.bysecond = parseRRuleNumberList(
            'BYSECOND',
            value,
            0,
            59,
            false,
            strict,
          );
          break;
        case 'BYSETPOS':
          options.bysetpos = parseRRuleNumberList(
            'BYSETPOS',
            value,
            -366,
            366,
            true,
            strict,
          );
          break;
        default:
          throw new Error(`Unknown RRULE parameter: ${key}`);
      }
    } catch (error) {
      if (strict) {
        throw error;
      }
    }
  }

  if (options.freq === undefined) {
    throw new Error('Invalid RRule: FREQ is required');
  }

  if (options.count !== undefined && options.until !== undefined) {
    throw new Error('Invalid RRule: COUNT and UNTIL are mutually exclusive');
  }

  return options as ParsedRRuleOptions;
}

/**
 * Parses a FREQ value into a Frequency
 */
function parseRRuleFrequency(value: string, strict = true) {
  try {
    return parseFrequency(value);
  } catch {
    if (strict) {
      throw new Error(`Invalid FREQ value: ${value}`);
    }

    return Frequencies.YEARLY;
  }
}

/**
 * Parses an INTERVAL value into a positive integer
 */
function parseRRuleInterval(value: string, strict = true) {
  try {
    return parsePositiveInteger(value);
  } catch {
    if (strict) {
      throw new Error(`Invalid INTERVAL value: ${value}`);
    }

    return 1;
  }
}

/**
 * Parses a COUNT value into a positive integer
 */
function parseRRuleCount(value: string, strict = true) {
  try {
    return parsePositiveInteger(value);
  } catch {
    if (strict) {
      throw new Error(`Invalid COUNT value: ${value}`);
    }

    return;
  }
}

/**
 * Parses an UNTIL value into a DateValue
 */
function parseRRuleUntil(value: string, strict = true) {
  try {
    return parseICSDateValue(value.trim());
  } catch {
    if (strict) {
      throw new Error(`Invalid UNTIL value: ${value}`);
    }

    return;
  }
}

/**
 * Parses a WKST value (MO, TU, WE, TH, FR, SA, SU)
 */
function parseRRuleWkst(value: string, strict = true) {
  if (!value.trim()) return;

  try {
    return parseWeekday(value);
  } catch {
    if (strict) {
      throw new Error(`Invalid WKST value: ${value}`);
    }

    return;
  }
}

/**
 * Parses BYDAY values (e.g., "MO, TU, 1FR, -2SA")
 */
function parseRRuleByDay(value: string, strict = true) {
  const weekdays = parseList(value, ',');

  if (weekdays.length === 0) {
    return [];
  }

  const weekdayValues: WeekdayValue[] = [];

  for (const day of weekdays) {
    try {
      const weekdayValue = parseWeekdayValue(day);

      weekdayValues.push(weekdayValue);
    } catch {
      if (strict) {
        throw new Error(`Invalid BYDAY value: ${day}`);
      }
    }
  }

  return uniqueWeekdayValues(weekdayValues);
}

/**
 * Parses a comma-separated list of numbers with range validation
 */
function parseRRuleNumberList(
  key: string,
  value: string,
  min: number,
  max: number,
  excludeZero = false,
  strict = true,
): number[] {
  const numbers = parseIntegerList(value, ',');

  if (numbers.length === 0) {
    return [];
  }

  const values: number[] = [];

  for (const number of numbers) {
    // Check for zero (not allowed in some fields like BYMONTHDAY, BYYEARDAY, etc.)
    if (excludeZero && number === 0) {
      if (strict) {
        throw new Error(`Invalid ${key} value: ${number}`);
      }

      continue;
    }

    // Check range
    if (!isNumberInRange(number, min, max)) {
      if (strict) {
        throw new Error(
          `Invalid ${key} value: ${number}. Must be between ${min} and ${max}`,
        );
      }

      continue;
    }

    values.push(number);
  }

  return unique(values);
}
