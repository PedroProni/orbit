import { RecurrencePolicy } from '@domain/policies/recurrence.policy';
import { RecurrenceFrequency } from '@domain/enums/recurrence.enums';

const iso = (d: Date | null) => d?.toISOString();

describe('RecurrencePolicy edge cases', () => {
  it('rolls daily recurrence over the year boundary', () => {
    expect(iso(RecurrencePolicy.next(new Date('2026-12-31T08:00:00Z'), RecurrenceFrequency.DAILY, 1))).toBe('2027-01-01T08:00:00.000Z');
  });

  it('keeps the same instant when the interval is zero', () => {
    const from = new Date('2026-11-04T10:00:00Z');
    expect(iso(RecurrencePolicy.next(from, RecurrenceFrequency.DAILY, 0))).toBe(from.toISOString());
    expect(iso(RecurrencePolicy.next(from, RecurrenceFrequency.WEEKLY, 0))).toBe(from.toISOString());
    expect(iso(RecurrencePolicy.next(from, RecurrenceFrequency.MONTHLY, 0))).toBe(from.toISOString());
  });

  it('moves backwards with a negative daily interval', () => {
    expect(iso(RecurrencePolicy.next(new Date('2026-11-04T10:00:00Z'), RecurrenceFrequency.DAILY, -1))).toBe('2026-11-03T10:00:00.000Z');
  });

  it('does not mutate the source date', () => {
    const from = new Date('2026-01-31T09:00:00Z');
    RecurrencePolicy.next(from, RecurrenceFrequency.MONTHLY, 1);
    expect(from.toISOString()).toBe('2026-01-31T09:00:00.000Z');
  });

  it('uses February 29 in leap years', () => {
    expect(iso(RecurrencePolicy.next(new Date('2028-01-31T09:00:00Z'), RecurrenceFrequency.MONTHLY, 1))).toBe('2028-02-29T09:00:00.000Z');
  });

  it('clamps to the last day of 30 day months', () => {
    expect(iso(RecurrencePolicy.next(new Date('2026-03-31T09:00:00Z'), RecurrenceFrequency.MONTHLY, 1))).toBe('2026-04-30T09:00:00.000Z');
    expect(iso(RecurrencePolicy.next(new Date('2026-10-31T09:00:00Z'), RecurrenceFrequency.MONTHLY, 1))).toBe('2026-11-30T09:00:00.000Z');
  });

  it('adds a full year with a twelve month interval', () => {
    expect(iso(RecurrencePolicy.next(new Date('2026-02-15T09:00:00Z'), RecurrenceFrequency.MONTHLY, 12))).toBe('2027-02-15T09:00:00.000Z');
  });

  it('shifts by a negative distance when the target is earlier', () => {
    const from = new Date('2026-11-08T00:00:00Z');
    const to = new Date('2026-11-01T00:00:00Z');
    expect(iso(RecurrencePolicy.shift(new Date('2026-11-10T06:00:00Z'), from, to))).toBe('2026-11-03T06:00:00.000Z');
  });

  it('returns an equal but new date when from and to are the same', () => {
    const date = new Date('2026-11-03T00:00:00Z');
    const result = RecurrencePolicy.shift(date, date, date);
    expect(result).not.toBe(date);
    expect(iso(result)).toBe(date.toISOString());
  });
});
