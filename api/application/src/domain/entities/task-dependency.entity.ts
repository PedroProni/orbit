import { TaskDependencyEntityProps } from '@domain/props/task-dependency-entity.props';

export class TaskDependencyEntity {
  private readonly _id: string;
  private workspaceId: string;
  private taskId: string;
  private dependsOnId: string;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: TaskDependencyEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.taskId = props.taskId;
    this.dependsOnId = props.dependsOnId;
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

  getDependsOnId(): string {
    return this.dependsOnId;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  toProps(): TaskDependencyEntityProps {
    return { _id: this._id, workspaceId: this.workspaceId, taskId: this.taskId, dependsOnId: this.dependsOnId, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
