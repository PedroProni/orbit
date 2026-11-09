import { AuthSessionEntityProps } from '@domain/props/auth-session-entity.props';

export class AuthSessionEntity {
  constructor(private readonly props: AuthSessionEntityProps) {}

  getId(): string {
    return this.props._id;
  }

  getWorkspaceId(): string {
    return this.props.workspaceId;
  }

  getUserId(): string {
    return this.props.userId;
  }

  getIp(): string | null {
    return this.props.ip;
  }

  getUserAgent(): string | null {
    return this.props.userAgent;
  }

  getExpiresAt(): Date {
    return this.props.expiresAt;
  }

  getRevokedAt(): Date | null {
    return this.props.revokedAt;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }
}
