import { TaskPriority } from '@domain/enums/task.enums';
import { TaskKind } from '@domain/enums/task-kind.enums';
import { TaskTemplateEntityProps } from '@domain/props/task-template-entity.props';

export class TaskTemplateEntity {
  private readonly _id: string;
  private workspaceId: string;
  private spaceId: string;
  private name: string;
  private titleTemplate: string;
  private descriptionMd: string;
  private tags: string[];
  private priority: TaskPriority | null;
  private taskKind: TaskKind;
  private estimateMinutes: number | null;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: TaskTemplateEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.spaceId = props.spaceId;
    this.name = props.name;
    this.titleTemplate = props.titleTemplate;
    this.descriptionMd = props.descriptionMd;
    this.tags = props.tags;
    this.priority = props.priority;
    this.taskKind = props.taskKind;
    this.estimateMinutes = props.estimateMinutes;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  getId(): string {
    return this._id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getSpaceId(): string {
    return this.spaceId;
  }

  getName(): string {
    return this.name;
  }

  getTitleTemplate(): string {
    return this.titleTemplate;
  }

  getDescriptionMd(): string {
    return this.descriptionMd;
  }

  getTags(): string[] {
    return this.tags;
  }

  getPriority(): TaskPriority | null {
    return this.priority;
  }

  getTaskKind(): TaskKind {
    return this.taskKind;
  }

  getEstimateMinutes(): number | null {
    return this.estimateMinutes;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  apply(name: string, titleTemplate: string, descriptionMd: string, tags: string[], priority: TaskPriority | null, taskKind: TaskKind, estimateMinutes: number | null): void {
    if (!name.trim() || !titleTemplate.trim()) throw new Error('Template name and title are required');
    this.name = name.trim();
    this.titleTemplate = titleTemplate.trim();
    this.descriptionMd = descriptionMd;
    this.tags = [...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean))];
    this.priority = priority;
    this.taskKind = taskKind;
    this.estimateMinutes = estimateMinutes;
    this.updatedAt = new Date();
  }

  toProps(): TaskTemplateEntityProps {
    return { _id: this._id, workspaceId: this.workspaceId, spaceId: this.spaceId, name: this.name, titleTemplate: this.titleTemplate, descriptionMd: this.descriptionMd, tags: this.tags, priority: this.priority, taskKind: this.taskKind, estimateMinutes: this.estimateMinutes, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
