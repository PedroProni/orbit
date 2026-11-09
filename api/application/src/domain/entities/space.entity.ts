import { StatusType } from '@domain/enums/space.enums';
import { TaskStatusDefinition } from '@domain/types/task-status-definition.type';
import { StatusAliasPolicy } from '@domain/policies/status-alias.policy';
import { DefaultStatusPolicy } from '@domain/policies/default-status.policy';
import { SpaceEntityProps } from '@domain/props/space-entity.props';

export class SpaceEntity {
  private readonly _id: string;
  private workspaceId: string;
  private name: string;
  private statuses: TaskStatusDefinition[];
  private requiredTags: string[];
  private titlePrefixes: string[];
  private nextTaskSeq: number;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: SpaceEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.name = props.name;
    this.statuses = props.statuses;
    this.requiredTags = props.requiredTags;
    this.titlePrefixes = props.titlePrefixes;
    this.nextTaskSeq = props.nextTaskSeq;
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

  getStatuses(): TaskStatusDefinition[] {
    return this.statuses;
  }

  getRequiredTags(): string[] {
    return this.requiredTags;
  }

  getTitlePrefixes(): string[] {
    return this.titlePrefixes;
  }

  getNextTaskSeq(): number {
    return this.nextTaskSeq;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  rename(name: string): void {
    if (!name || name.trim().length === 0) throw new Error('Name cannot be empty');
    this.name = name.trim();
    this.updatedAt = new Date();
  }

  replaceStatuses(statuses: TaskStatusDefinition[]): void {
    const names = statuses.map((s) => s.name.trim().toLowerCase());
    if (statuses.some((s) => !s.name || s.name.trim().length === 0)) throw new Error('Status name cannot be empty');
    if (new Set(names).size !== names.length) throw new Error('Status names must be unique');
    if (!statuses.some((s) => s.type === StatusType.OPEN)) throw new Error('At least one open status is required');
    if (!statuses.some((s) => s.type === StatusType.DONE || s.type === StatusType.CLOSED)) throw new Error('At least one done or closed status is required');
    this.statuses = DefaultStatusPolicy.lock(statuses).map((s, index) => ({ name: s.name.trim(), color: s.color, type: s.type, order: index }));
    this.updatedAt = new Date();
  }

  updateRules(requiredTags: string[], titlePrefixes: string[]): void {
    this.requiredTags = [...new Set(requiredTags.map((t) => t.trim().toLowerCase()).filter(Boolean))];
    this.titlePrefixes = [...new Set(titlePrefixes.map((p) => p.trim()).filter(Boolean))];
    this.updatedAt = new Date();
  }

  hasStatus(name: string): boolean {
    return this.statuses.some((s) => s.name === name);
  }

  resolveStatus(name: string): string | null {
    if (this.hasStatus(name)) return name;
    const wanted = name.trim().toLowerCase();
    const sameName = this.statuses.find((s) => s.name.toLowerCase() === wanted);
    if (sameName) return sameName.name;
    const canonical = StatusAliasPolicy.canonical(name);
    return canonical && this.hasStatus(canonical) ? canonical : null;
  }

  firstOpenStatus(): string {
    return [...this.statuses].sort((a, b) => a.order - b.order).find((s) => s.type === StatusType.OPEN)!.name;
  }

  isClosedStatus(name: string): boolean {
    const found = this.statuses.find((s) => s.name === name);
    return !!found && (found.type === StatusType.DONE || found.type === StatusType.CLOSED);
  }

  toProps(): SpaceEntityProps {
    return { _id: this._id, workspaceId: this.workspaceId, name: this.name, statuses: this.statuses, requiredTags: this.requiredTags, titlePrefixes: this.titlePrefixes, nextTaskSeq: this.nextTaskSeq, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
