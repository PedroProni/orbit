import { RecurrenceFrequency } from '@domain/enums/recurrence.enums';
import { RecurrenceRuleEntityProps } from '@domain/props/recurrence-rule-entity.props';

export class RecurrenceRuleEntity {
  private readonly _id: string;
  private workspaceId: string;
  private taskId: string;
  private frequency: RecurrenceFrequency;
  private interval: number;
  private nextRunAt: Date;
  private active: boolean;
  private lastCreatedTaskId: string | null;
  private createdBy: string;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: RecurrenceRuleEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.taskId = props.taskId;
    this.frequency = props.frequency;
    this.interval = props.interval;
    this.nextRunAt = props.nextRunAt;
    this.active = props.active;
    this.lastCreatedTaskId = props.lastCreatedTaskId;
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

  getTaskId(): string {
    return this.taskId;
  }

  getFrequency(): RecurrenceFrequency {
    return this.frequency;
  }

  getInterval(): number {
    return this.interval;
  }

  getNextRunAt(): Date {
    return this.nextRunAt;
  }

  getActive(): boolean {
    return this.active;
  }

  getLastCreatedTaskId(): string | null {
    return this.lastCreatedTaskId;
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

  change(frequency: RecurrenceFrequency, interval: number, nextRunAt: Date): void {
    if (!Number.isInteger(interval) || interval < 1 || interval > 365) throw new Error('Interval must be between 1 and 365');
    this.frequency = frequency;
    this.interval = interval;
    this.nextRunAt = nextRunAt;
    this.active = true;
    this.updatedAt = new Date();
  }

  recordRun(createdTaskId: string | null, nextRunAt: Date): void {
    this.lastCreatedTaskId = createdTaskId;
    this.nextRunAt = nextRunAt;
    this.updatedAt = new Date();
  }

  toProps(): RecurrenceRuleEntityProps {
    return { _id: this._id, workspaceId: this.workspaceId, taskId: this.taskId, frequency: this.frequency, interval: this.interval, nextRunAt: this.nextRunAt, active: this.active, lastCreatedTaskId: this.lastCreatedTaskId, createdBy: this.createdBy, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
