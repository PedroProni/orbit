import { AutomationEntity } from '@domain/entities/automation.entity';

export class DomainAutomationMapper {
  static toPersistence(entity: AutomationEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      list_id: entity.getListId(),
      name: entity.getName(),
      trigger_type: entity.getTriggerType(),
      trigger_status: entity.getTriggerStatus(),
      action_type: entity.getActionType(),
      action_value: entity.getActionValue(),
      active: entity.getActive(),
      created_by: entity.getCreatedBy(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): AutomationEntity {
    return new AutomationEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      listId: raw.list_id ?? null,
      name: raw.name,
      triggerType: raw.trigger_type,
      triggerStatus: raw.trigger_status ?? null,
      actionType: raw.action_type,
      actionValue: raw.action_value,
      active: raw.active,
      createdBy: raw.created_by,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
