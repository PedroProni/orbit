import { escapeRegex } from '@common/helpers/functions/regex.helper';
import { ListTasksQuery } from '@application/commands/task/list-tasks.query';
import { StatusAliasPolicy } from '@domain/policies/status-alias.policy';

export class TaskFilterBuilder {
  static build(workspaceId: string, query: ListTasksQuery, commentTaskIds: string[]): Record<string, unknown> {
    const filter: Record<string, any> = { workspace_id: workspaceId };
    if (query.listId) filter.list_id = query.listId;
    if (query.spaceId) filter.space_id = query.spaceId;
    if (query.parentId) filter.parent_id = query.parentId;
    else if (query.topLevel) filter.parent_id = null;
    if (query.statuses?.length) filter.status = { $in: StatusAliasPolicy.expand(query.statuses) };
    if (query.tags?.length) filter.tags = { $in: query.tags.map(t => t.toLowerCase()) };
    if (!query.includeClosed) filter.date_closed = null;
    if (!query.includeArchived) filter.archived = false;
    const updated: Record<string, Date> = {};
    if (query.updatedAfter) updated.$gt = query.updatedAfter;
    if (query.updatedBefore) updated.$lt = query.updatedBefore;
    if (Object.keys(updated).length) filter.updated_at = updated;
    if (query.createdAfter) filter.created_at = { $gt: query.createdAfter };
    const due: Record<string, Date> = {};
    if (query.dueAfter) due.$gt = query.dueAfter;
    if (query.dueBefore) due.$lt = query.dueBefore;
    if (Object.keys(due).length) filter.due_date = due;
    const alternatives: Record<string, unknown>[][] = [];
    const people: Record<string, unknown>[] = [];
    if (query.assigneeIds?.length) people.push({ assignee_ids: { $in: query.assigneeIds } });
    if (query.unassigned) people.push({ assignee_ids: { $in: [null, []] } });
    if (people.length === 1) Object.assign(filter, people[0]);
    if (people.length > 1) alternatives.push(people);
    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), 'i');
      alternatives.push([{ title: regex }, { description_md: regex }, { _id: { $in: commentTaskIds } }]);
    }
    if (alternatives.length === 1) filter.$or = alternatives[0];
    if (alternatives.length > 1) filter.$and = alternatives.map(options => ({ $or: options }));
    return filter;
  }
}
