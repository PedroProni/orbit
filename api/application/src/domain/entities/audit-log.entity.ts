import { AuditActorType } from '@domain/enums/audit-log.enums';
import { AuditLogEntityProps } from '@domain/props/audit-log-entity.props';

export class AuditLogEntity {
  private readonly _id: string;
  private workspaceId: string;
  private actorType: AuditActorType;
  private actorId: string;
  private action: string;
  private entityType: string;
  private entityId: string;
  private meta: Record<string, unknown>;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: AuditLogEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.actorType = props.actorType;
    this.actorId = props.actorId;
    this.action = props.action;
    this.entityType = props.entityType;
    this.entityId = props.entityId;
    this.meta = props.meta;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  getId(): string {
    return this._id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getActorType(): AuditActorType {
    return this.actorType;
  }

  getActorId(): string {
    return this.actorId;
  }

  getAction(): string {
    return this.action;
  }

  getEntityType(): string {
    return this.entityType;
  }

  getEntityId(): string {
    return this.entityId;
  }

  getMeta(): Record<string, unknown> {
    return this.meta;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  toProps(): AuditLogEntityProps {
    return { _id: this._id, workspaceId: this.workspaceId, actorType: this.actorType, actorId: this.actorId, action: this.action, entityType: this.entityType, entityId: this.entityId, meta: this.meta, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
