import { AutomationEntity } from '@domain/entities/automation.entity';
import { AutomationActionType, AutomationTriggerType } from '@domain/enums/automation.enums';
import { AutomationMatchPolicy } from '@domain/policies/automation-match.policy';
import { TaskEvent } from '@domain/types/task-event.type';

const automation = (triggerType: AutomationTriggerType, triggerValue: string | null, listId: string | null = null, active = true) =>
  new AutomationEntity({
    _id: 'a1',
    workspaceId: 'w1',
    listId,
    name: 'rule',
    triggerType,
    triggerValue,
    actionType: AutomationActionType.ADD_TAG,
    actionValue: 'x',
    actionUserIds: [],
    webhookSecretEnc: null,
    active,
    armedAt: new Date(),
    dateCursor: null,
    createdBy: 'u1',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

const event = (over: Partial<TaskEvent>): TaskEvent => ({ workspaceId: 'w1', type: 'task.updated', taskId: 't1', listId: 'l1', actorId: 'u1', at: new Date(), eventId: 'e1', ...over });
const status = (value: string | null) => automation(AutomationTriggerType.STATUS_CHANGED, value);

describe('AutomationMatchPolicy', () => {
  it('fires status_changed on the exact name and on a legacy alias of the new status', () => {
    expect(AutomationMatchPolicy.matches(status('completed'), event({ statusChanged: true, status: 'completed' }))).toBe(true);
    expect(AutomationMatchPolicy.matches(status('completed'), event({ statusChanged: true, status: 'in review' }))).toBe(false);
    expect(AutomationMatchPolicy.matches(status('deployed'), event({ statusChanged: true, status: 'completed' }))).toBe(true);
    expect(AutomationMatchPolicy.matches(status('testing'), event({ statusChanged: true, status: 'in review' }))).toBe(true);
    expect(AutomationMatchPolicy.matches(status('shipping'), event({ statusChanged: true, status: 'completed' }))).toBe(false);
    expect(AutomationMatchPolicy.matches(status('completed'), event({ statusChanged: false, status: 'completed' }))).toBe(false);
    expect(AutomationMatchPolicy.matches(status('completed'), event({ type: 'task.created', statusChanged: true, status: 'completed' }))).toBe(false);
  });

  it('fires priority_changed for any priority or only the chosen one', () => {
    const any = automation(AutomationTriggerType.PRIORITY_CHANGED, null);
    const urgent = automation(AutomationTriggerType.PRIORITY_CHANGED, 'urgent');
    expect(AutomationMatchPolicy.matches(any, event({ priorityChanged: true, priority: 'low' }))).toBe(true);
    expect(AutomationMatchPolicy.matches(any, event({ priorityChanged: true, priority: null }))).toBe(true);
    expect(AutomationMatchPolicy.matches(urgent, event({ priorityChanged: true, priority: 'urgent' }))).toBe(true);
    expect(AutomationMatchPolicy.matches(urgent, event({ priorityChanged: true, priority: 'high' }))).toBe(false);
    expect(AutomationMatchPolicy.matches(any, event({ priorityChanged: false, priority: 'urgent' }))).toBe(false);
  });

  it('fires assignee_added on create and update for anyone or the chosen user', () => {
    const anyone = automation(AutomationTriggerType.ASSIGNEE_ADDED, null);
    const u2 = automation(AutomationTriggerType.ASSIGNEE_ADDED, 'u2');
    expect(AutomationMatchPolicy.matches(anyone, event({ type: 'task.created', addedAssigneeIds: ['u3'] }))).toBe(true);
    expect(AutomationMatchPolicy.matches(u2, event({ addedAssigneeIds: ['u3', 'u2'] }))).toBe(true);
    expect(AutomationMatchPolicy.matches(u2, event({ addedAssigneeIds: ['u3'] }))).toBe(false);
    expect(AutomationMatchPolicy.matches(anyone, event({ addedAssigneeIds: [] }))).toBe(false);
    expect(AutomationMatchPolicy.matches(anyone, event({ type: 'comment.created', addedAssigneeIds: ['u2'] }))).toBe(false);
  });

  it('fires task_created only on creation and never matches date_reached from events', () => {
    expect(AutomationMatchPolicy.matches(automation(AutomationTriggerType.TASK_CREATED, null), event({ type: 'task.created' }))).toBe(true);
    expect(AutomationMatchPolicy.matches(automation(AutomationTriggerType.TASK_CREATED, null), event({ type: 'task.updated', statusChanged: true }))).toBe(false);
    expect(AutomationMatchPolicy.matches(automation(AutomationTriggerType.DATE_REACHED, 'due_date'), event({ type: 'task.created' }))).toBe(false);
  });

  it('respects the list scope, the active flag and the workspace', () => {
    expect(AutomationMatchPolicy.matches(automation(AutomationTriggerType.TASK_CREATED, null, 'l2'), event({ type: 'task.created' }))).toBe(false);
    expect(AutomationMatchPolicy.matches(automation(AutomationTriggerType.TASK_CREATED, null, 'l1'), event({ type: 'task.created' }))).toBe(true);
    expect(AutomationMatchPolicy.matches(automation(AutomationTriggerType.TASK_CREATED, null, null, false), event({ type: 'task.created' }))).toBe(false);
    expect(AutomationMatchPolicy.matches(automation(AutomationTriggerType.TASK_CREATED, null), event({ type: 'task.created', workspaceId: 'w2' }))).toBe(false);
  });

  it('ignores events written by the automation actor so rules never chain', () => {
    expect(AutomationMatchPolicy.candidateTypes(event({ actorId: 'automation', statusChanged: true, status: 'completed' }))).toEqual([]);
    expect(AutomationMatchPolicy.matches(status('completed'), event({ actorId: 'automation', statusChanged: true, status: 'completed' }))).toBe(false);
    expect(AutomationMatchPolicy.candidateTypes(event({ type: 'task.created', addedAssigneeIds: ['u2'] }))).toEqual([AutomationTriggerType.TASK_CREATED, AutomationTriggerType.ASSIGNEE_ADDED]);
  });
});
