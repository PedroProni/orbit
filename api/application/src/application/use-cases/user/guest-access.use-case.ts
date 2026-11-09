import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { GUEST_ACCESS_INJECT_TOKEN, TASK_LIST_INJECT_TOKEN, USER_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { GuestAccessRepository } from '@domain/repositories/guest-access.repository';
import { TaskListRepository } from '@domain/repositories/task-list.repository';
import { UserRepository } from '@domain/repositories/user.repository';
import { GuestAccessEntity } from '@domain/entities/guest-access.entity';
import { UserRole } from '@domain/enums/user.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { newId } from '@common/helpers/functions/id.helper';
import { AuditService } from '@application/services/audit.service';

@Injectable()
export class GuestAccessUseCase {
  constructor(
    @Inject(GUEST_ACCESS_INJECT_TOKEN) private readonly access: GuestAccessRepository,
    @Inject(TASK_LIST_INJECT_TOKEN) private readonly lists: TaskListRepository,
    @Inject(USER_INJECT_TOKEN) private readonly users: UserRepository,
    private readonly audit: AuditService,
  ) {}

  async get(principal: AuthPrincipal, userId: string) {
    await this.guest(principal, userId);
    const grant = await this.access.findOne({ workspace_id: principal.workspaceId, user_id: userId });
    return { userId, listIds: grant ? grant.getListIds() : [] };
  }

  async set(principal: AuthPrincipal, userId: string, listIds: string[]) {
    await this.guest(principal, userId);
    const unique = [...new Set(listIds)];
    if (unique.length && (await this.lists.count({ workspace_id: principal.workspaceId, _id: { $in: unique } })) !== unique.length) throw new NotFoundException('Unknown list');
    const existing = await this.access.findOne({ workspace_id: principal.workspaceId, user_id: userId });
    const now = new Date();
    const grant = existing ?? new GuestAccessEntity({ _id: newId(), workspaceId: principal.workspaceId, userId, listIds: [], createdAt: now, updatedAt: now });
    grant.replace(unique);
    if (existing) await this.access.update(grant);
    else await this.access.create(grant);
    await this.audit.record(principal, 'guest.access_set', 'user', userId, { listIds: unique });
    return { userId, listIds: unique };
  }

  private async guest(principal: AuthPrincipal, userId: string): Promise<void> {
    const user = await this.users.findByIdInWorkspace(userId, principal.workspaceId);
    if (!user) throw new NotFoundException('User not found');
    if (user.getRole() !== UserRole.GUEST) throw new BadRequestException('User is not a guest');
  }
}
