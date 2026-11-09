import { Inject, Injectable } from '@nestjs/common';
import { USER_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { UserRepository } from '@domain/repositories/user.repository';

@Injectable()
export class WorkspaceMembersService {
  constructor(@Inject(USER_INJECT_TOKEN) private readonly users: UserRepository) {}

  async allActive(workspaceId: string, userIds: string[]): Promise<boolean> {
    const unique = [...new Set(userIds)];
    if (unique.length === 0) return true;
    return (await this.users.count({ workspace_id: workspaceId, _id: { $in: unique }, status: 'active' })) === unique.length;
  }
}
