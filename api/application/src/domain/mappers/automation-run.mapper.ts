import { AutomationRunEntity } from '@domain/entities/automation-run.entity';

export class DomainAutomationRunMapper {
  static toPersistence(entity: AutomationRunEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      automation_id: entity.getAutomationId(),
      trigger_key: entity.getTriggerKey(),
      task_id: entity.getTaskId(),
      status: entity.getStatus(),
      reason: entity.getReason(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): AutomationRunEntity {
    return new AutomationRunEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      automationId: raw.automation_id,
      triggerKey: raw.trigger_key,
      taskId: raw.task_id,
      status: raw.status,
      reason: raw.reason ?? null,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at ?? raw.created_at,
    });
  }
}
