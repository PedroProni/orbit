import { Inject, Injectable } from '@nestjs/common';
import { USER_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { UserRepository } from '@domain/repositories/user.repository';
import { UserEntity } from '@domain/entities/user.entity';
import { CLICKUP_USER_COLOR } from '@domain/constants/clickup-compat.constant';

@Injectable()
export class ClickupUserResolver {
  constructor(@Inject(USER_INJECT_TOKEN) private readonly users: UserRepository) {}

  async toInternalIds(workspaceId: string, external: Array<string | number>): Promise<string[]> {
    if (external.length === 0) return [];
    const keys = external.map(String);
    const found = await this.users.findMany({ workspace_id: workspaceId, $or: [{ _id: { $in: keys } }, { clickup_id: { $in: keys } }] });
    return found.map((u) => u.getId());
  }

  externalId(user: UserEntity): string | number {
    const clickup = user.getClickupId();
    if (clickup && /^\d+$/.test(clickup)) return Number(clickup);
    return clickup ?? user.getId();
  }

  toView(user: UserEntity) {
    const name = user.getName();
    return { id: this.externalId(user), username: name, email: user.getEmail(), color: CLICKUP_USER_COLOR, initials: name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase(), profilePicture: user.getAvatarUrl() };
  }
}
