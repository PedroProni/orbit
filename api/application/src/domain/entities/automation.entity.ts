import { AutomationActionType, AutomationTriggerType } from '@domain/enums/automation.enums';
import { TaskPriority } from '@domain/enums/task.enums';
import { AutomationEntityProps } from '@domain/props/automation-entity.props';
import { StatusAliasPolicy } from '@domain/policies/status-alias.policy';

export class AutomationEntity {
  private readonly _id: string;
  private workspaceId: string;
  private listId: string | null;
  private name: string;
  private triggerType: AutomationTriggerType;
  private triggerStatus: string | null;
  private actionType: AutomationActionType;
  private actionValue: string;
  private active: boolean;
  private createdBy: string;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: AutomationEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.listId = props.listId;
    this.name = props.name;
    this.triggerType = props.triggerType;
    this.triggerStatus = props.triggerStatus;
    this.actionType = props.actionType;
    this.actionValue = props.actionValue;
    this.active = props.active;
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

  getTriggerStatus(): string | null {
    return this.triggerStatus;
  }

  getActionType(): AutomationActionType {
    return this.actionType;
  }

  getActionValue(): string {
    return this.actionValue;
  }

  getActive(): boolean {
    return this.active;
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

  rewrite(listId: string | null, name: string, triggerType: AutomationTriggerType, triggerStatus: string | null, actionType: AutomationActionType, actionValue: string, active: boolean): void {
    if (!name.trim()) throw new Error('Automation name is required');
    if (triggerType === AutomationTriggerType.STATUS_CHANGED && !triggerStatus?.trim()) throw new Error('A target status is required');
    if (!actionValue.trim()) throw new Error('Action value is required');
    if (actionType === AutomationActionType.SET_PRIORITY && !Object.values(TaskPriority).includes(actionValue as TaskPriority)) throw new Error('Invalid priority');
    this.listId = listId;
    this.name = name.trim();
    this.triggerType = triggerType;
    this.triggerStatus = triggerType === AutomationTriggerType.STATUS_CHANGED ? (triggerStatus as string).trim() : null;
    this.actionType = actionType;
    this.actionValue = actionValue.trim();
    this.active = active;
    this.updatedAt = new Date();
  }

  matches(type: AutomationTriggerType, listId: string | null, status: string | undefined): boolean {
    if (!this.active || this.triggerType !== type) return false;
    if (this.listId && this.listId !== listId) return false;
    if (type !== AutomationTriggerType.STATUS_CHANGED) return true;
    return !!status && (this.triggerStatus === status || StatusAliasPolicy.canonical(this.triggerStatus ?? '') === status);
  }

  toProps(): AutomationEntityProps {
    return { _id: this._id, workspaceId: this.workspaceId, listId: this.listId, name: this.name, triggerType: this.triggerType, triggerStatus: this.triggerStatus, actionType: this.actionType, actionValue: this.actionValue, active: this.active, createdBy: this.createdBy, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
