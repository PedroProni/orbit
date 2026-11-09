import { DEFAULT_STATUSES } from '@domain/constants/default-statuses.constant';
import { BLOCKED_LEGACY_STATUS, BLOCKED_TAG, BLOCKED_TARGET_STATUS, CANCELLED_TAG } from '@domain/constants/status-aliases.constant';
import { StatusType } from '@domain/enums/space.enums';
import { StatusAliasPolicy } from '@domain/policies/status-alias.policy';
import { ConsolidationSpaceDoc, ConsolidationTaskDoc, StatusConsolidationPlan } from './status-consolidation.type';

const TARGET_NAMES = new Set(DEFAULT_STATUSES.map(s => s.name));
const CLOSED_TYPES = new Set<StatusType>([StatusType.DONE, StatusType.CLOSED]);
const CLOSED_TARGETS = new Set(DEFAULT_STATUSES.filter(s => CLOSED_TYPES.has(s.type)).map(s => s.name));

const bump = (counts: Record<string, number>, key: string): void => {
  counts[key] = (counts[key] ?? 0) + 1;
};

const startsWithDefaults = (current: ConsolidationSpaceDoc['statuses']): boolean => DEFAULT_STATUSES.every((s, i) => current[i]?.name === s.name && current[i]?.type === s.type && current[i]?.color === s.color);

const addedByAdmin = (space: ConsolidationSpaceDoc): string[] => (startsWithDefaults(space.statuses) ? space.statuses.slice(DEFAULT_STATUSES.length).map(s => s.name) : []);

export class StatusConsolidationPlanner {
  static target(status: string, tags: string[] = []): string | null {
    if (TARGET_NAMES.has(status)) return status;
    if (status.trim().toLowerCase() === BLOCKED_LEGACY_STATUS && tags.includes(BLOCKED_TAG)) return BLOCKED_TARGET_STATUS;
    return StatusAliasPolicy.canonical(status);
  }

  static plan(spaces: ConsolidationSpaceDoc[], tasks: ConsolidationTaskDoc[]): StatusConsolidationPlan {
    const plan: StatusConsolidationPlan = { spaces: [], tasks: [], unmapped: [], transitions: {}, countsBefore: {}, countsAfter: {}, cancelledTagged: 0, dateClosedChanged: 0 };
    const added = new Map(spaces.map(space => [space._id, new Set(addedByAdmin(space))]));
    for (const space of spaces) {
      if (!startsWithDefaults(space.statuses)) plan.spaces.push({ id: space._id, workspaceId: space.workspace_id, before: space.statuses.map(s => s.name), after: DEFAULT_STATUSES.map(s => ({ ...s })) });
    }
    for (const task of tasks) {
      bump(plan.countsBefore, task.status);
      if (added.get(task.space_id)?.has(task.status)) {
        bump(plan.countsAfter, task.status);
        continue;
      }
      const target = StatusConsolidationPlanner.target(task.status, task.tags);
      if (!target) {
        plan.unmapped.push({ taskId: task._id, status: task.status });
        bump(plan.countsAfter, task.status);
        continue;
      }
      bump(plan.countsAfter, target);
      bump(plan.transitions, `${task.status} -> ${target}`);
      const tags = [...task.tags];
      const cancelled = StatusAliasPolicy.isCancelled(task.status) && !tags.includes(CANCELLED_TAG);
      if (cancelled) tags.push(CANCELLED_TAG);
      const dateClosed = CLOSED_TARGETS.has(target) ? (task.date_closed ?? task.updated_at) : null;
      const closedChanged = (task.date_closed?.getTime() ?? null) !== (dateClosed?.getTime() ?? null);
      if (target === task.status && !cancelled && !closedChanged) continue;
      if (cancelled) plan.cancelledTagged++;
      if (closedChanged) plan.dateClosedChanged++;
      plan.tasks.push({ id: task._id, workspaceId: task.workspace_id, before: { status: task.status, tags: task.tags, dateClosed: task.date_closed }, after: { status: target, tags, dateClosed } });
    }
    return plan;
  }
}
