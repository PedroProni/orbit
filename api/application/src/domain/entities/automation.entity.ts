import { AutomationActionType, AutomationDateField, AutomationNotifyTarget, AutomationTriggerType } from '@domain/enums/automation.enums';
import { TaskPriority } from '@domain/enums/task.enums';
import { AutomationEntityProps } from '@domain/props/automation-entity.props';
import { AutomationRewrite } from '@domain/types/automation-rewrite.type';
import { AUTOMATION_ACTION_USERS_MAX, AUTOMATION_ACTION_VALUE_MAX_LENGTH, AUTOMATION_COMMENT_MAX_LENGTH, AUTOMATION_NAME_MAX_LENGTH } from '@domain/constants/automation.constant';

export class AutomationEntity {
  private readonly _id: string;
  private workspaceId: string;
  private listId: string | null;
  private name: string;
  private triggerType: AutomationTriggerType;
  private triggerValue: string | null;
  private actionType: AutomationActionType;
  private actionValue: string;
  private actionUserIds: string[];
  private webhookSecretEnc: string | null;
  private active: boolean;
  private armedAt: Date;
  private dateCursor: Date | null;
  private createdBy: string;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: AutomationEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.listId = props.listId;
    this.name = props.name;
    this.triggerType = props.triggerType;
    this.triggerValue = props.triggerValue;
    this.actionType = props.actionType;
    this.actionValue = props.actionValue;
    this.actionUserIds = props.actionUserIds;
    this.webhookSecretEnc = props.webhookSecretEnc;
    this.active = props.active;
    this.armedAt = props.armedAt;
    this.dateCursor = props.dateCursor;
    this.createdBy = props.createdBy;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  getId(): string {
    return this._id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getListId(): string | null {
    return this.listId;
  }

  getName(): string {
    return this.name;
  }

  getTriggerType(): AutomationTriggerType {
    return this.triggerType;
  }

  getTriggerValue(): string | null {
    return this.triggerValue;
  }

  getActionType(): AutomationActionType {
    return this.actionType;
  }

  getActionValue(): string {
    return this.actionValue;
  }

  getActionUserIds(): string[] {
    return this.actionUserIds;
  }

  getWebhookSecretEnc(): string | null {
    return this.webhookSecretEnc;
  }

  hasSecret(): boolean {
    return this.webhookSecretEnc !== null;
  }

  getActive(): boolean {
    return this.active;
  }

  getArmedAt(): Date {
    return this.armedAt;
  }

  getDateCursor(): Date | null {
    return this.dateCursor;
  }

  getCreatedBy(): string {
    return this.createdBy;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  rewrite(input: AutomationRewrite, now: Date = new Date()): void {
    const name = input.name.trim();
    if (!name || name.length > AUTOMATION_NAME_MAX_LENGTH) throw new Error('Automation name is required and must have at most 80 characters');
    const triggerValue = AutomationEntity.triggerValueFor(input.triggerType, input.triggerValue);
    const actionValue = AutomationEntity.actionValueFor(input.actionType, input.actionValue);
    const actionUserIds = AutomationEntity.actionUsersFor(input.actionType, actionValue, input.actionUserIds);
    this.listId = input.listId;
    this.name = name;
    this.triggerType = input.triggerType;
    this.triggerValue = triggerValue;
    this.actionType = input.actionType;
    this.actionValue = actionValue;
    this.actionUserIds = actionUserIds;
    if (input.actionType !== AutomationActionType.WEBHOOK) this.webhookSecretEnc = null;
    this.active = input.active;
    this.armedAt = now;
    this.dateCursor = null;
    this.updatedAt = now;
  }

  replaceSecret(encrypted: string): void {
    if (this.actionType !== AutomationActionType.WEBHOOK) throw new Error('Only webhook automations have a secret');
    this.webhookSecretEnc = encrypted;
  }

  advanceDateCursor(at: Date): void {
    this.dateCursor = at;
  }

  toProps(): AutomationEntityProps {
    return {
      _id: this._id,
      workspaceId: this.workspaceId,
      listId: this.listId,
      name: this.name,
      triggerType: this.triggerType,
      triggerValue: this.triggerValue,
      actionType: this.actionType,
      actionValue: this.actionValue,
      actionUserIds: [...this.actionUserIds],
      webhookSecretEnc: this.webhookSecretEnc,
      active: this.active,
      armedAt: this.armedAt,
      dateCursor: this.dateCursor,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  private static triggerValueFor(type: AutomationTriggerType, raw: string | null): string | null {
    const value = raw?.trim() || null;
    if (type === AutomationTriggerType.TASK_CREATED) return null;
    if (type === AutomationTriggerType.STATUS_CHANGED) {
      if (!value) throw new Error('A target status is required');
      return value;
    }
    if (type === AutomationTriggerType.PRIORITY_CHANGED) {
      if (value && !Object.values(TaskPriority).includes(value as TaskPriority)) throw new Error('Invalid priority');
      return value;
    }
    if (type === AutomationTriggerType.DATE_REACHED) {
      if (!value || !Object.values(AutomationDateField).includes(value as AutomationDateField)) throw new Error('A date field is required');
      return value;
    }
    return value;
  }

  private static actionValueFor(type: AutomationActionType, raw: string): string {
    const value = raw.trim();
    if (!value) throw new Error('Action value is required');
    if (value.length > AUTOMATION_ACTION_VALUE_MAX_LENGTH) throw new Error('Action value is too long');
    if (type === AutomationActionType.SET_PRIORITY && !Object.values(TaskPriority).includes(value as TaskPriority)) throw new Error('Invalid priority');
    if (type === AutomationActionType.COMMENT && value.length > AUTOMATION_COMMENT_MAX_LENGTH) throw new Error('Comment must have at most 2000 characters');
    if (type === AutomationActionType.NOTIFY && !Object.values(AutomationNotifyTarget).includes(value as AutomationNotifyTarget)) throw new Error('Invalid notification target');
    return value;
  }

  private static actionUsersFor(type: AutomationActionType, value: string, raw: string[]): string[] {
    if (type !== AutomationActionType.NOTIFY || (value as AutomationNotifyTarget) !== AutomationNotifyTarget.USERS) return [];
    const ids = [...new Set(raw.map(id => id.trim()).filter(Boolean))];
    if (ids.length === 0 || ids.length > AUTOMATION_ACTION_USERS_MAX) throw new Error('Choose between 1 and 20 users to notify');
    return ids;
  }
}
