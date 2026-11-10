import { AutomationEntity } from '@domain/entities/automation.entity';
import { AutomationTriggerType } from '@domain/enums/automation.enums';
import { StatusAliasPolicy } from '@domain/policies/status-alias.policy';
import { TaskEvent } from '@domain/types/task-event.type';
import { AUTOMATION_ACTOR_ID } from '@domain/constants/automation-actor.constant';
import { TASK_CREATED_EVENT, TASK_UPDATED_EVENT } from '@domain/constants/task-event-type.constant';

export class AutomationMatchPolicy {
  static candidateTypes(event: TaskEvent): AutomationTriggerType[] {
    if (event.actorId === AUTOMATION_ACTOR_ID) return [];
    const types: AutomationTriggerType[] = [];
    if (event.type === TASK_CREATED_EVENT) types.push(AutomationTriggerType.TASK_CREATED);
    if (event.type === TASK_UPDATED_EVENT && event.statusChanged) types.push(AutomationTriggerType.STATUS_CHANGED);
    if (event.type === TASK_UPDATED_EVENT && event.priorityChanged) types.push(AutomationTriggerType.PRIORITY_CHANGED);
    if ((event.type === TASK_CREATED_EVENT || event.type === TASK_UPDATED_EVENT) && event.addedAssigneeIds?.length) types.push(AutomationTriggerType.ASSIGNEE_ADDED);
    return types;
  }

  static matches(automation: AutomationEntity, event: TaskEvent): boolean {
    if (!automation.getActive() || automation.getWorkspaceId() !== event.workspaceId) return false;
    if (!AutomationMatchPolicy.candidateTypes(event).includes(automation.getTriggerType())) return false;
    if (automation.getListId() && automation.getListId() !== event.listId) return false;
    const value = automation.getTriggerValue();
    switch (automation.getTriggerType()) {
      case AutomationTriggerType.STATUS_CHANGED:
        return !!event.status && !!value && (value === event.status || StatusAliasPolicy.canonical(value) === event.status);
      case AutomationTriggerType.PRIORITY_CHANGED:
        return value === null || value === (event.priority ?? null);
      case AutomationTriggerType.ASSIGNEE_ADDED:
        return value === null || (event.addedAssigneeIds ?? []).includes(value);
      case AutomationTriggerType.TASK_CREATED:
        return true;
      default:
        return false;
    }
  }
}
