import { describe, expect, it } from 'vitest';
import { makeSpace, makeTask } from './helpers/fixtures';
import { composerRule, composerTarget, draftFromPresets, hasAllowedPrefix, hasRequiredTag, inputFromDraft, isTempTask, makeTempTask, matchesFilters, moveDraft, priorityFromKey, titlePrefixOf, toggleIn, withTitlePrefix } from '@/components/tasks/task-composer.helpers';
import { EMPTY_DRAFT, EMPTY_PRESETS } from '@/components/tasks/task-composer.constants';
import { EMPTY_FILTERS } from '@/stores/ui.constants';

describe('composer title and tag rules, same as the API', () => {
  it.each([
    ['[P4T] x', true],
    ['  [p4t] x', true],
    ['[P4T.CO] x', true],
    ['[P4T CO] x', true],
    ['[P4TX] x', false],
    ['P4T x', false],
    ['x [P4T]', false],
  ])('prefix of %s is %s', (title, ok) => {
    expect(hasAllowedPrefix(title, ['P4T'])).toBe(ok);
  });

  it('accepts anything without prefixes and escapes the prefix in the pattern', () => {
    expect(hasAllowedPrefix('x', [])).toBe(true);
    expect(hasAllowedPrefix('[A.B] x', ['A.B'])).toBe(true);
    expect(hasAllowedPrefix('[AxB] x', ['A.B'])).toBe(false);
  });

  it('asks for at least one required tag, ignoring case', () => {
    expect(hasRequiredTag([], [])).toBe(true);
    expect(hasRequiredTag(['p4t'], ['P4T', 'BKO'])).toBe(true);
    expect(hasRequiredTag(['outra'], ['P4T'])).toBe(false);
  });

  it('reports the prefix first, then the tag, then nothing', () => {
    const space = makeSpace({ titlePrefixes: ['A', 'B'], requiredTags: ['t'] });
    expect(composerRule({ ...EMPTY_DRAFT, title: 'x' }, space)).toEqual({ key: 'prefixError', values: { prefixes: '[A], [B]' } });
    expect(composerRule({ ...EMPTY_DRAFT, title: '[A] x' }, space)).toEqual({ key: 'tagError', values: { tags: 't' } });
    expect(composerRule({ ...EMPTY_DRAFT, title: '[A] x', tags: ['t'] }, space)).toBeNull();
  });

  it('finds the prefix to keep and swaps it', () => {
    expect(titlePrefixOf('[A] x', ['A'])).toBe('[A] ');
    expect(titlePrefixOf('x', ['A'])).toBe('');
    expect(titlePrefixOf('[Z] x', ['A'])).toBe('');
    expect(withTitlePrefix('x', 'A')).toBe('[A] x');
    expect(withTitlePrefix('[Z] x', 'A')).toBe('[A] x');
  });
});

describe('composer draft', () => {
  const before = { ...EMPTY_PRESETS, status: 'to-do', assigneeIds: ['u1'], priority: 'high' as const, tags: ['a'] };
  const after = { ...EMPTY_PRESETS, status: 'doing', assigneeIds: ['u2'], priority: 'low' as const, tags: ['b'] };

  it('starts from the presets', () => {
    expect(draftFromPresets('[A] ', before)).toEqual({ title: '[A] ', listId: null, assigneeIds: ['u1'], priority: 'high', tags: ['a'], startDate: '', dueDate: '', points: null, taskKind: null, customFields: [] });
    expect(draftFromPresets('', before, 'l2').listId).toBe('l2');
  });

  it('swaps the old presets for the new ones and keeps what the person chose', () => {
    const moved = moveDraft({ ...EMPTY_DRAFT, title: 'x', assigneeIds: ['u1', 'u9'], priority: 'high', tags: ['a', 'z'], dueDate: '2026-01-02', points: 3 }, before, after);
    expect(moved).toEqual({ ...EMPTY_DRAFT, title: 'x', assigneeIds: ['u9', 'u2'], priority: 'low', tags: ['z', 'b'], dueDate: '2026-01-02', points: 3 });
  });

  it('keeps a priority the person changed', () => {
    expect(moveDraft({ ...EMPTY_DRAFT, priority: 'urgent' }, before, after).priority).toBe('urgent');
  });

  it('sends only what was filled, with the trimmed title and the status of the cell', () => {
    expect(inputFromDraft({ ...EMPTY_DRAFT, title: '  x  ' }, before)).toEqual({ title: 'x', status: 'to-do', tags: [], assigneeIds: [] });
    const full = inputFromDraft({ ...EMPTY_DRAFT, title: 'x', assigneeIds: ['u1'], priority: 'low', tags: ['a'], dueDate: '2026-03-04', points: 0 }, EMPTY_PRESETS);
    expect(full).toMatchObject({ title: 'x', assigneeIds: ['u1'], priority: 'low', tags: ['a'], points: 0 });
    expect(full.dueDate?.slice(0, 10)).toBe('2026-03-04');
    expect(full.status).toBeUndefined();
  });

  it('sends the start date, type and custom fields, and drops the cell status when the task goes to another space', () => {
    const input = inputFromDraft({ ...EMPTY_DRAFT, title: 'x', startDate: '2026-03-01', dueDate: '2026-03-04', taskKind: 'bug', customFields: [{ fieldId: 'f1', value: 'o1' }] }, before);
    expect(input).toMatchObject({ status: 'to-do', taskKind: 'bug', customFields: [{ fieldId: 'f1', value: 'o1' }] });
    expect(input.startDate?.slice(0, 10)).toBe('2026-03-01');
    expect(inputFromDraft({ ...EMPTY_DRAFT, title: 'x' }, before, false).status).toBeUndefined();
    expect(inputFromDraft({ ...EMPTY_DRAFT, title: 'x' }, before)).not.toHaveProperty('taskKind');
  });

  it('refuses a start date after the due date and accepts the same day', () => {
    const space = makeSpace({ titlePrefixes: [], requiredTags: [] });
    expect(composerRule({ ...EMPTY_DRAFT, title: 'x', startDate: '2026-03-05', dueDate: '2026-03-04' }, space)).toEqual({ key: 'datesError', values: {} });
    expect(composerRule({ ...EMPTY_DRAFT, title: 'x', startDate: '2026-03-04', dueDate: '2026-03-04' }, space)).toBeNull();
    expect(composerRule({ ...EMPTY_DRAFT, title: 'x', startDate: '2026-03-05' }, space)).toBeNull();
  });

  it('reads Ctrl, Cmd or Alt with 1 to 4 as a priority and 0 as no priority, and ignores plain digits', () => {
    expect(priorityFromKey({ key: '1', ctrlKey: true, metaKey: false, altKey: false })).toBe('urgent');
    expect(priorityFromKey({ key: '4', ctrlKey: false, metaKey: true, altKey: false })).toBe('low');
    expect(priorityFromKey({ key: '3', ctrlKey: false, metaKey: false, altKey: true })).toBe('normal');
    expect(priorityFromKey({ key: '0', ctrlKey: true, metaKey: false, altKey: false })).toBeNull();
    expect(priorityFromKey({ key: '2', ctrlKey: false, metaKey: false, altKey: false })).toBeUndefined();
    expect(priorityFromKey({ key: '5', ctrlKey: true, metaKey: false, altKey: false })).toBeUndefined();
  });

  it('finds the space and the name of the target list, and falls back to the current space', () => {
    const home = makeSpace({ id: 's1', lists: [{ id: 'l1', spaceId: 's1', folderId: null, name: 'Home', kind: 'list' }] });
    const other = makeSpace({ id: 's2', lists: [{ id: 'l2', spaceId: 's2', folderId: null, name: 'Other', kind: 'sprint' }] });
    expect(composerTarget([home, other], 'l2', home)).toEqual({ listId: 'l2', listName: 'Other', space: other });
    expect(composerTarget([home, other], 'gone', home)).toEqual({ listId: 'gone', listName: '', space: home });
    expect(toggleIn(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleIn(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('makes a temporary task shaped like the final card', () => {
    const temp = makeTempTask('7', 'l1', 's1', 'doing', { title: 'x', tags: ['a'], assigneeIds: ['u1'], points: 2, dueDate: '2026-01-01T12:00:00.000Z', priority: 'low' });
    expect(isTempTask(temp)).toBe(true);
    expect(isTempTask(makeTask())).toBe(false);
    expect(temp).toMatchObject({ listId: 'l1', spaceId: 's1', status: 'doing', title: 'x', tags: ['a'], assigneeIds: ['u1'], points: 2, priority: 'low', parentId: null, archived: false });
  });
});

describe('matchesFilters', () => {
  const statuses = [
    { name: 'to-do', color: '#000', type: 'open', order: 0 },
    { name: 'fim', color: '#000', type: 'closed', order: 1 },
  ] as never;
  const task = makeTask({ title: 'Corrigir Login', tags: ['a'], assigneeIds: ['u1'] });

  it('matches with no filters', () => {
    expect(matchesFilters(task, EMPTY_FILTERS, statuses)).toBe(true);
  });

  it.each([
    [{ statuses: ['fim'] }, false],
    [{ statuses: ['to-do'] }, true],
    [{ assigneeIds: ['u2'] }, false],
    [{ assigneeIds: ['u1'] }, true],
    [{ tags: ['b'] }, false],
    [{ tags: ['a'] }, true],
    [{ q: 'login' }, true],
    [{ q: 'outra' }, false],
    [{ unassigned: true }, false],
    [{ unassigned: true, assigneeIds: ['u1'] }, true],
  ])('applies %j', (over, expected) => {
    expect(matchesFilters(task, { ...EMPTY_FILTERS, ...over }, statuses)).toBe(expected);
  });

  it('keeps a task without assignee under the no assignee filter, alone or with people', () => {
    const loose = makeTask({ assigneeIds: [] });
    expect(matchesFilters(loose, { ...EMPTY_FILTERS, unassigned: true }, statuses)).toBe(true);
    expect(matchesFilters(loose, { ...EMPTY_FILTERS, unassigned: true, assigneeIds: ['u2'] }, statuses)).toBe(true);
    expect(matchesFilters(loose, { ...EMPTY_FILTERS, assigneeIds: ['u2'] }, statuses)).toBe(false);
  });

  it('hides a closed task only when closed tasks are off', () => {
    const closed = makeTask({ status: 'fim' });
    expect(matchesFilters(closed, EMPTY_FILTERS, statuses)).toBe(true);
    expect(matchesFilters(closed, { ...EMPTY_FILTERS, includeClosed: false }, statuses)).toBe(false);
  });
});
