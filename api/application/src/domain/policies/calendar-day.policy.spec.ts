import { CalendarDayPolicy } from './calendar-day.policy';

const at = (iso: string) => Date.parse(iso);

describe('CalendarDayPolicy', () => {
  describe('isOverdue', () => {
    it('does not treat a task due today as overdue, whatever the hour stored', () => {
      const now = at('2026-11-15T20:00:00.000Z');
      expect(CalendarDayPolicy.isOverdue(new Date('2026-11-15T01:00:00.000Z'), now)).toBe(false);
      expect(CalendarDayPolicy.isOverdue(new Date('2026-11-15T12:00:00.000Z'), now)).toBe(false);
    });

    it('treats the task as overdue from the next day on', () => {
      const due = new Date('2026-11-15T23:59:59.000Z');
      expect(CalendarDayPolicy.isOverdue(due, at('2026-11-15T23:59:59.999Z'))).toBe(false);
      expect(CalendarDayPolicy.isOverdue(due, at('2026-11-16T00:00:00.000Z'))).toBe(true);
    });

    it('ignores a task without due date', () => {
      expect(CalendarDayPolicy.isOverdue(null, at('2026-11-15T00:00:00.000Z'))).toBe(false);
      expect(CalendarDayPolicy.isOverdue(undefined, at('2026-11-15T00:00:00.000Z'))).toBe(false);
    });
  });

  describe('isDueWithin', () => {
    const now = at('2026-11-15T20:00:00.000Z');

    it('includes today and the last day of the window, whatever the hour stored', () => {
      expect(CalendarDayPolicy.isDueWithin(new Date('2026-11-15T01:00:00.000Z'), now, 3)).toBe(true);
      expect(CalendarDayPolicy.isDueWithin(new Date('2026-11-18T23:00:00.000Z'), now, 3)).toBe(true);
    });

    it('excludes past days, days after the window and a task without due date', () => {
      expect(CalendarDayPolicy.isDueWithin(new Date('2026-11-14T23:00:00.000Z'), now, 3)).toBe(false);
      expect(CalendarDayPolicy.isDueWithin(new Date('2026-11-19T00:00:00.000Z'), now, 3)).toBe(false);
      expect(CalendarDayPolicy.isDueWithin(null, now, 3)).toBe(false);
    });

    it('never places the same task in both overdue and due soon', () => {
      for (const iso of ['2026-11-14T23:59:00.000Z', '2026-11-15T00:00:00.000Z', '2026-11-15T23:59:00.000Z', '2026-11-18T12:00:00.000Z']) {
        const due = new Date(iso);
        expect(CalendarDayPolicy.isOverdue(due, now) && CalendarDayPolicy.isDueWithin(due, now, 3)).toBe(false);
      }
    });
  });
});
