import type { Frequency, Weekday, WeekdayValue } from './types';
import { Frequencies, Weekdays } from './types';

/**
 * Unfolds a line according to RFC 5545.
 *
 * Per RFC 5545, a line fold is a CRLF followed by a single space or tab.
 *
 * @param value - The line to unfold
 * @returns The unfolded line
 */
export function unfoldLine(value: string) {
  return value.replace(/\r?\n([ \t])(?![ \t])/g, '');
}

/**
 * Pads a number with leading zeros.
 *
 * @param value - The number to pad
 * @param length - The desired length (default: 2)
 * @returns The zero-padded string
 */
export function padZero(value: number, length: number = 2) {
  return String(value).padStart(length, '0');
}

/**
 * Sorts an array of numbers in ascending order.
 *
 * @param value - The array to sort
 * @returns A new sorted array
 */
export function sortNumbers(value: number[]) {
  return [...value].sort((a, b) => a - b);
}

/**
 * Removes duplicate values from an array.
 *
 * @param value - The array to deduplicate
 * @returns A new array with unique values
 */
export function unique<T>(value: T[]) {
  return [...new Set(value)];
}

/**
 * Splits a string at the first occurrence of a separator.
 *
 * @param value - The string to split
 * @param separator - The separator to split on
 * @returns A tuple of [before, after]. If separator not found, returns [value, undefined]
 */
export function splitOnce(
  value: string,
  separator: string,
): [string, string | undefined] {
  const [before, after] = value.split(separator, 2);

  return [before, after];
}

/**
 * Adds a value to a map if the key is not present.
 *
 * @param map - The map to add the value to
 * @param key - The key to add the value to
 * @param initial - The initial value to add to the map
 * @returns The value added to the map
 */
export function addToMap<K, V>(map: Map<K, V>, key: K, initial: () => V) {
  let value = map.get(key);

  if (value === undefined) {
    value = initial();
    map.set(key, value);
  }

  return value;
}

/**
 * Checks if the array is not empty.
 *
 * @param values - The array to check
 * @returns True if the array is not empty
 */
export function isNonEmptyArray<T>(values: T[]): values is [T, ...T[]] {
  return Array.isArray(values) && values.length > 0;
}

/**
 * Checks if the number is a positive integer.
 *
 * @param value - The number to check
 * @returns True if the value is a positive integer
 */
export function isPositiveInteger(value: number) {
  return Number.isInteger(value) && value > 0;
}

/**
 * Checks if the number is within a specified range.
 *
 * @param value - The number to check
 * @param min - The minimum value
 * @param max - The maximum value
 * @param inclusive - Whether the range is inclusive (default: true)
 * @returns True if the value is within the range
 */
export function isNumberInRange(
  value: number,
  min: number,
  max: number,
  inclusive = true,
) {
  if (!inclusive) {
    return value > min && value < max;
  }

  return value >= min && value <= max;
}

/**
 * Checks if the value is a Frequency.
 *
 * @param value - The value to check
 * @returns True if the value is a valid Frequency
 */
export function isFrequency(value: unknown): value is Frequency {
  return Object.values(Frequencies).includes(value as Frequency);
}

/**
 * Checks if the value is a Weekday.
 *
 * @param value - The value to check
 * @returns True if the value is a valid Weekday
 */
export function isWeekday(value: unknown): value is Weekday {
  return Object.values(Weekdays).includes(value as Weekday);
}

/**
 * Checks if the value is a WeekdayValue.
 *
 * @param value - The value to check
 * @returns True if the value is a valid WeekdayValue
 */
export function isWeekdayValue(value: unknown): value is WeekdayValue {
  if (!value) {
    return false;
  }

  if (typeof value === 'string') {
    return isWeekday(value);
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'weekday' in value &&
    'n' in value
  ) {
    return (
      isWeekday(value.weekday) &&
      typeof value.n === 'number' &&
      value.n > -53 &&
      value.n < 53
    );
  }

  return false;
}

/**
 * Removes duplicate WeekdayValue entries from an array.
 * Compares both simple weekdays and weekdays with occurrence numbers.
 *
 * @param values - The array to deduplicate
 * @returns A new array with unique WeekdayValue entries
 */
export function uniqueWeekdayValues(values: WeekdayValue[]) {
  return values.filter((value, index) => {
    // Check if this is the first occurrence of this WeekdayValue
    return (
      values.findIndex((v) => {
        if (typeof value === 'string' && typeof v === 'string') {
          return value === v;
        }

        if (typeof value === 'object' && typeof v === 'object') {
          return value.weekday === v.weekday && value.n === v.n;
        }

        return false;
      }) === index
    );
  });
}
