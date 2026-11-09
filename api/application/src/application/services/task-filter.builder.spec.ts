import { TaskFilterBuilder } from '@application/services/task-filter.builder';
import { ListTasksQuery } from '@application/commands/task/list-tasks.query';

describe('TaskFilterBuilder', () => {
  const base: ListTasksQuery = { page: 1, limit: 50, includeClosed: true, includeArchived: false, orderBy: 'updated_at', reverse: false };
  const regex: unknown = expect.any(RegExp);

  it('keeps only top level tasks when asked, unless a parent is given', () => {
    expect(TaskFilterBuilder.build('w1', { ...base, topLevel: true }, [])).toEqual({ workspace_id: 'w1', archived: false, parent_id: null });
    expect(TaskFilterBuilder.build('w1', { ...base, topLevel: true, parentId: 'p1' }, [])).toEqual({ workspace_id: 'w1', archived: false, parent_id: 'p1' });
  });

  it('matches the chosen people only', () => {
    expect(TaskFilterBuilder.build('w1', { ...base, assigneeIds: ['u1'] }, [])).toEqual({ workspace_id: 'w1', archived: false, assignee_ids: { $in: ['u1'] } });
  });

  it('matches tasks without assignee when asked alone', () => {
    expect(TaskFilterBuilder.build('w1', { ...base, unassigned: true }, [])).toEqual({ workspace_id: 'w1', archived: false, assignee_ids: { $in: [null, []] } });
  });

  it('matches the chosen people or no assignee', () => {
    expect(TaskFilterBuilder.build('w1', { ...base, assigneeIds: ['u1'], unassigned: true }, [])).toEqual({
      workspace_id: 'w1',
      archived: false,
      $or: [{ assignee_ids: { $in: ['u1'] } }, { assignee_ids: { $in: [null, []] } }],
    });
  });

  it('keeps the search and the people alternatives both required', () => {
    const filter = TaskFilterBuilder.build('w1', { ...base, assigneeIds: ['u1'], unassigned: true, search: 'gamma' }, ['t9']);
    expect(filter.$or).toBeUndefined();
    expect(filter.$and).toEqual([
      { $or: [{ assignee_ids: { $in: ['u1'] } }, { assignee_ids: { $in: [null, []] } }] },
      { $or: [{ title: regex }, { description_md: regex }, { _id: { $in: ['t9'] } }] },
    ]);
  });

  it('keeps the search alone as a single alternative', () => {
    const filter = TaskFilterBuilder.build('w1', { ...base, assigneeIds: ['u1'], search: 'gamma' }, []);
    expect(filter.assignee_ids).toEqual({ $in: ['u1'] });
    expect(filter.$or).toEqual([{ title: regex }, { description_md: regex }, { _id: { $in: [] } }]);
    expect(filter.$and).toBeUndefined();
  });
});
