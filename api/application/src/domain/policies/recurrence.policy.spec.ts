import { RecurrencePolicy } from '@domain/policies/recurrence.policy';
import { RecurrenceFrequency } from '@domain/enums/recurrence.enums';

describe('RecurrencePolicy', () => {
  it('adds days and weeks', () => {
    const from = new Date('2026-11-04T10:00:00Z');
    expect(RecurrencePolicy.next(from, RecurrenceFrequency.DAILY, 3).toISOString()).toBe('2026-11-07T10:00:00.000Z');
    expect(RecurrencePolicy.next(from, RecurrenceFrequency.WEEKLY, 2).toISOString()).toBe('2026-11-18T10:00:00.000Z');
  });

  it('clamps the day at the end of shorter months', () => {
    expect(RecurrencePolicy.next(new Date('2026-01-31T09:00:00Z'), RecurrenceFrequency.MONTHLY, 1).toISOString()).toBe('2026-02-28T09:00:00.000Z');
    expect(RecurrencePolicy.next(new Date('2026-12-15T09:00:00Z'), RecurrenceFrequency.MONTHLY, 2).toISOString()).toBe('2027-02-15T09:00:00.000Z');
  });

  it('shifts optional dates by the same distance', () => {
    const from = new Date('2026-11-01T00:00:00Z');
    const to = new Date('2026-11-08T00:00:00Z');
    expect(RecurrencePolicy.shift(new Date('2026-11-03T00:00:00Z'), from, to)?.toISOString()).toBe('2026-11-10T00:00:00.000Z');
    expect(RecurrencePolicy.shift(null, from, to)).toBeNull();
  });
});
