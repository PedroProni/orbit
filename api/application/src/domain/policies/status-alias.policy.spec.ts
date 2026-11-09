import { DEFAULT_STATUSES } from '@domain/constants/default-statuses.constant';
import { StatusType } from '@domain/enums/space.enums';
import { StatusAliasPolicy } from './status-alias.policy';

describe('default statuses', () => {
  it('are the seven decided statuses with their types, in order', () => {
    expect(DEFAULT_STATUSES.map(s => [s.name, s.type, s.order])).toEqual([
      ['backlog', StatusType.OPEN, 0],
      ['to-do', StatusType.OPEN, 1],
      ['stuck', StatusType.ACTIVE, 2],
      ['in development', StatusType.ACTIVE, 3],
      ['waiting review', StatusType.REVIEW, 4],
      ['in review', StatusType.REVIEW, 5],
      ['completed', StatusType.DONE, 6],
    ]);
  });
});

describe('StatusAliasPolicy', () => {
  it.each([
    ['backlog', 'backlog'],
    ['to-do', 'to-do'],
    ['To do', 'to-do'],
    ['Open', 'to-do'],
    ['stuck', 'stuck'],
    ['in development', 'in development'],
    ['In progress', 'in development'],
    ['waiting review', 'waiting review'],
    ['in review', 'in review'],
    ['In review', 'in review'],
    ['testing', 'in review'],
    ['ready for deploy', 'completed'],
    ['deployed', 'completed'],
    ['complete', 'completed'],
    ['Done', 'completed'],
    ['Closed', 'completed'],
    ['cancelled', 'completed'],
    ['Cancelled', 'completed'],
    ['  WAITING REVIEW ', 'waiting review'],
  ])('maps %s to %s', (legacy, target) => {
    expect(StatusAliasPolicy.canonical(legacy)).toBe(target);
  });

  it('every target is one of the seven', () => {
    const seven = DEFAULT_STATUSES.map(s => s.name);
    for (const name of ['open', 'to do', 'in progress', 'testing', 'done', 'closed', 'cancelled', 'deployed']) expect(seven).toContain(StatusAliasPolicy.canonical(name));
  });

  it('returns null for a name outside the table', () => {
    expect(StatusAliasPolicy.canonical('shipping')).toBeNull();
  });

  it('marks only cancelled as cancelled', () => {
    expect(StatusAliasPolicy.isCancelled('Cancelled')).toBe(true);
    expect(StatusAliasPolicy.isCancelled('completed')).toBe(false);
  });

  it('expands a filter with the target of each old name, without duplicates', () => {
    expect(StatusAliasPolicy.expand(['waiting review', 'custom'])).toEqual(['waiting review', 'custom']);
    expect(StatusAliasPolicy.expand(['testing'])).toEqual(['testing', 'in review']);
  });
});
