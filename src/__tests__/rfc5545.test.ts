import { parseDateTime } from '@internationalized/date';
import { describe, expect, it } from 'vitest';
import { RRule } from '../rrule';

/**
 * RFC 5545 Compliance Tests
 * Based on examples from Section 3.8.5.3 (Recurrence Rule Examples)
 *
 * These tests validate that our RRule implementation matches the RFC 5545 specification.
 * Each test case includes:
 * - DTSTART: The start date/time
 * - RRULE: The recurrence rule string
 * - Expected: The expected occurrences
 *
 * Note: Timezone handling is simplified - tests use CalendarDateTime without timezone awareness.
 * Full timezone support would require ZonedDateTime from @internationalized/date.
 *
 * ## Currently Supported Features (tests enabled):
 * - ✅ FREQ: DAILY, WEEKLY, MONTHLY, YEARLY, HOURLY, MINUTELY, SECONDLY
 * - ✅ INTERVAL, COUNT, UNTIL
 * - ✅ BYDAY (BYWEEKDAY) - simple and with ordinals (+1MO, -1FR)
 * - ✅ BYMONTHDAY - positive and negative
 * - ✅ BYMONTH
 * - ✅ BYYEARDAY - day of year (1-366), with leap year support
 * - ✅ BYSETPOS
 * - ✅ WKST (week start)
 *
 * ## Not Yet Implemented (tests skipped):
 * - ⏭ BYWEEKNO - week number of year (ISO week dates)
 * - ⏭ Complex BYDAY + BYMONTHDAY combinations (Friday the 13th, etc.)
 * - ⏭ Some edge cases with BYSETPOS
 *
 * Most common recurrence patterns are fully supported!
 */

/**
 * Helper to create CalendarDateTime from ISO string
 */
const dt = (iso: string) => parseDateTime(iso);

describe('RFC 5545 - Daily Recurrence Rules', () => {
  it('Daily for 10 occurrences', () => {
    // DTSTART;TZID=America/New_York:19970902T090000
    // RRULE:FREQ=DAILY;COUNT=10
    // ==> (1997 9:00 AM EDT) September 2-11

    const rule = RRule.fromString(`
      DTSTART:19970902T090000
      RRULE:FREQ=DAILY;COUNT=10
    `);

    const occurrences = rule.all();

    expect(occurrences).toEqual([
      dt('1997-09-02T09:00:00'),
      dt('1997-09-03T09:00:00'),
      dt('1997-09-04T09:00:00'),
      dt('1997-09-05T09:00:00'),
      dt('1997-09-06T09:00:00'),
      dt('1997-09-07T09:00:00'),
      dt('1997-09-08T09:00:00'),
      dt('1997-09-09T09:00:00'),
      dt('1997-09-10T09:00:00'),
      dt('1997-09-11T09:00:00'),
    ]);
  });

  it('Daily until December 24, 1997', () => {
    // DTSTART;TZID=America/New_York:19970902T090000
    // RRULE:FREQ=DAILY;UNTIL=19971224T000000Z

    const rule = RRule.fromString(`
      DTSTART:19970902T090000
      RRULE:FREQ=DAILY;UNTIL=19971224T000000
    `);

    const occurrences = rule.all();

    // Should generate daily occurrences from Sept 2 to Dec 23, 1997
    // Note: UNTIL in RFC is actually 00:00 UTC on Dec 24, which could be Dec 23 in EDT
    // Our implementation generates Sept 2 - Dec 23 = 113 occurrences
    expect(occurrences).toHaveLength(113);
    expect(occurrences[0]).toEqual(dt('1997-09-02T09:00:00'));
    expect(occurrences[occurrences.length - 1]).toEqual(
      dt('1997-12-23T09:00:00'),
    );
  });

  it('Every other day - first 10 occurrences', () => {
    // DTSTART;TZID=America/New_York:19970902T090000
    // RRULE:FREQ=DAILY;INTERVAL=2
    // ==> (1997 9:00 AM EDT) September 2,4,6,8,10,12,14,16,18,20...

    const rule = RRule.fromString(`
      DTSTART:19970902T090000
      RRULE:FREQ=DAILY;INTERVAL=2;COUNT=10
    `);

    const occurrences = rule.all();

    expect(occurrences).toEqual([
      dt('1997-09-02T09:00:00'),
      dt('1997-09-04T09:00:00'),
      dt('1997-09-06T09:00:00'),
      dt('1997-09-08T09:00:00'),
      dt('1997-09-10T09:00:00'),
      dt('1997-09-12T09:00:00'),
      dt('1997-09-14T09:00:00'),
      dt('1997-09-16T09:00:00'),
      dt('1997-09-18T09:00:00'),
      dt('1997-09-20T09:00:00'),
    ]);
  });

  it('Every 10 days, 5 occurrences', () => {
    // DTSTART;TZID=America/New_York:19970902T090000
    // RRULE:FREQ=DAILY;INTERVAL=10;COUNT=5
    // ==> (1997 9:00 AM EDT) September 2,12,22; October 2,12

    const rule = RRule.fromString(`
      DTSTART:19970902T090000
      RRULE:FREQ=DAILY;INTERVAL=10;COUNT=5
    `);

    const occurrences = rule.all();

    expect(occurrences).toEqual([
      dt('1997-09-02T09:00:00'),
      dt('1997-09-12T09:00:00'),
      dt('1997-09-22T09:00:00'),
      dt('1997-10-02T09:00:00'),
      dt('1997-10-12T09:00:00'),
    ]);
  });
});

describe('RFC 5545 - Weekly Recurrence Rules', () => {
  it('Weekly for 10 occurrences', () => {
    const rule = RRule.fromString(`
      DTSTART:19970902T090000
      RRULE:FREQ=WEEKLY;COUNT=10
    `);

    const occurrences = rule.all();

    expect(occurrences).toEqual([
      dt('1997-09-02T09:00:00'),
      dt('1997-09-09T09:00:00'),
      dt('1997-09-16T09:00:00'),
      dt('1997-09-23T09:00:00'),
      dt('1997-09-30T09:00:00'),
      dt('1997-10-07T09:00:00'),
      dt('1997-10-14T09:00:00'),
      dt('1997-10-21T09:00:00'),
      dt('1997-10-28T09:00:00'),
      dt('1997-11-04T09:00:00'),
    ]);
  });

  it('Weekly until December 24, 1997', () => {
    const rule = RRule.fromString(`
      DTSTART:19970902T090000
      RRULE:FREQ=WEEKLY;UNTIL=19971224T000000Z
    `);

    const occurrences = rule.all();

    // Tuesdays from Sept 2 to Dec 23, 1997 (17 occurrences)
    expect(occurrences.length).toBe(17);
    expect(occurrences[0]).toEqual(dt('1997-09-02T09:00:00'));
    expect(occurrences[occurrences.length - 1]).toEqual(
      dt('1997-12-23T09:00:00'),
    );
  });

  it('Every other week - first 10 occurrences', () => {
    const rule = RRule.fromString(`
      DTSTART:19970902T090000
      RRULE:FREQ=WEEKLY;INTERVAL=2;WKST=SU;COUNT=10
    `);

    const occurrences = rule.all();

    expect(occurrences).toEqual([
      dt('1997-09-02T09:00:00'),
      dt('1997-09-16T09:00:00'),
      dt('1997-09-30T09:00:00'),
      dt('1997-10-14T09:00:00'),
      dt('1997-10-28T09:00:00'),
      dt('1997-11-11T09:00:00'),
      dt('1997-11-25T09:00:00'),
      dt('1997-12-09T09:00:00'),
      dt('1997-12-23T09:00:00'),
      dt('1998-01-06T09:00:00'),
    ]);
  });

  it('Weekly on Tuesday and Thursday for 10 occurrences', () => {
    const rule = RRule.fromString(`
      DTSTART:19970902T090000
      RRULE:FREQ=WEEKLY;COUNT=10;WKST=SU;BYDAY=TU,TH
    `);

    const occurrences = rule.all();

    expect(occurrences).toEqual([
      dt('1997-09-02T09:00:00'),
      dt('1997-09-04T09:00:00'),
      dt('1997-09-09T09:00:00'),
      dt('1997-09-11T09:00:00'),
      dt('1997-09-16T09:00:00'),
      dt('1997-09-18T09:00:00'),
      dt('1997-09-23T09:00:00'),
      dt('1997-09-25T09:00:00'),
      dt('1997-09-30T09:00:00'),
      dt('1997-10-02T09:00:00'),
    ]);
  });

  it('Every other week on Tuesday and Thursday, for 8 occurrences', () => {
    const rule = RRule.fromString(`
      DTSTART:19970902T090000
      RRULE:FREQ=WEEKLY;INTERVAL=2;COUNT=8;WKST=SU;BYDAY=TU,TH
    `);

    const occurrences = rule.all();

    expect(occurrences).toEqual([
      dt('1997-09-02T09:00:00'),
      dt('1997-09-04T09:00:00'),
      dt('1997-09-16T09:00:00'),
      dt('1997-09-18T09:00:00'),
      dt('1997-09-30T09:00:00'),
      dt('1997-10-02T09:00:00'),
      dt('1997-10-14T09:00:00'),
      dt('1997-10-16T09:00:00'),
    ]);
  });
});

describe('RFC 5545 - Monthly Recurrence Rules', () => {
  it('Monthly on the first Friday for 10 occurrences', () => {
    // DTSTART;TZID=America/New_York:19970905T090000
    // RRULE:FREQ=MONTHLY;COUNT=10;BYDAY=1FR
    // ==> (1997 9:00 AM EDT) September 5;October 3;November 7;December 5;
    //     (1998) January 2;February 6;March 6;April 3;May 1;June 5

    const rule = RRule.fromString(`
      DTSTART:19970905T090000
      RRULE:FREQ=MONTHLY;COUNT=10;BYDAY=1FR
    `);

    const occurrences = rule.all();

    expect(occurrences).toEqual([
      dt('1997-09-05T09:00:00'),
      dt('1997-10-03T09:00:00'),
      dt('1997-11-07T09:00:00'),
      dt('1997-12-05T09:00:00'),
      dt('1998-01-02T09:00:00'),
      dt('1998-02-06T09:00:00'),
      dt('1998-03-06T09:00:00'),
      dt('1998-04-03T09:00:00'),
      dt('1998-05-01T09:00:00'),
      dt('1998-06-05T09:00:00'),
    ]);
  });

  it('Every other month on the 1st and last Sunday for 10 occurrences', () => {
    // DTSTART;TZID=America/New_York:19970907T090000
    // RRULE:FREQ=MONTHLY;INTERVAL=2;COUNT=10;BYDAY=1SU,-1SU
    // ==> (1997 9:00 AM EDT) September 7,28;November 2,30;
    //     (1998) January 4,25;March 1,29;May 3,31

    const rule = RRule.fromString(`
      DTSTART:19970907T090000
      RRULE:FREQ=MONTHLY;INTERVAL=2;COUNT=10;BYDAY=1SU,-1SU
    `);

    const occurrences = rule.all();

    expect(occurrences).toEqual([
      dt('1997-09-07T09:00:00'),
      dt('1997-09-28T09:00:00'),
      dt('1997-11-02T09:00:00'),
      dt('1997-11-30T09:00:00'),
      dt('1998-01-04T09:00:00'),
      dt('1998-01-25T09:00:00'),
      dt('1998-03-01T09:00:00'),
      dt('1998-03-29T09:00:00'),
      dt('1998-05-03T09:00:00'),
      dt('1998-05-31T09:00:00'),
    ]);
  });

  it('Monthly on the second-to-last Monday for 6 occurrences', () => {
    // DTSTART;TZID=America/New_York:19970922T090000
    // RRULE:FREQ=MONTHLY;COUNT=6;BYDAY=-2MO
    // ==> (1997 9:00 AM EDT) September 22;October 20;November 17;December 22;
    //     (1998) January 19;February 16

    const rule = RRule.fromString(`
      DTSTART:19970922T090000
      RRULE:FREQ=MONTHLY;COUNT=6;BYDAY=-2MO
    `);

    const occurrences = rule.all();

    expect(occurrences).toEqual([
      dt('1997-09-22T09:00:00'),
      dt('1997-10-20T09:00:00'),
      dt('1997-11-17T09:00:00'),
      dt('1997-12-22T09:00:00'),
      dt('1998-01-19T09:00:00'),
      dt('1998-02-16T09:00:00'),
    ]);
  });

  it('Monthly on the third-to-the-last day - first 10 occurrences', () => {
    // DTSTART;TZID=America/New_York:19970928T090000
    // RRULE:FREQ=MONTHLY;BYMONTHDAY=-3
    // ==> (1997 9:00 AM EDT) September 28;October 29;November 28;December 29;
    //     (1998) January 29;February 26;...

    const rule = RRule.fromString(`
      DTSTART:19970928T090000
      RRULE:FREQ=MONTHLY;BYMONTHDAY=-3;COUNT=10
    `);

    const occurrences = rule.all();

    expect(occurrences).toEqual([
      dt('1997-09-28T09:00:00'),
      dt('1997-10-29T09:00:00'),
      dt('1997-11-28T09:00:00'),
      dt('1997-12-29T09:00:00'),
      dt('1998-01-29T09:00:00'),
      dt('1998-02-26T09:00:00'),
      dt('1998-03-29T09:00:00'),
      dt('1998-04-28T09:00:00'),
      dt('1998-05-29T09:00:00'),
      dt('1998-06-28T09:00:00'),
    ]);
  });

  it('Monthly on the 2nd and 15th for 10 occurrences', () => {
    // DTSTART;TZID=America/New_York:19970902T090000
    // RRULE:FREQ=MONTHLY;COUNT=10;BYMONTHDAY=2,15
    // ==> (1997 9:00 AM EDT) September 2,15;October 2,15;November 2,15;December 2,15;
    //     (1998) January 2,15

    const rule = RRule.fromString(`
      DTSTART:19970902T090000
      RRULE:FREQ=MONTHLY;COUNT=10;BYMONTHDAY=2,15
    `);

    const occurrences = rule.all();

    expect(occurrences).toEqual([
      dt('1997-09-02T09:00:00'),
      dt('1997-09-15T09:00:00'),
      dt('1997-10-02T09:00:00'),
      dt('1997-10-15T09:00:00'),
      dt('1997-11-02T09:00:00'),
      dt('1997-11-15T09:00:00'),
      dt('1997-12-02T09:00:00'),
      dt('1997-12-15T09:00:00'),
      dt('1998-01-02T09:00:00'),
      dt('1998-01-15T09:00:00'),
    ]);
  });

  it('Monthly on the 1st and last day for 10 occurrences', () => {
    // DTSTART;TZID=America/New_York:19970930T090000
    // RRULE:FREQ=MONTHLY;COUNT=10;BYMONTHDAY=1,-1
    // ==> (1997 9:00 AM EDT) September 30;October 1,31;November 1,30;December 1,31;
    //     (1998) January 1,31;February 1

    const rule = RRule.fromString(`
      DTSTART:19970930T090000
      RRULE:FREQ=MONTHLY;COUNT=10;BYMONTHDAY=1,-1
    `);

    const occurrences = rule.all();

    expect(occurrences).toEqual([
      dt('1997-09-30T09:00:00'),
      dt('1997-10-01T09:00:00'),
      dt('1997-10-31T09:00:00'),
      dt('1997-11-01T09:00:00'),
      dt('1997-11-30T09:00:00'),
      dt('1997-12-01T09:00:00'),
      dt('1997-12-31T09:00:00'),
      dt('1998-01-01T09:00:00'),
      dt('1998-01-31T09:00:00'),
      dt('1998-02-01T09:00:00'),
    ]);
  });

  it('Every 18 months on days 10,11,12,13,14,15 for 10 occurrences', () => {
    // DTSTART;TZID=America/New_York:19970910T090000
    // RRULE:FREQ=MONTHLY;INTERVAL=18;COUNT=10;BYMONTHDAY=10,11,12,13,14,15
    // ==> (1997 9:00 AM EDT) September 10,11,12,13,14,15;
    //     (1999 9:00 AM EST) March 10,11,12,13

    const rule = RRule.fromString(`
      DTSTART:19970910T090000
      RRULE:FREQ=MONTHLY;INTERVAL=18;COUNT=10;BYMONTHDAY=10,11,12,13,14,15
    `);

    const occurrences = rule.all();

    expect(occurrences).toEqual([
      dt('1997-09-10T09:00:00'),
      dt('1997-09-11T09:00:00'),
      dt('1997-09-12T09:00:00'),
      dt('1997-09-13T09:00:00'),
      dt('1997-09-14T09:00:00'),
      dt('1997-09-15T09:00:00'),
      dt('1999-03-10T09:00:00'),
      dt('1999-03-11T09:00:00'),
      dt('1999-03-12T09:00:00'),
      dt('1999-03-13T09:00:00'),
    ]);
  });

  it('Every Tuesday, every other month', () => {
    const rule = RRule.fromString(`
      DTSTART:19970902T090000
      RRULE:FREQ=MONTHLY;INTERVAL=2;BYDAY=TU
    `);

    const occurrences = rule.all(18);

    expect(occurrences).toEqual([
      dt('1997-09-02T09:00:00'),
      dt('1997-09-09T09:00:00'),
      dt('1997-09-16T09:00:00'),
      dt('1997-09-23T09:00:00'),
      dt('1997-09-30T09:00:00'),
      dt('1997-11-04T09:00:00'),
      dt('1997-11-11T09:00:00'),
      dt('1997-11-18T09:00:00'),
      dt('1997-11-25T09:00:00'),
      dt('1998-01-06T09:00:00'),
      dt('1998-01-13T09:00:00'),
      dt('1998-01-20T09:00:00'),
      dt('1998-01-27T09:00:00'),
      dt('1998-03-03T09:00:00'),
      dt('1998-03-10T09:00:00'),
      dt('1998-03-17T09:00:00'),
      dt('1998-03-24T09:00:00'),
      dt('1998-03-31T09:00:00'),
    ]);
  });
});

describe('RFC 5545 - Yearly Recurrence Rules', () => {
  it('Yearly in June and July for 10 occurrences', () => {
    // DTSTART;TZID=America/New_York:19970610T090000
    // RRULE:FREQ=YEARLY;COUNT=10;BYMONTH=6,7
    // ==> (1997 9:00 AM EDT) June 10;July 10;
    //     (1998 9:00 AM EDT) June 10;July 10;
    //     (1999 9:00 AM EDT) June 10;July 10;
    //     (2000 9:00 AM EDT) June 10;July 10;
    //     (2001 9:00 AM EDT) June 10;July 10

    const rule = RRule.fromString(`
      DTSTART:19970610T090000
      RRULE:FREQ=YEARLY;COUNT=10;BYMONTH=6,7
    `);

    const occurrences = rule.all();

    expect(occurrences).toEqual([
      dt('1997-06-10T09:00:00'),
      dt('1997-07-10T09:00:00'),
      dt('1998-06-10T09:00:00'),
      dt('1998-07-10T09:00:00'),
      dt('1999-06-10T09:00:00'),
      dt('1999-07-10T09:00:00'),
      dt('2000-06-10T09:00:00'),
      dt('2000-07-10T09:00:00'),
      dt('2001-06-10T09:00:00'),
      dt('2001-07-10T09:00:00'),
    ]);
  });

  it('Every other year in January, February, March for 10 occurrences', () => {
    // DTSTART;TZID=America/New_York:19970310T090000
    // RRULE:FREQ=YEARLY;INTERVAL=2;COUNT=10;BYMONTH=1,2,3
    // ==> (1997 9:00 AM EST) March 10;
    //     (1999 9:00 AM EST) January 10;February 10;March 10;
    //     (2001 9:00 AM EST) January 10;February 10;March 10;
    //     (2003 9:00 AM EST) January 10;February 10;March 10

    const rule = RRule.fromString(`
      DTSTART:19970310T090000
      RRULE:FREQ=YEARLY;INTERVAL=2;COUNT=10;BYMONTH=1,2,3
    `);

    const occurrences = rule.all();

    expect(occurrences).toEqual([
      dt('1997-03-10T09:00:00'),
      dt('1999-01-10T09:00:00'),
      dt('1999-02-10T09:00:00'),
      dt('1999-03-10T09:00:00'),
      dt('2001-01-10T09:00:00'),
      dt('2001-02-10T09:00:00'),
      dt('2001-03-10T09:00:00'),
      dt('2003-01-10T09:00:00'),
      dt('2003-02-10T09:00:00'),
      dt('2003-03-10T09:00:00'),
    ]);
  });

  it('Every 3rd year on the 1st, 100th, 200th day for 10 occurrences', () => {
    // DTSTART;TZID=America/New_York:19970101T090000
    // RRULE:FREQ=YEARLY;INTERVAL=3;COUNT=10;BYYEARDAY=1,100,200
    // ==> (1997 9:00 AM EST) January 1;April 10;July 19;
    //     (2000 9:00 AM EST) January 1;April 9;July 18;
    //     (2003 9:00 AM EST) January 1;April 10;July 19;
    //     (2006 9:00 AM EST) January 1

    const rule = RRule.fromString(`
      DTSTART:19970101T090000
      RRULE:FREQ=YEARLY;INTERVAL=3;COUNT=10;BYYEARDAY=1,100,200
    `);

    const occurrences = rule.all();

    expect(occurrences).toEqual([
      dt('1997-01-01T09:00:00'),
      dt('1997-04-10T09:00:00'),
      dt('1997-07-19T09:00:00'),
      dt('2000-01-01T09:00:00'),
      dt('2000-04-09T09:00:00'), // Leap year: day 100 is Apr 9
      dt('2000-07-18T09:00:00'), // Leap year: day 200 is Jul 18
      dt('2003-01-01T09:00:00'),
      dt('2003-04-10T09:00:00'),
      dt('2003-07-19T09:00:00'),
      dt('2006-01-01T09:00:00'),
    ]);
  });

  it('Every 20th Monday of the year, forever', () => {
    const rule = RRule.fromString(`
      DTSTART:19970519T090000
      RRULE:FREQ=YEARLY;BYDAY=20MO
    `);

    const occurrences = rule.all(5);

    expect(occurrences).toEqual([
      dt('1997-05-19T09:00:00'),
      dt('1998-05-18T09:00:00'),
      dt('1999-05-17T09:00:00'),
      dt('2000-05-15T09:00:00'),
      dt('2001-05-14T09:00:00'),
    ]);
  });

  it('Monday of week 20 (where the default start of week is Monday), forever', () => {
    const rule = RRule.fromString(`
      DTSTART:19970512T090000
      RRULE:FREQ=YEARLY;BYWEEKNO=20;BYDAY=MO
    `);

    const occurrences = rule.all(5);

    expect(occurrences).toEqual([
      dt('1997-05-12T09:00:00'),
      dt('1998-05-11T09:00:00'),
      dt('1999-05-17T09:00:00'),
      dt('2000-05-15T09:00:00'),
      dt('2001-05-14T09:00:00'),
    ]);
  });

  it('Every Thursday in March, forever', () => {
    const rule = RRule.fromString(`
      DTSTART:19970313T090000
      RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=TH
    `);

    const occurrences = rule.all(11);

    expect(occurrences).toEqual([
      dt('1997-03-13T09:00:00'),
      dt('1997-03-20T09:00:00'),
      dt('1997-03-27T09:00:00'),
      dt('1998-03-05T09:00:00'),
      dt('1998-03-12T09:00:00'),
      dt('1998-03-19T09:00:00'),
      dt('1998-03-26T09:00:00'),
      dt('1999-03-04T09:00:00'),
      dt('1999-03-11T09:00:00'),
      dt('1999-03-18T09:00:00'),
      dt('1999-03-25T09:00:00'),
    ]);
  });

  it('Every Thursday, but only in June, July, August, forever', () => {
    const rule = RRule.fromString(`
      DTSTART:19970605T090000
      RRULE:FREQ=YEARLY;BYDAY=TH;BYMONTH=6,7,8
    `);

    const occurrences = rule.all(39);

    expect(occurrences).toEqual([
      dt('1997-06-05T09:00:00'),
      dt('1997-06-12T09:00:00'),
      dt('1997-06-19T09:00:00'),
      dt('1997-06-26T09:00:00'),
      dt('1997-07-03T09:00:00'),
      dt('1997-07-10T09:00:00'),
      dt('1997-07-17T09:00:00'),
      dt('1997-07-24T09:00:00'),
      dt('1997-07-31T09:00:00'),
      dt('1997-08-07T09:00:00'),
      dt('1997-08-14T09:00:00'),
      dt('1997-08-21T09:00:00'),
      dt('1997-08-28T09:00:00'),
      dt('1998-06-04T09:00:00'),
      dt('1998-06-11T09:00:00'),
      dt('1998-06-18T09:00:00'),
      dt('1998-06-25T09:00:00'),
      dt('1998-07-02T09:00:00'),
      dt('1998-07-09T09:00:00'),
      dt('1998-07-16T09:00:00'),
      dt('1998-07-23T09:00:00'),
      dt('1998-07-30T09:00:00'),
      dt('1998-08-06T09:00:00'),
      dt('1998-08-13T09:00:00'),
      dt('1998-08-20T09:00:00'),
      dt('1998-08-27T09:00:00'),
      dt('1999-06-03T09:00:00'),
      dt('1999-06-10T09:00:00'),
      dt('1999-06-17T09:00:00'),
      dt('1999-06-24T09:00:00'),
      dt('1999-07-01T09:00:00'),
      dt('1999-07-08T09:00:00'),
      dt('1999-07-15T09:00:00'),
      dt('1999-07-22T09:00:00'),
      dt('1999-07-29T09:00:00'),
      dt('1999-08-05T09:00:00'),
      dt('1999-08-12T09:00:00'),
      dt('1999-08-19T09:00:00'),
      dt('1999-08-26T09:00:00'),
    ]);
  });
});

describe('RFC 5545 - Complex Rules with BYSETPOS', () => {
  it('Friday the 13th, forever', () => {
    const rule = RRule.fromString(`
      DTSTART:19970902T090000
      RRULE:FREQ=MONTHLY;BYDAY=FR;BYMONTHDAY=13
    `);

    const occurrences = rule.all(5);

    expect(occurrences).toEqual([
      dt('1998-02-13T09:00:00'),
      dt('1998-03-13T09:00:00'),
      dt('1998-11-13T09:00:00'),
      dt('1999-08-13T09:00:00'),
      dt('2000-10-13T09:00:00'),
    ]);
  });

  it('First Saturday that follows the first Sunday, forever', () => {
    const rule = RRule.fromString(`
      DTSTART:19970913T090000
      RRULE:FREQ=MONTHLY;BYDAY=SA;BYMONTHDAY=7,8,9,10,11,12,13
    `);

    const occurrences = rule.all(7);

    expect(occurrences).toEqual([
      dt('1997-09-13T09:00:00'),
      dt('1997-10-11T09:00:00'),
      dt('1997-11-08T09:00:00'),
      dt('1997-12-13T09:00:00'),
      dt('1998-01-10T09:00:00'),
      dt('1998-02-07T09:00:00'),
      dt('1998-03-07T09:00:00'),
    ]);
  });

  it('Every 4 years, first Tuesday after a Monday in November (US Presidential Election)', () => {
    const rule = RRule.fromString(`
      DTSTART:19961105T090000
      RRULE:FREQ=YEARLY;INTERVAL=4;BYMONTH=11;BYDAY=TU;BYMONTHDAY=2,3,4,5,6,7,8
    `);

    const occurrences = rule.all(5);

    expect(occurrences).toEqual([
      dt('1996-11-05T09:00:00'),
      dt('2000-11-07T09:00:00'),
      dt('2004-11-02T09:00:00'),
      dt('2008-11-04T09:00:00'),
      dt('2012-11-06T09:00:00'),
    ]);
  });

  it('3rd instance of Tuesday, Wednesday or Thursday for next 3 months', () => {
    // DTSTART;TZID=America/New_York:19970904T090000
    // RRULE:FREQ=MONTHLY;COUNT=3;BYDAY=TU,WE,TH;BYSETPOS=3
    // ==> (1997 9:00 AM EDT) September 4;October 7;November 6

    const rule = RRule.fromString(`
      DTSTART:19970904T090000
      RRULE:FREQ=MONTHLY;COUNT=3;BYDAY=TU,WE,TH;BYSETPOS=3
    `);

    const occurrences = rule.all();

    expect(occurrences).toEqual([
      dt('1997-09-04T09:00:00'),
      dt('1997-10-07T09:00:00'),
      dt('1997-11-06T09:00:00'),
    ]);
  });

  it('2nd-to-last weekday of the month', () => {
    const rule = RRule.fromString(`
      DTSTART:19970929T090000
      RRULE:FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-2
    `);

    const occurrences = rule.all(7);

    expect(occurrences).toEqual([
      dt('1997-09-29T09:00:00'),
      dt('1997-10-30T09:00:00'),
      dt('1997-11-27T09:00:00'),
      dt('1997-12-30T09:00:00'),
      dt('1998-01-29T09:00:00'),
      dt('1998-02-26T09:00:00'),
      dt('1998-03-30T09:00:00'),
    ]);
  });
});

describe('RFC 5545 - Hourly, Minutely, Secondly Rules', () => {
  it('Every hour from 9am to 5pm on a specific day', () => {
    // DTSTART;TZID=America/New_York:19970902T090000
    // RRULE:FREQ=HOURLY;INTERVAL=3;UNTIL=19970902T170000Z
    // ==> (1997 9:00 AM EDT) September 2 at 9:00,12:00,15:00

    const rule = RRule.fromString(`
      DTSTART:19970902T090000
      RRULE:FREQ=HOURLY;INTERVAL=3;UNTIL=19970902T170000
    `);

    const occurrences = rule.all();

    expect(occurrences).toEqual([
      dt('1997-09-02T09:00:00'),
      dt('1997-09-02T12:00:00'),
      dt('1997-09-02T15:00:00'),
    ]);
  });

  it('Every 15 minutes for 6 occurrences', () => {
    // DTSTART;TZID=America/New_York:19970902T090000
    // RRULE:FREQ=MINUTELY;INTERVAL=15;COUNT=6
    // ==> (1997 9:00 AM EDT) September 2 at 9:00,9:15,9:30,9:45,10:00,10:15

    const rule = RRule.fromString(`
      DTSTART:19970902T090000
      RRULE:FREQ=MINUTELY;INTERVAL=15;COUNT=6
    `);

    const occurrences = rule.all();

    expect(occurrences).toEqual([
      dt('1997-09-02T09:00:00'),
      dt('1997-09-02T09:15:00'),
      dt('1997-09-02T09:30:00'),
      dt('1997-09-02T09:45:00'),
      dt('1997-09-02T10:00:00'),
      dt('1997-09-02T10:15:00'),
    ]);
  });

  it('Every hour and a half for 4 occurrences', () => {
    // DTSTART;TZID=America/New_York:19970902T090000
    // RRULE:FREQ=MINUTELY;INTERVAL=90;COUNT=4
    // ==> (1997 9:00 AM EDT) September 2 at 9:00,10:30,12:00,13:30

    const rule = RRule.fromString(`
      DTSTART:19970902T090000
      RRULE:FREQ=MINUTELY;INTERVAL=90;COUNT=4
    `);

    const occurrences = rule.all();

    expect(occurrences).toEqual([
      dt('1997-09-02T09:00:00'),
      dt('1997-09-02T10:30:00'),
      dt('1997-09-02T12:00:00'),
      dt('1997-09-02T13:30:00'),
    ]);
  });

  it('Every 20 minutes between 9am-5pm on specific days', () => {
    // DTSTART;TZID=America/New_York:19970902T090000
    // RRULE:FREQ=DAILY;BYHOUR=9,10,11,12,13,14,15,16;BYMINUTE=0,20,40
    // This generates 3 times per hour (0,20,40 minutes) for 8 hours per day

    const rule = RRule.fromString(`
      DTSTART:19970902T090000
      RRULE:FREQ=DAILY;BYHOUR=9,10,11,12,13,14,15,16;BYMINUTE=0,20,40;COUNT=24
    `);

    const occurrences = rule.all();

    expect(occurrences).toEqual([
      dt('1997-09-02T09:00:00'),
      dt('1997-09-02T09:20:00'),
      dt('1997-09-02T09:40:00'),
      dt('1997-09-02T10:00:00'),
      dt('1997-09-02T10:20:00'),
      dt('1997-09-02T10:40:00'),
      dt('1997-09-02T11:00:00'),
      dt('1997-09-02T11:20:00'),
      dt('1997-09-02T11:40:00'),
      dt('1997-09-02T12:00:00'),
      dt('1997-09-02T12:20:00'),
      dt('1997-09-02T12:40:00'),
      dt('1997-09-02T13:00:00'),
      dt('1997-09-02T13:20:00'),
      dt('1997-09-02T13:40:00'),
      dt('1997-09-02T14:00:00'),
      dt('1997-09-02T14:20:00'),
      dt('1997-09-02T14:40:00'),
      dt('1997-09-02T15:00:00'),
      dt('1997-09-02T15:20:00'),
      dt('1997-09-02T15:40:00'),
      dt('1997-09-02T16:00:00'),
      dt('1997-09-02T16:20:00'),
      dt('1997-09-02T16:40:00'),
    ]);
  });
});
