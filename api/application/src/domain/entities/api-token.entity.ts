import { ApiTokenEntityProps } from '@domain/props/api-token-entity.props';

export class ApiTokenEntity {
  private readonly _id: string;
  private workspaceId: string;
  private userId: string;
  private name: string;
  private tokenHash: string;
  private scopes: string[];
  private lastUsedAt: Date | null;
  private revokedAt: Date | null;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: ApiTokenEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.userId = props.userId;
    this.name = props.name;
    this.tokenHash = props.tokenHash;
    this.scopes = props.scopes;
    this.lastUsedAt = props.lastUsedAt;
    this.revokedAt = props.revokedAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  getId(): string {
    return this._id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getUserId(): string {
    return this.userId;
  }

  getName(): string {
    return this.name;
  }

  getTokenHash(): string {
    return this.tokenHash;
  }

  getScopes(): string[] {
    return this.scopes;
  }

  getLastUsedAt(): Date | null {
    return this.lastUsedAt;
  }

  getRevokedAt(): Date | null {
    return this.revokedAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  revoke(): void {
    if (this.revokedAt) throw new Error('Token already revoked');
    this.revokedAt = new Date();
    this.updatedAt = new Date();
  }

  isActive(): boolean {
    return this.revokedAt === null;
  }

  touch(): void {
    this.lastUsedAt = new Date();
  }

  toProps(): ApiTokenEntityProps {
    return { _id: this._id, workspaceId: this.workspaceId, userId: this.userId, name: this.name, tokenHash: this.tokenHash, scopes: this.scopes, lastUsedAt: this.lastUsedAt, revokedAt: this.revokedAt, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
