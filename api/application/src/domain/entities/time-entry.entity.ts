import { TimeEntryEntityProps } from '@domain/props/time-entry-entity.props';

export class TimeEntryEntity {
  private readonly _id: string;
  private workspaceId: string;
  private taskId: string;
  private userId: string;
  private startedAt: Date;
  private endedAt: Date | null;
  private minutes: number;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: TimeEntryEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.taskId = props.taskId;
    this.userId = props.userId;
    this.startedAt = props.startedAt;
    this.endedAt = props.endedAt;
    this.minutes = props.minutes;
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

  getUserId(): string {
    return this.userId;
  }

  getStartedAt(): Date {
    return this.startedAt;
  }

  getEndedAt(): Date | null {
    return this.endedAt;
  }

  getMinutes(): number {
    return this.minutes;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  isRunning(): boolean {
    return this.endedAt === null;
  }

  stop(at: Date): void {
    if (!this.isRunning()) throw new Error('Timer already stopped');
    this.endedAt = at;
    this.minutes = Math.max(1, Math.round((at.getTime() - this.startedAt.getTime()) / 60000));
    this.updatedAt = at;
  }

  toProps(): TimeEntryEntityProps {
    return { _id: this._id, workspaceId: this.workspaceId, taskId: this.taskId, userId: this.userId, startedAt: this.startedAt, endedAt: this.endedAt, minutes: this.minutes, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
