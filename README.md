# RRule

[![npm version](https://img.shields.io/npm/v/@martinhipp/rrule.svg)](https://www.npmjs.com/package/@martinhipp/rrule)
[![CI](https://github.com/martinhipp/rrule/actions/workflows/ci.yml/badge.svg)](https://github.com/martinhipp/rrule/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/martinhipp/rrule/graph/badge.svg?token=E7222UGF0A)](https://codecov.io/gh/martinhipp/rrule)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node: >=20](https://img.shields.io/badge/Node-%3E%3D20-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**RFC 5545 compliant** TypeScript library for parsing, generating, and working with iCalendar recurrence rules.

## ✨ Features

- 🎯 **RFC 5545 recurrence rules** - Passes all 33 RFC examples
- 📅 **All frequencies supported** - YEARLY, MONTHLY, WEEKLY, DAILY, HOURLY, MINUTELY, SECONDLY
- 🔄 **Complete BY\* rule support** - BYMONTH, BYDAY, BYMONTHDAY, BYYEARDAY, BYWEEKNO, BYSETPOS, and more
- 🌍 **Timezone support** - Via [@internationalized/date](https://react-spectrum.adobe.com/internationalized/date/)
- 📦 **TypeScript-first** - Full type safety with IntelliSense
- 🧪 **Well tested** - Comprehensive test suite with high code coverage

## 📦 Installation

```bash
npm install @martinhipp/rrule
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { RRule, Frequencies } from '@martinhipp/rrule';
import { CalendarDate } from '@internationalized/date';

// Create a daily recurrence for 10 days
const rrule = new RRule({
  freq: Frequencies.DAILY,
  count: 10,
  dtstart: new CalendarDate(2025, 1, 1)
});

// Generate all occurrences
const dates = rrule.all();
console.log(dates);
// [CalendarDate(2025-01-01), CalendarDate(2025-01-02), ...]

// Convert to string
console.log(rrule.toString());
// "RRULE:FREQ=DAILY;COUNT=10"
```

### Parsing RRULE Strings

```typescript
import { RRule } from '@martinhipp/rrule';

// Parse from RRULE string with DTSTART
const rrule = RRule.fromString(`
  DTSTART:20250101T090000Z
  RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10
`);

const dates = rrule.all();
// Generates 10 occurrences on Mon, Wed, Fri starting Jan 1, 2025
```

### Advanced: Complex Recurrence Rules

```typescript
import { RRule, Frequencies, Weekdays } from '@martinhipp/rrule';
import { CalendarDate } from '@internationalized/date';

// Every 2nd Monday of each month for a year
const rrule = new RRule({
  freq: Frequencies.MONTHLY,
  byweekday: [{ weekday: Weekdays.MO, n: 2 }],
  dtstart: new CalendarDate(2025, 1, 1),
  until: new CalendarDate(2025, 12, 31)
});

// Last Friday of every month
const lastFriday = new RRule({
  freq: Frequencies.MONTHLY,
  byweekday: [{ weekday: Weekdays.FR, n: -1 }],
  dtstart: new CalendarDate(2025, 1, 1),
  count: 12
});
```

## 📚 API Reference

### RRule Class

#### Constructor

```typescript
new RRule(options: RRuleOptions)
```

#### Static Methods

- `RRule.fromString(icsString: string, strict?: boolean): RRule` - Parse from ICS format

#### Instance Methods

- `all(limit?: number): DateValue[]` - Generate all occurrences
- `between(start: DateValue, end: DateValue, inclusive?: boolean): DateValue[]` - Get occurrences in range
- `before(date: DateValue, inclusive?: boolean, limit?: number): DateValue[]` - Get occurrences before date
- `after(date: DateValue, inclusive?: boolean, limit?: number): DateValue[]` - Get occurrences after date
- `previous(date: DateValue, inclusive?: boolean): DateValue | undefined` - Get last occurrence before date
- `next(date: DateValue, inclusive?: boolean): DateValue | undefined` - Get first occurrence after date
- `toString(): string` - Convert to RRULE string
- `clone(overrides?: RRuleOptions): RRule` - Clone with optional overrides
- `setOptions(options: RRuleOptions): void` - Update options

#### Iterator Support

```typescript
// Use as an iterator
for (const date of rrule) {
  console.log(date);
}

// Or convert to array
const dates = [...rrule];
```

**⚠️ Important: Infinite Recurrence Protection**

When using `.all()`, iterators, or any method without `count` or `until`, the library has a **default maximum iteration limit of 10,000** to prevent infinite loops. If you need more occurrences:

```typescript
const rrule = new RRule({
  freq: Frequencies.DAILY,
  dtstart: new CalendarDate(2025, 1, 1)
  // No count or until - potentially infinite!
});

// This will throw after 10,000 iterations
// rrule.all(); // ❌ Error: Max iterations exceeded

// Instead, use a limit:
const dates = rrule.all(100); // ✅ Get first 100 occurrences

// Or set a higher maxIterations:
rrule.maxIterations = 50000;
const manyDates = rrule.all(20000); // ✅ Now can generate up to 50,000

// Or add count/until to your rule:
const bounded = new RRule({
  freq: Frequencies.DAILY,
  dtstart: new CalendarDate(2025, 1, 1),
  count: 365 // ✅ Bounded recurrence
});
```

### RRuleOptions

```typescript
interface RRuleOptions {
  freq?: Frequency;             // Frequency (default: YEARLY) - YEARLY, MONTHLY, WEEKLY, DAILY, HOURLY, MINUTELY, SECONDLY
  dtstart?: DateValue;          // Start date
  interval?: number;            // Interval between occurrences (default: 1)
  count?: number;               // Number of occurrences (mutually exclusive with until)
  until?: DateValue;            // End date (mutually exclusive with count)
  wkst?: Weekday;               // Week start day (default: Monday)
  bymonth?: number[];           // Months (1-12)
  bymonthday?: number[];        // Days of month (1-31, negative for end of month)
  byyearday?: number[];         // Days of year (1-366, negative for end of year)
  byweekno?: number[];          // ISO week numbers (1-53)
  byweekday?: WeekdayValue[];   // Weekdays (with optional occurrence: {weekday: 'MO', n: 1})
  byhour?: number[];            // Hours (0-23)
  byminute?: number[];          // Minutes (0-59)
  bysecond?: number[];          // Seconds (0-59)
  bysetpos?: number[];          // Positions to keep from expanded set
}
```

### Frequencies

Import and use the `Frequencies` constant to avoid typos and get autocomplete:

```typescript
import { Frequencies } from '@martinhipp/rrule';

// Available frequencies:
Frequencies.YEARLY     // 'YEARLY'
Frequencies.MONTHLY    // 'MONTHLY'
Frequencies.WEEKLY     // 'WEEKLY'
Frequencies.DAILY      // 'DAILY'
Frequencies.HOURLY     // 'HOURLY'
Frequencies.MINUTELY   // 'MINUTELY'
Frequencies.SECONDLY   // 'SECONDLY'
```

**Example usage:**

```typescript
import { RRule, Frequencies } from '@martinhipp/rrule';
import { CalendarDate } from '@internationalized/date';

const daily = new RRule({
  freq: Frequencies.DAILY,  // ✅ Type-safe with autocomplete
  dtstart: new CalendarDate(2025, 1, 1),
  count: 10
});

// You can also use string literals:
const weekly = new RRule({
  freq: 'WEEKLY',  // ✅ Also valid
  dtstart: new CalendarDate(2025, 1, 1),
  count: 10
});
```

### Weekdays

Import and use the `Weekdays` constant for type-safe weekday references:

```typescript
import { Weekdays } from '@martinhipp/rrule';

// Available weekdays:
Weekdays.MO  // 'MO' - Monday
Weekdays.TU  // 'TU' - Tuesday
Weekdays.WE  // 'WE' - Wednesday
Weekdays.TH  // 'TH' - Thursday
Weekdays.FR  // 'FR' - Friday
Weekdays.SA  // 'SA' - Saturday
Weekdays.SU  // 'SU' - Sunday
```

**Example usage:**

```typescript
import { RRule, Frequencies, Weekdays } from '@martinhipp/rrule';
import { CalendarDate } from '@internationalized/date';

// Simple weekday filter
const weekdaysOnly = new RRule({
  freq: Frequencies.WEEKLY,
  byweekday: [Weekdays.MO, Weekdays.TU, Weekdays.WE, Weekdays.TH, Weekdays.FR],
  dtstart: new CalendarDate(2025, 1, 1),
  count: 10
});

// With occurrence numbers (2nd Monday, last Friday)
const complexWeekdays = new RRule({
  freq: Frequencies.MONTHLY,
  byweekday: [
    { weekday: Weekdays.MO, n: 2 },   // 2nd Monday
    { weekday: Weekdays.FR, n: -1 }   // Last Friday
  ],
  dtstart: new CalendarDate(2025, 1, 1),
  count: 12
});

// You can also use string literals:
const stringWeekdays = new RRule({
  freq: Frequencies.WEEKLY,
  byweekday: ['MO', 'WE', 'FR'],  // ✅ Also valid
  dtstart: new CalendarDate(2025, 1, 1),
  count: 10
});
```

## 📖 Examples

### Every Weekday (Mon-Fri)

```typescript
import { RRule, Frequencies, Weekdays } from '@martinhipp/rrule';
import { CalendarDate } from '@internationalized/date';

const rrule = new RRule({
  freq: Frequencies.WEEKLY,
  byweekday: [Weekdays.MO, Weekdays.TU, Weekdays.WE, Weekdays.TH, Weekdays.FR],
  dtstart: new CalendarDate(2025, 1, 1),
  count: 20
});
```

### Every 2 Weeks on Tuesday and Thursday

```typescript
const rrule = new RRule({
  freq: Frequencies.WEEKLY,
  interval: 2,
  byweekday: [Weekdays.TU, Weekdays.TH],
  dtstart: new CalendarDate(2025, 1, 1),
  count: 10
});
```

### Last Day of Each Month

```typescript
const rrule = new RRule({
  freq: Frequencies.MONTHLY,
  bymonthday: [-1],
  dtstart: new CalendarDate(2025, 1, 1),
  count: 12
});
```

### Every 3 Months

```typescript
const rrule = new RRule({
  freq: Frequencies.MONTHLY,
  interval: 3,
  dtstart: new CalendarDate(2025, 1, 1),
  count: 8
});
```

### With Timezone

```typescript
import { ZonedDateTime } from '@internationalized/date';

const rrule = new RRule({
  freq: Frequencies.DAILY,
  dtstart: new ZonedDateTime(2025, 1, 1, 'America/New_York', -18000000, 9, 0, 0),
  count: 10
});
```

### Using Iterator Methods

```typescript
const rrule = new RRule({
  freq: Frequencies.DAILY,
  dtstart: new CalendarDate(2025, 1, 1),
  count: 100
});

// Get next occurrence after a specific date
const next = rrule.next(new CalendarDate(2025, 1, 15));

// Get previous occurrence before a specific date
const prev = rrule.previous(new CalendarDate(2025, 1, 15));

// Get all occurrences between two dates
const range = rrule.between(
  new CalendarDate(2025, 1, 10),
  new CalendarDate(2025, 1, 20)
);

// Get 5 occurrences after a date
const after = rrule.after(new CalendarDate(2025, 1, 10), false, 5);
```

## 🧪 Testing

The library includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🏗️ Development

```bash
# Install dependencies
npm install

# Run type checking
npm run typecheck

# Lint code
npm run lint

# Format code
npm run format

# Build library
npm run build
```

## 📋 RFC 5545 Compliance

This library implements the [RFC 5545](https://tools.ietf.org/html/rfc5545) specification for recurrence rules. All 33 examples from the specification pass, and the library handles all required features including edge cases.

### Supported Features

#### Frequencies
- ✅ YEARLY
- ✅ MONTHLY
- ✅ WEEKLY
- ✅ DAILY
- ✅ HOURLY
- ✅ MINUTELY
- ✅ SECONDLY

#### BY* Rules
- ✅ BYMONTH - Filter by month
- ✅ BYWEEKNO - Filter by ISO week number
- ✅ BYYEARDAY - Filter by day of year
- ✅ BYMONTHDAY - Filter by day of month
- ✅ BYDAY (BYWEEKDAY) - Filter by weekday (with ordinal support)
- ✅ BYHOUR - Filter by hour
- ✅ BYMINUTE - Filter by minute
- ✅ BYSECOND - Filter by second
- ✅ BYSETPOS - Limit occurrences by position

#### Other Features
- ✅ INTERVAL - Occurrence interval
- ✅ COUNT - Limit number of occurrences
- ✅ UNTIL - End date for recurrence
- ✅ WKST - Week start day
- ✅ DTSTART - Start date/time
- ✅ Timezone support (via ZonedDateTime)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- Built with [@internationalized/date](https://react-spectrum.adobe.com/internationalized/date/) for robust date/time handling
- Inspired by [rrule.js](https://github.com/jkbrzt/rrule) and [rrule-temporal](https://github.com/ggaabe/rrule-temporal)
- RFC 5545 specification: [https://tools.ietf.org/html/rfc5545](https://tools.ietf.org/html/rfc5545)
