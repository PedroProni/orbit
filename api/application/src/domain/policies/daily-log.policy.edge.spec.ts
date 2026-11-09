import { DailyLogPolicy } from '@domain/policies/daily-log.policy';

describe('DailyLogPolicy edge cases', () => {
  it('switches the day exactly at local midnight', () => {
    expect(DailyLogPolicy.dateKey(new Date('2026-11-04T02:59:59Z'))).toBe('2026-11-03');
    expect(DailyLogPolicy.dateKey(new Date('2026-11-04T03:00:00Z'))).toBe('2026-11-04');
  });

  it('crosses the year boundary using the local timezone', () => {
    expect(DailyLogPolicy.dateKey(new Date('2027-01-01T02:00:00Z'))).toBe('2026-12-31');
  });

  it('keeps leap days', () => {
    expect(DailyLogPolicy.dateKey(new Date('2028-02-29T12:00:00Z'))).toBe('2028-02-29');
  });

  it('zero pads day and month in the short date', () => {
    expect(DailyLogPolicy.shortDate(new Date('2026-03-05T12:00:00Z'))).toBe('05/03');
  });

  it('builds the exact heading text', () => {
    expect(DailyLogPolicy.heading('2026-11-04')).toBe('O que foi feito 04/11');
    expect(DailyLogPolicy.heading('2027-01-09')).toBe('O que foi feito 09/01');
  });
});
