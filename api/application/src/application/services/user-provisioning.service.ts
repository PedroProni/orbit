import { Inject, Injectable } from '@nestjs/common';
import { USER_INJECT_TOKEN, WORKSPACE_INJECT_TOKEN, SPACE_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { UserRepository } from '@domain/repositories/user.repository';
import { WorkspaceRepository } from '@domain/repositories/workspace.repository';
import { SpaceRepository } from '@domain/repositories/space.repository';
import { UserEntity } from '@domain/entities/user.entity';
import { WorkspaceEntity } from '@domain/entities/workspace.entity';
import { UserRole, UserStatus } from '@domain/enums/user.enums';
import { APP_NAME, DEFAULT_SPACE_NAME } from '@domain/constants/app.constant';
import { USER_PROFILE_FIELDS, USER_PROFILE_WITH_CLICKUP_FIELDS } from '@domain/constants/user-patch-fields.constant';
import { VerifiedIdentity } from '@domain/types/verified-identity.type';
import { ProvisionOptions } from '@domain/types/provision-options.type';
import { newId } from '@common/helpers/functions/id.helper';
import { SpaceFactory } from '@application/services/space.factory';

@Injectable()
export class UserProvisioningService {
  constructor(
    @Inject(USER_INJECT_TOKEN) private readonly users: UserRepository,
    @Inject(WORKSPACE_INJECT_TOKEN) private readonly workspaces: WorkspaceRepository,
    @Inject(SPACE_INJECT_TOKEN) private readonly spaces: SpaceRepository,
  ) {}

  async provision(identity: VerifiedIdentity, options: ProvisionOptions = {}): Promise<UserEntity> {
    const email = identity.email.toLowerCase();
    const existing = await this.users.findOne({ email });
    if (existing) {
      existing.updateProfile(identity.name || existing.getName(), identity.avatarUrl);
      if (options.clickupId) existing.setClickupId(options.clickupId);
      return this.users.patch(existing, options.clickupId ? USER_PROFILE_WITH_CLICKUP_FIELDS : USER_PROFILE_FIELDS);
    }
    const slug = options.workspaceSlug || 'main';
    let workspace = await this.workspaces.findOne({ slug });
    let role = options.role ?? UserRole.MEMBER;
    const now = new Date();
    if (!workspace) {
      workspace = await this.workspaces.create(new WorkspaceEntity({ _id: newId(), name: APP_NAME, slug, createdAt: now, updatedAt: now }));
      await this.spaces.create(SpaceFactory.createDefault(workspace.getId(), DEFAULT_SPACE_NAME));
      role = UserRole.OWNER;
    }
    return this.users.create(
      new UserEntity({
        _id: newId(),
        workspaceId: workspace.getId(),
        email,
        name: identity.name || email,
        avatarUrl: identity.avatarUrl,
        clickupId: options.clickupId ?? null,
        role,
        status: UserStatus.ACTIVE,
        createdAt: now,
        updatedAt: now,
      }),
    );
  }
}
