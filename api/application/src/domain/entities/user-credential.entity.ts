import { UserCredentialEntityProps } from '@domain/props/user-credential-entity.props';

export class UserCredentialEntity {
  constructor(private readonly props: UserCredentialEntityProps) {}

  getId(): string {
    return this.props._id;
  }

  getWorkspaceId(): string {
    return this.props.workspaceId;
  }

  getPasswordHash(): string {
    return this.props.passwordHash;
  }

  getPasswordChangedAt(): Date {
    return this.props.passwordChangedAt;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }
}
