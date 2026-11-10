import { UserRole } from '@domain/enums/user.enums';
import { UserStatus } from '@domain/enums/user.enums';
import { UserEntityProps } from '@domain/props/user-entity.props';

export class UserEntity {
  private readonly _id: string;
  private workspaceId: string;
  private email: string;
  private name: string;
  private avatarUrl: string | null;
  private clickupId: string | null;
  private role: UserRole;
  private status: UserStatus;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: UserEntityProps) {
    this._id = props._id;
    this.workspaceId = props.workspaceId;
    this.email = props.email;
    this.name = props.name;
    this.avatarUrl = props.avatarUrl;
    this.clickupId = props.clickupId ?? null;
    this.role = props.role;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  getId(): string {
    return this._id;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  getEmail(): string {
    return this.email;
  }

  getName(): string {
    return this.name;
  }

  getAvatarUrl(): string | null {
    return this.avatarUrl;
  }

  getRole(): UserRole {
    return this.role;
  }

  getStatus(): UserStatus {
    return this.status;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getClickupId(): string | null {
    return this.clickupId;
  }

  setClickupId(clickupId: string | null): void {
    this.clickupId = clickupId;
  }

  updateProfile(name: string, avatarUrl: string | null): void {
    if (!name || name.trim().length === 0) throw new Error('Name cannot be empty');
    this.name = name.trim();
    this.avatarUrl = avatarUrl;
    this.updatedAt = new Date();
  }

  disable(): void {
    this.status = UserStatus.DISABLED;
    this.updatedAt = new Date();
  }

  enable(): void {
    this.status = UserStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  toProps(): UserEntityProps {
    return {
      _id: this._id,
      workspaceId: this.workspaceId,
      email: this.email,
      name: this.name,
      avatarUrl: this.avatarUrl,
      clickupId: this.clickupId,
      role: this.role,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
