import { TaskKind } from '@domain/enums/task-kind.enums';
import { TaskPlanEntityProps } from '@domain/props/task-plan-entity.props';

export class TaskPlanEntity {
  private readonly _id: string;
  private workspaceId: string;
  private taskId: string;
  private estimateMinutes: number | null;
  private taskKind: TaskKind;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: TaskPlanEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.taskId = props.taskId;
    this.estimateMinutes = props.estimateMinutes;
    this.taskKind = props.taskKind;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  getId(): string {
    return this._id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getTaskId(): string {
    return this.taskId;
  }

  getEstimateMinutes(): number | null {
    return this.estimateMinutes;
  }

  getTaskKind(): TaskKind {
    return this.taskKind;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  change(estimateMinutes: number | null, taskKind: TaskKind): void {
    if (estimateMinutes !== null && (!Number.isInteger(estimateMinutes) || estimateMinutes < 0 || estimateMinutes > 600000)) throw new Error('Estimate must be an integer number of minutes between 0 and 600000');
    this.estimateMinutes = estimateMinutes;
    this.taskKind = taskKind;
    this.updatedAt = new Date();
  }

  toProps(): TaskPlanEntityProps {
    return { _id: this._id, workspaceId: this.workspaceId, taskId: this.taskId, estimateMinutes: this.estimateMinutes, taskKind: this.taskKind, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
