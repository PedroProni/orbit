import { GoalTargetKind } from '@domain/enums/goal.enums';
import { GoalTarget } from '@domain/types/goal-target.type';
import { GoalEntityProps } from '@domain/props/goal-entity.props';

export class GoalEntity {
  private readonly _id: string;
  private workspaceId: string;
  private name: string;
  private description: string;
  private ownerId: string;
  private dueDate: Date | null;
  private targets: GoalTarget[];
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: GoalEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.name = props.name;
    this.description = props.description;
    this.ownerId = props.ownerId;
    this.dueDate = props.dueDate;
    this.targets = props.targets;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  getId(): string {
    return this._id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getOwnerId(): string {
    return this.ownerId;
  }

  getDueDate(): Date | null {
    return this.dueDate;
  }

  getTargets(): GoalTarget[] {
    return this.targets;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  rewrite(name: string, description: string, dueDate: Date | null, targets: GoalTarget[]): void {
    if (!name.trim()) throw new Error('Goal name is required');
    if (targets.some((t) => t.kind !== GoalTargetKind.TASK && t.targetValue <= 0)) throw new Error('Targets need a positive target value');
    if (targets.some((t) => t.kind === GoalTargetKind.TASK && !t.taskId)) throw new Error('Task targets need a task');
    this.name = name.trim();
    this.description = description;
    this.dueDate = dueDate;
    this.targets = targets;
    this.updatedAt = new Date();
  }

  toProps(): GoalEntityProps {
    return { _id: this._id, workspaceId: this.workspaceId, name: this.name, description: this.description, ownerId: this.ownerId, dueDate: this.dueDate, targets: this.targets, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
