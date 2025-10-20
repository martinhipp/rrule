import type { DateValue } from '@internationalized/date';
import { formatICS } from './format';
import { generateDates } from './generator';
import { parseICS } from './parser';
import {
  sanitizeFrequency,
  sanitizeNumber,
  sanitizeNumberArray,
  sanitizeRRuleOptions,
  sanitizeUntilDate,
  sanitizeWeekday,
  sanitizeWeekdayValueArray,
  validateBySetPos,
} from './sanitize';
import type {
  Frequency,
  ParsedRRuleOptions,
  RRuleOptions,
  Weekday,
  WeekdayValue,
} from './types';

/**
 * RRule class for creating and working with recurrence rules.
 *
 * @example
 * ```typescript
 * // From options
 * const rrule = new RRule({
 *   freq: 'DAILY',
 *   count: 10,
 *   dtstart: new CalendarDate(2025, 1, 1)
 * });
 *
 * // From string
 * const rrule = RRule.fromString('RRULE:FREQ=DAILY;COUNT=10');
 *
 * // Generate occurrences
 * const dates = rrule.all();
 * const next = rrule.after(new CalendarDate(2025, 1, 15));
 *
 * // Use as iterator
 * for (const date of rrule) {
 *   console.log(date);
 * }
 * const dates = [...rrule];
 * ```
 */
export class RRule implements Iterable<DateValue> {
  private _options: ParsedRRuleOptions;
  private _maxIterations: number | undefined;

  /**
   * Creates a new RRule instance.
   *
   * @param options - The RRule options
   */
  constructor(options: RRuleOptions) {
    this._options = sanitizeRRuleOptions(options);
  }

  /**
   * Creates an RRule from an ICS string with a RRULE and optional DTSTART.
   *
   * @param icsString - The ICS string with a RRULE and optional DTSTART
   * @param strict - Whether to use strict parsing (default: true)
   * @returns The new RRule instance
   */
  static fromString(icsString: string, strict = true) {
    const options = parseICS(icsString, strict);

    return new RRule(options);
  }

  /**
   * Converts the RRule to an ICS string with DTSTART and RRULE.
   *
   * @returns The ICS string representation (e.g., "DTSTART:20250101\nRRULE:FREQ=DAILY;COUNT=10")
   */
  toString() {
    return formatICS(this._options);
  }

  /**
   * Converts the RRule to an options object with all values deep cloned.
   *
   * @returns A deep copy of the RRule's parsed options
   */
  toObject(): ParsedRRuleOptions {
    return {
      freq: this.freq,
      dtstart: this.dtstart?.copy(),
      interval: this.interval,
      count: this.count,
      until: this.until?.copy(),
      wkst: this.wkst,
      bysetpos: this.bysetpos && [...this.bysetpos],
      bymonth: this.bymonth && [...this.bymonth],
      bymonthday: this.bymonthday && [...this.bymonthday],
      byyearday: this.byyearday && [...this.byyearday],
      byweekno: this.byweekno && [...this.byweekno],
      byweekday: this.byweekday?.map((weekday) =>
        typeof weekday === 'string' ? weekday : { ...weekday },
      ),
      byhour: this.byhour && [...this.byhour],
      byminute: this.byminute && [...this.byminute],
      bysecond: this.bysecond && [...this.bysecond],
    };
  }

  get freq() {
    return this._options.freq;
  }

  set freq(value: Frequency) {
    this._options.freq = sanitizeFrequency(value);
  }

  get dtstart() {
    return this._options.dtstart;
  }

  set dtstart(value: DateValue | undefined) {
    this._options.dtstart = value;
  }

  get interval() {
    return this._options.interval;
  }

  set interval(value: number | undefined) {
    this._options.interval = sanitizeNumber(value, 1);
  }

  get count() {
    return this._options.count;
  }

  /**
   * @throws {Error} If COUNT and UNTIL are both set
   */
  set count(value: number | undefined) {
    if (value !== undefined && this._options.until !== undefined) {
      throw new Error('COUNT and UNTIL are mutually exclusive');
    }

    this._options.count = sanitizeNumber(value, 1);
  }

  get until() {
    return this._options.until;
  }

  /**
   * @throws {Error} If COUNT and UNTIL are both set
   */
  set until(value: DateValue | undefined) {
    if (value !== undefined && this._options.count !== undefined) {
      throw new Error('COUNT and UNTIL are mutually exclusive');
    }

    this._options.until = sanitizeUntilDate(value, this._options?.dtstart);
  }

  get wkst() {
    return this._options.wkst;
  }

  set wkst(value: Weekday | undefined) {
    this._options.wkst = sanitizeWeekday(value);
  }

  get bysetpos() {
    return this._options.bysetpos;
  }

  /**
   * @throws {Error} If BYSETPOS is set without another BYxxx rule
   */
  set bysetpos(value: number[] | undefined) {
    this._options.bysetpos = sanitizeNumberArray(value, -366, 366, false);

    if (!validateBySetPos(this._options)) {
      throw new Error('BYSETPOS must be used with another BYxxx rule');
    }
  }

  get bymonth() {
    return this._options.bymonth;
  }

  set bymonth(value: number[] | undefined) {
    this._options.bymonth = sanitizeNumberArray(value, 1, 12, false);
  }

  get bymonthday() {
    return this._options.bymonthday;
  }

  set bymonthday(value: number[] | undefined) {
    this._options.bymonthday = sanitizeNumberArray(value, -31, 31, false);
  }

  get byyearday() {
    return this._options.byyearday;
  }

  set byyearday(value: number[] | undefined) {
    this._options.byyearday = sanitizeNumberArray(value, -366, 366, false);
  }

  get byweekno() {
    return this._options.byweekno;
  }

  set byweekno(value: number[] | undefined) {
    this._options.byweekno = sanitizeNumberArray(value, -53, 53, false);
  }

  get byweekday() {
    return this._options.byweekday;
  }

  set byweekday(value: WeekdayValue[] | undefined) {
    this._options.byweekday = sanitizeWeekdayValueArray(value);
  }

  get byhour() {
    return this._options.byhour;
  }

  set byhour(value: number[] | undefined) {
    this._options.byhour = sanitizeNumberArray(value, 0, 23, true);
  }

  get byminute() {
    return this._options.byminute;
  }

  set byminute(value: number[] | undefined) {
    this._options.byminute = sanitizeNumberArray(value, 0, 59, true);
  }

  get bysecond() {
    return this._options.bysecond;
  }

  set bysecond(value: number[] | undefined) {
    this._options.bysecond = sanitizeNumberArray(value, 0, 59, true);
  }

  get maxIterations() {
    return this._maxIterations;
  }

  /**
   * @throws {Error} If maxIterations is less than 1
   */
  set maxIterations(value: number | undefined) {
    if (value !== undefined && value < 1) {
      throw new Error('maxIterations must be greater than 0');
    }

    this._maxIterations = value;
  }

  /**
   * Iterator implementation - generates recurrence dates
   *
   * @yields DateValue occurrences
   * @todo Implement generator logic
   */
  *[Symbol.iterator](): Generator<DateValue> {
    yield* generateDates(this._options, this._maxIterations);
  }

  /**
   * Generates all occurrences up to a limit.
   *
   * @param limit - The maximum number of occurrences to generate
   * @returns An array of dates
   */
  all(limit?: number): DateValue[] {
    const result: DateValue[] = [];
    let count = 0;

    for (const date of this) {
      result.push(date);
      if (limit && ++count >= limit) break;
    }

    return result;
  }

  /**
   * Returns all occurrences between two dates.
   *
   * @param start - The start date
   * @param end - The end date
   * @param inclusive - Whether to include start/end if they match (default: true)
   * @returns An array of dates between start and end
   */
  between(start: DateValue, end: DateValue, inclusive = true): DateValue[] {
    const result: DateValue[] = [];

    for (const date of this) {
      const cmpStart = date.compare(start);
      const cmpEnd = date.compare(end);

      if (cmpStart < 0 || (!inclusive && cmpStart === 0)) continue;
      if (cmpEnd > 0 || (!inclusive && cmpEnd === 0)) break;

      result.push(date);
    }

    return result;
  }

  /**
   * Returns all occurrences before a given date.
   *
   * @param date - The reference date
   * @param inclusive - Whether to include the date itself if it matches (default: false)
   * @param limit - The maximum number of occurrences to return (default: no limit)
   * @returns An array of dates before the reference date
   */
  before(date: DateValue, inclusive = false, limit?: number): DateValue[] {
    const result: DateValue[] = [];

    for (const current of this) {
      const cmp = current.compare(date);

      if (cmp > 0) break;
      if (cmp === 0 && !inclusive) break;

      result.push(current);

      if (limit && result.length >= limit) break;
    }

    return result;
  }

  /**
   * Returns all occurrences after a given date.
   *
   * @param date - The reference date
   * @param inclusive - Whether to include the date itself if it matches (default: false)
   * @param limit - The maximum number of occurrences to return (default: no limit)
   * @returns An array of dates after the reference date
   */
  after(date: DateValue, inclusive = false, limit?: number): DateValue[] {
    const result: DateValue[] = [];

    // Use efficient seeking by starting generation from the target date
    for (const current of generateDates(
      this._options,
      this._maxIterations,
      date,
    )) {
      const cmp = current.compare(date);

      if (cmp < 0) continue;
      if (cmp === 0 && !inclusive) continue;

      result.push(current);

      if (limit && result.length >= limit) break;
    }

    return result;
  }

  /**
   * Returns the last occurrence before a given date.
   *
   * @param date - The reference date
   * @param inclusive - Whether to include the date itself if it matches (default: false)
   * @returns The last date before the reference date, or undefined if none exists
   */
  previous(date: DateValue, inclusive = false): DateValue | undefined {
    let result: DateValue | undefined;

    for (const current of this) {
      const cmp = current.compare(date);

      if (cmp > 0) break;
      if (cmp === 0 && !inclusive) break;

      result = current;
    }

    return result;
  }

  /**
   * Returns the first occurrence after a given date.
   *
   * @param date - The reference date
   * @param inclusive - Whether to include the date itself if it matches (default: false)
   * @returns The first date after the reference date, or undefined if none exists
   */
  next(date: DateValue, inclusive = false): DateValue | undefined {
    for (const current of this) {
      const cmp = current.compare(date);

      if (cmp < 0) continue;
      if (cmp === 0 && !inclusive) continue;

      return current;
    }

    return undefined;
  }

  /**
   * Clones the RRule with optional option overrides.
   *
   * @param overrides - The partial options to override
   * @returns The new RRule instance with merged options
   */
  clone(overrides?: RRuleOptions) {
    return new RRule({ ...this.toObject(), ...overrides });
  }

  /**
   * Sets the options for the RRule.
   *
   * @param options - The RRule options to set
   * @returns The RRule instance itself
   */
  setOptions(options: RRuleOptions) {
    this._options = sanitizeRRuleOptions({ ...this._options, ...options });

    return this;
  }
}
