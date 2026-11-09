import { AuthTokenEntityProps } from '@domain/props/auth-token-entity.props';
import { AuthTokenKind } from '@domain/enums/auth-token.enums';

export class AuthTokenEntity {
  constructor(private readonly props: AuthTokenEntityProps) {}

  getId(): string {
    return this.props._id;
  }

  getWorkspaceId(): string {
    return this.props.workspaceId;
  }

  getUserId(): string {
    return this.props.userId;
  }

  getKind(): AuthTokenKind {
    return this.props.kind;
  }

  getTokenHash(): string {
    return this.props.tokenHash;
  }

  getExpiresAt(): Date {
    return this.props.expiresAt;
  }

  getUsedAt(): Date | null {
    return this.props.usedAt;
  }

  getCreatedBy(): string | null {
    return this.props.createdBy;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }
}
