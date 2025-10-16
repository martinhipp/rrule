import { describe, expect, it } from 'vitest';
import { Frequencies, Weekdays } from '../types';
import {
  addToMap,
  isFrequency,
  isNonEmptyArray,
  isNumberInRange,
  isPositiveInteger,
  isWeekday,
  isWeekdayValue,
  padZero,
  sortNumbers,
  splitOnce,
  unfoldLine,
  unique,
  uniqueWeekdayValues,
} from '../utils';

describe('unfoldLine', () => {
  it('should unfold lines with CRLF and space', () => {
    const folded = 'RRULE:FREQ=DAILY;\r\n COUNT=10';
    const unfolded = unfoldLine(folded);

    expect(unfolded).toBe('RRULE:FREQ=DAILY;COUNT=10');
  });

  it('should unfold lines with LF and space', () => {
    const folded = 'RRULE:FREQ=DAILY;\n COUNT=10';
    const unfolded = unfoldLine(folded);

    expect(unfolded).toBe('RRULE:FREQ=DAILY;COUNT=10');
  });

  it('should unfold lines with tab', () => {
    const folded = 'RRULE:FREQ=DAILY;\n\tCOUNT=10';
    const unfolded = unfoldLine(folded);

    expect(unfolded).toBe('RRULE:FREQ=DAILY;COUNT=10');
  });

  it('should not unfold lines without folding', () => {
    const line = 'RRULE:FREQ=DAILY;COUNT=10';
    const unfolded = unfoldLine(line);

    expect(unfolded).toBe(line);
  });

  it('should handle multiple folds', () => {
    const folded = 'RRULE:FREQ=DAILY;\r\n COUNT=10;\r\n INTERVAL=2';
    const unfolded = unfoldLine(folded);

    expect(unfolded).toBe('RRULE:FREQ=DAILY;COUNT=10;INTERVAL=2');
  });
});

describe('padZero', () => {
  it('should pad single digit numbers with default length', () => {
    expect(padZero(5)).toBe('05');
  });

  it('should pad with custom length', () => {
    expect(padZero(5, 4)).toBe('0005');
  });

  it('should not pad numbers already at desired length', () => {
    expect(padZero(12)).toBe('12');
  });

  it('should not pad numbers longer than desired length', () => {
    expect(padZero(123, 2)).toBe('123');
  });

  it('should handle zero', () => {
    expect(padZero(0)).toBe('00');
  });
});

describe('sortNumbers', () => {
  it('should sort numbers in ascending order', () => {
    const numbers = [5, 2, 8, 1, 9];
    const sorted = sortNumbers(numbers);

    expect(sorted).toEqual([1, 2, 5, 8, 9]);
  });

  it('should not mutate original array', () => {
    const numbers = [5, 2, 8];
    sortNumbers(numbers);

    expect(numbers).toEqual([5, 2, 8]);
  });

  it('should handle already sorted arrays', () => {
    const numbers = [1, 2, 3, 4, 5];
    const sorted = sortNumbers(numbers);

    expect(sorted).toEqual([1, 2, 3, 4, 5]);
  });

  it('should handle negative numbers', () => {
    const numbers = [5, -2, 0, -10, 3];
    const sorted = sortNumbers(numbers);

    expect(sorted).toEqual([-10, -2, 0, 3, 5]);
  });

  it('should handle empty array', () => {
    const numbers: number[] = [];
    const sorted = sortNumbers(numbers);

    expect(sorted).toEqual([]);
  });
});

describe('unique', () => {
  it('should remove duplicate numbers', () => {
    const numbers = [1, 2, 2, 3, 3, 3, 4];
    const uniqueNumbers = unique(numbers);

    expect(uniqueNumbers).toEqual([1, 2, 3, 4]);
  });

  it('should remove duplicate strings', () => {
    const strings = ['a', 'b', 'b', 'c', 'a'];
    const uniqueStrings = unique(strings);

    expect(uniqueStrings).toEqual(['a', 'b', 'c']);
  });

  it('should not mutate original array', () => {
    const numbers = [1, 2, 2, 3];
    unique(numbers);

    expect(numbers).toEqual([1, 2, 2, 3]);
  });

  it('should handle empty array', () => {
    const empty: number[] = [];
    const uniqueEmpty = unique(empty);

    expect(uniqueEmpty).toEqual([]);
  });

  it('should handle array with no duplicates', () => {
    const numbers = [1, 2, 3, 4];
    const uniqueNumbers = unique(numbers);

    expect(uniqueNumbers).toEqual([1, 2, 3, 4]);
  });
});

describe('splitOnce', () => {
  it('should split string at first occurrence', () => {
    const [before, after] = splitOnce('key=value', '=');

    expect(before).toBe('key');
    expect(after).toBe('value');
  });

  it('should return undefined for after if separator not found', () => {
    const [before, after] = splitOnce('noSeparator', '=');

    expect(before).toBe('noSeparator');
    expect(after).toBeUndefined();
  });

  it('should handle empty string before separator', () => {
    const [before, after] = splitOnce('=value', '=');

    expect(before).toBe('');
    expect(after).toBe('value');
  });

  it('should handle empty string after separator', () => {
    const [before, after] = splitOnce('key=', '=');

    expect(before).toBe('key');
    expect(after).toBe('');
  });
});

describe('addToMap', () => {
  it('should add value to map if key not present', () => {
    const map = new Map<string, number>();
    const value = addToMap(map, 'key', () => 42);

    expect(value).toBe(42);
    expect(map.get('key')).toBe(42);
  });

  it('should return existing value if key present', () => {
    const map = new Map<string, number>();
    map.set('key', 100);

    const value = addToMap(map, 'key', () => 42);

    expect(value).toBe(100);
    expect(map.get('key')).toBe(100);
  });

  it('should not call initial function if key present', () => {
    const map = new Map<string, number>();
    map.set('key', 100);

    let called = false;
    addToMap(map, 'key', () => {
      called = true;
      return 42;
    });

    expect(called).toBe(false);
  });

  it('should work with complex values', () => {
    const map = new Map<string, number[]>();
    const value = addToMap(map, 'key', () => [1, 2, 3]);

    expect(value).toEqual([1, 2, 3]);
    expect(map.get('key')).toEqual([1, 2, 3]);
  });
});

describe('isNonEmptyArray', () => {
  it('should return true for non-empty array', () => {
    expect(isNonEmptyArray([1, 2, 3])).toBe(true);
  });

  it('should return false for empty array', () => {
    expect(isNonEmptyArray([])).toBe(false);
  });

  it('should return true for array with one element', () => {
    expect(isNonEmptyArray([1])).toBe(true);
  });

  it('should narrow type correctly', () => {
    const arr: number[] = [1, 2, 3];

    if (isNonEmptyArray(arr)) {
      // Type should be narrowed to [number, ...number[]]
      const first: number = arr[0];
      expect(first).toBe(1);
    }
  });
});

describe('isPositiveInteger', () => {
  it('should return true for positive integers', () => {
    expect(isPositiveInteger(1)).toBe(true);
    expect(isPositiveInteger(100)).toBe(true);
  });

  it('should return false for zero', () => {
    expect(isPositiveInteger(0)).toBe(false);
  });

  it('should return false for negative integers', () => {
    expect(isPositiveInteger(-1)).toBe(false);
    expect(isPositiveInteger(-100)).toBe(false);
  });

  it('should return false for floats', () => {
    expect(isPositiveInteger(1.5)).toBe(false);
    expect(isPositiveInteger(0.1)).toBe(false);
  });

  it('should return false for NaN', () => {
    expect(isPositiveInteger(Number.NaN)).toBe(false);
  });

  it('should return false for Infinity', () => {
    expect(isPositiveInteger(Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe('isNumberInRange', () => {
  it('should return true for number within inclusive range', () => {
    expect(isNumberInRange(5, 1, 10)).toBe(true);
  });

  it('should return true for number at min boundary (inclusive)', () => {
    expect(isNumberInRange(1, 1, 10)).toBe(true);
  });

  it('should return true for number at max boundary (inclusive)', () => {
    expect(isNumberInRange(10, 1, 10)).toBe(true);
  });

  it('should return false for number below range', () => {
    expect(isNumberInRange(0, 1, 10)).toBe(false);
  });

  it('should return false for number above range', () => {
    expect(isNumberInRange(11, 1, 10)).toBe(false);
  });

  it('should exclude boundaries when inclusive=false', () => {
    expect(isNumberInRange(1, 1, 10, false)).toBe(false);
    expect(isNumberInRange(10, 1, 10, false)).toBe(false);
  });

  it('should return true for number within exclusive range', () => {
    expect(isNumberInRange(5, 1, 10, false)).toBe(true);
  });
});

describe('isFrequency', () => {
  it('should return true for valid frequencies', () => {
    expect(isFrequency(Frequencies.DAILY)).toBe(true);
    expect(isFrequency(Frequencies.WEEKLY)).toBe(true);
    expect(isFrequency(Frequencies.MONTHLY)).toBe(true);
    expect(isFrequency(Frequencies.YEARLY)).toBe(true);
  });

  it('should return true for frequency strings', () => {
    expect(isFrequency('DAILY')).toBe(true);
    expect(isFrequency('WEEKLY')).toBe(true);
  });

  it('should return false for invalid frequencies', () => {
    expect(isFrequency('INVALID')).toBe(false);
    expect(isFrequency('daily')).toBe(false); // lowercase
  });

  it('should return false for non-string values', () => {
    expect(isFrequency(123)).toBe(false);
    expect(isFrequency(null)).toBe(false);
    expect(isFrequency(undefined)).toBe(false);
    expect(isFrequency({})).toBe(false);
  });
});

describe('isWeekday', () => {
  it('should return true for valid weekdays', () => {
    expect(isWeekday(Weekdays.MO)).toBe(true);
    expect(isWeekday(Weekdays.TU)).toBe(true);
    expect(isWeekday(Weekdays.SU)).toBe(true);
  });

  it('should return true for weekday strings', () => {
    expect(isWeekday('MO')).toBe(true);
    expect(isWeekday('FR')).toBe(true);
  });

  it('should return false for invalid weekdays', () => {
    expect(isWeekday('MONDAY')).toBe(false);
    expect(isWeekday('mo')).toBe(false); // lowercase
  });

  it('should return false for non-string values', () => {
    expect(isWeekday(123)).toBe(false);
    expect(isWeekday(null)).toBe(false);
    expect(isWeekday(undefined)).toBe(false);
  });
});

describe('isWeekdayValue', () => {
  it('should return true for simple weekday strings', () => {
    expect(isWeekdayValue('MO')).toBe(true);
    expect(isWeekdayValue('FR')).toBe(true);
  });

  it('should return true for weekday objects with occurrence', () => {
    expect(isWeekdayValue({ weekday: 'MO', n: 1 })).toBe(true);
    expect(isWeekdayValue({ weekday: 'FR', n: -2 })).toBe(true);
  });

  it('should return false for invalid weekday strings', () => {
    expect(isWeekdayValue('MONDAY')).toBe(false);
    expect(isWeekdayValue('mo')).toBe(false);
  });

  it('should return false for weekday objects with invalid weekday', () => {
    expect(isWeekdayValue({ weekday: 'INVALID', n: 1 })).toBe(false);
  });

  it('should return false for weekday objects with out-of-range occurrence', () => {
    expect(isWeekdayValue({ weekday: 'MO', n: 53 })).toBe(false);
    expect(isWeekdayValue({ weekday: 'MO', n: -53 })).toBe(false);
  });

  it('should return false for null or undefined', () => {
    expect(isWeekdayValue(null)).toBe(false);
    expect(isWeekdayValue(undefined)).toBe(false);
  });

  it('should return false for numbers', () => {
    expect(isWeekdayValue(123)).toBe(false);
  });

  it('should return false for objects without required fields', () => {
    expect(isWeekdayValue({ weekday: 'MO' })).toBe(false);
    expect(isWeekdayValue({ n: 1 })).toBe(false);
  });
});

describe('uniqueWeekdayValues', () => {
  it('should remove duplicate simple weekdays', () => {
    const values = ['MO', 'TU', 'MO', 'WE'];
    const unique = uniqueWeekdayValues(values);

    expect(unique).toEqual(['MO', 'TU', 'WE']);
  });

  it('should remove duplicate weekday objects', () => {
    const values = [
      { weekday: 'MO' as const, n: 1 },
      { weekday: 'TU' as const, n: 2 },
      { weekday: 'MO' as const, n: 1 },
    ];
    const unique = uniqueWeekdayValues(values);

    expect(unique).toHaveLength(2);
    expect(unique[0]).toEqual({ weekday: 'MO', n: 1 });
    expect(unique[1]).toEqual({ weekday: 'TU', n: 2 });
  });

  it('should keep different occurrences of same weekday', () => {
    const values = [
      { weekday: 'MO' as const, n: 1 },
      { weekday: 'MO' as const, n: 2 },
    ];
    const unique = uniqueWeekdayValues(values);

    expect(unique).toHaveLength(2);
  });

  it('should handle mixed simple and object weekdays', () => {
    const values = ['MO', { weekday: 'MO' as const, n: 1 }, 'MO'];
    const unique = uniqueWeekdayValues(values);

    expect(unique).toHaveLength(2);
  });

  it('should handle empty array', () => {
    const unique = uniqueWeekdayValues([]);

    expect(unique).toEqual([]);
  });

  it('should preserve order of first occurrences', () => {
    const values = ['FR', 'MO', 'TU', 'MO', 'FR'];
    const unique = uniqueWeekdayValues(values);

    expect(unique).toEqual(['FR', 'MO', 'TU']);
  });
});
