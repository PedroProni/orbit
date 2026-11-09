import { DEFAULT_STATUSES, DEFAULT_STATUSES_LOCKED_ERROR } from '@domain/constants/default-statuses.constant';
import { StatusType } from '@domain/enums/space.enums';
import { DefaultStatusPolicy } from './default-status.policy';

const defaults = () => DEFAULT_STATUSES.map((s) => ({ ...s }));
const extra = { name: 'Homologação', color: '#123456', type: StatusType.REVIEW, order: 7 };

describe('DefaultStatusPolicy', () => {
  it('keeps the seven defaults and the extras after them, restoring the default colors', () => {
    const recolored = defaults().map((s) => ({ ...s, color: '#000000' }));
    const locked = DefaultStatusPolicy.lock([...recolored, extra]);
    expect(locked.map((s) => s.name)).toEqual([...DEFAULT_STATUSES.map((s) => s.name), 'Homologação']);
    expect(locked.slice(0, 7).map((s) => s.color)).toEqual(DEFAULT_STATUSES.map((s) => s.color));
    expect(locked[7].color).toBe('#123456');
  });

  it('accepts a default written with other case and spaces', () => {
    const list = defaults();
    list[1] = { ...list[1], name: '  To-Do ' };
    expect(DefaultStatusPolicy.lock(list)[1].name).toBe('to-do');
  });

  it.each([
    ['removed', () => defaults().filter((s) => s.name !== 'stuck')],
    ['renamed', () => defaults().map((s) => (s.name === 'stuck' ? { ...s, name: 'blocked' } : s))],
    ['retyped', () => defaults().map((s) => (s.name === 'completed' ? { ...s, type: StatusType.CLOSED } : s))],
    ['reordered', () => [defaults()[1], defaults()[0], ...defaults().slice(2)]],
    ['preceded by an extra', () => [extra, ...defaults()]],
    ['repeated after the seven', () => [...defaults(), { ...extra, name: 'Backlog' }]],
    ['empty', () => []],
  ])('refuses a list where a default is %s', (_case, build) => {
    expect(() => DefaultStatusPolicy.lock(build())).toThrow(DEFAULT_STATUSES_LOCKED_ERROR);
  });

  it('tells defaults from extras', () => {
    expect(DefaultStatusPolicy.isDefault('In Review')).toBe(true);
    expect(DefaultStatusPolicy.isDefault('Homologação')).toBe(false);
  });
});
