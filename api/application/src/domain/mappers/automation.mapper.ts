import { AutomationEntity } from '@domain/entities/automation.entity';
import { AutomationTriggerType } from '@domain/enums/automation.enums';

export class DomainAutomationMapper {
  static toPersistence(entity: AutomationEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      list_id: entity.getListId(),
      name: entity.getName(),
      trigger_type: entity.getTriggerType(),
      trigger_value: entity.getTriggerValue(),
      trigger_status: entity.getTriggerType() === AutomationTriggerType.STATUS_CHANGED ? entity.getTriggerValue() : null,
      action_type: entity.getActionType(),
      action_value: entity.getActionValue(),
      action_user_ids: entity.getActionUserIds(),
      webhook_secret_enc: entity.getWebhookSecretEnc(),
      active: entity.getActive(),
      armed_at: entity.getArmedAt(),
      date_cursor: entity.getDateCursor(),
      created_by: entity.getCreatedBy(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): AutomationEntity {
    const legacyStatus = raw.trigger_type === AutomationTriggerType.STATUS_CHANGED ? (raw.trigger_status ?? null) : null;
    return new AutomationEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      listId: raw.list_id ?? null,
      name: raw.name,
      triggerType: raw.trigger_type,
      triggerValue: raw.trigger_value ?? legacyStatus,
      actionType: raw.action_type,
      actionValue: raw.action_value,
      actionUserIds: raw.action_user_ids ?? [],
      webhookSecretEnc: raw.webhook_secret_enc ?? null,
      active: raw.active,
      armedAt: raw.armed_at ?? raw.created_at,
      dateCursor: raw.date_cursor ?? null,
      createdBy: raw.created_by,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
