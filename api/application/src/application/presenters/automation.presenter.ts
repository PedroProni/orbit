import { AutomationEntity } from '@domain/entities/automation.entity';
import { AutomationRunEntity } from '@domain/entities/automation-run.entity';
import { AutomationLastRun } from '@domain/types/automation-last-run.type';

export class AutomationPresenter {
  static toView(a: AutomationEntity, lastRun: AutomationLastRun | null) {
    return {
      id: a.getId(),
      listId: a.getListId(),
      name: a.getName(),
      triggerType: a.getTriggerType(),
      triggerValue: a.getTriggerValue(),
      actionType: a.getActionType(),
      actionValue: a.getActionValue(),
      actionUserIds: [...a.getActionUserIds()],
      active: a.getActive(),
      hasSecret: a.hasSecret(),
      createdAt: a.getCreatedAt(),
      updatedAt: a.getUpdatedAt(),
      lastRun: lastRun ? { status: lastRun.status, reason: lastRun.reason, at: lastRun.at } : null,
    };
  }

  static toRunView(run: AutomationRunEntity, taskTitle: string | null) {
    return { id: run.getId(), taskId: run.getTaskId(), taskTitle, status: run.getStatus(), reason: run.getReason(), createdAt: run.getCreatedAt() };
  }
}
