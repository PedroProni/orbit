import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_GROUP_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { UserGroupRepository } from '@domain/repositories/user-group.repository';
import { UserGroupEntity } from '@domain/entities/user-group.entity';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { guardDomain } from '@common/helpers/functions/domain-guard.helper';
import { newId } from '@common/helpers/functions/id.helper';
import { AuditService } from '@application/services/audit.service';
import { WorkspaceMembersService } from '@application/services/workspace-members.service';
import { SaveGroupDto } from '@shared/dtos/group/save-group.dto';

@Injectable()
export class UserGroupsUseCase {
  constructor(
    @Inject(USER_GROUP_INJECT_TOKEN) private readonly groups: UserGroupRepository,
    private readonly members: WorkspaceMembersService,
    private readonly audit: AuditService,
  ) {}

  async list(principal: AuthPrincipal) {
    return (await this.groups.findMany({ workspace_id: principal.workspaceId }, { name: 1 })).map(UserGroupsUseCase.view);
  }

  async create(principal: AuthPrincipal, dto: SaveGroupDto) {
    await this.assertMembers(principal, dto);
    const now = new Date();
    const group = new UserGroupEntity({ _id: newId(), workspaceId: principal.workspaceId, name: 'x', memberIds: [], createdAt: now, updatedAt: now });
    guardDomain(() => group.rewrite(dto.name, dto.memberIds));
    const saved = await this.groups.create(group);
    await this.audit.record(principal, 'group.created', 'group', saved.getId(), {});
    return UserGroupsUseCase.view(saved);
  }

  async update(principal: AuthPrincipal, id: string, dto: SaveGroupDto) {
    const group = await this.find(principal, id);
    await this.assertMembers(principal, dto);
    guardDomain(() => group.rewrite(dto.name, dto.memberIds));
    return UserGroupsUseCase.view(await this.groups.update(group));
  }

  async remove(principal: AuthPrincipal, id: string) {
    await this.find(principal, id);
    await this.groups.delete(id);
    await this.audit.record(principal, 'group.deleted', 'group', id, {});
  }

  private async assertMembers(principal: AuthPrincipal, dto: SaveGroupDto): Promise<void> {
    if (!(await this.members.allActive(principal.workspaceId, dto.memberIds))) throw new NotFoundException('Unknown user in members');
  }

  private async find(principal: AuthPrincipal, id: string): Promise<UserGroupEntity> {
    const group = await this.groups.findByIdInWorkspace(id, principal.workspaceId);
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  private static view(g: UserGroupEntity) {
    return { id: g.getId(), name: g.getName(), memberIds: g.getMemberIds() };
  }
}
