import { AutomationRunStatus } from '@domain/enums/automation-run.enums';
import { AutomationRunEntityProps } from '@domain/props/automation-run-entity.props';

export class AutomationRunEntity {
  private readonly _id: string;
  private readonly workspaceId: string;
  private readonly automationId: string;
  private readonly triggerKey: string;
  private readonly taskId: string;
  private status: AutomationRunStatus;
  private reason: string | null;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: AutomationRunEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.automationId = props.automationId;
    this.triggerKey = props.triggerKey;
    this.taskId = props.taskId;
    this.status = props.status;
    this.reason = props.reason;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  getId(): string {
    return this._id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getAutomationId(): string {
    return this.automationId;
  }

  getTriggerKey(): string {
    return this.triggerKey;
  }

  getTaskId(): string {
    return this.taskId;
  }

  getStatus(): AutomationRunStatus {
    return this.status;
  }

  getReason(): string | null {
    return this.reason;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  toProps(): AutomationRunEntityProps {
    return {
      _id: this._id,
      workspaceId: this.workspaceId,
      automationId: this.automationId,
      triggerKey: this.triggerKey,
      taskId: this.taskId,
      status: this.status,
      reason: this.reason,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
