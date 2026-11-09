import { DailyLogPolicy } from '@domain/policies/daily-log.policy';

describe('DailyLogPolicy', () => {
  it('uses the configured timezone for the day key', () => {
    expect(DailyLogPolicy.dateKey(new Date('2026-11-04T02:30:00Z'))).toBe('2026-11-03');
    expect(DailyLogPolicy.dateKey(new Date('2026-11-04T12:00:00Z'))).toBe('2026-11-04');
  });

  it('formats the short date and the heading', () => {
    expect(DailyLogPolicy.shortDate(new Date('2026-11-04T12:00:00Z'))).toBe('04/11');
    expect(DailyLogPolicy.heading('2026-11-04')).toContain('04/11');
  });
});
