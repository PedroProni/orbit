import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { UserRepository } from '@domain/repositories/user.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { UserRole } from '@domain/enums/user.enums';
import { AccountAccessPolicy } from '@domain/policies/account-access.policy';
import { AuditService } from '@application/services/audit.service';
import { UserPresenter } from '@application/presenters/user.presenter';

@Injectable()
export class ChangeUserRoleUseCase {
  constructor(
    @Inject(USER_INJECT_TOKEN) private readonly users: UserRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(principal: AuthPrincipal, userId: string, role: UserRole) {
    const target = await this.users.findByIdInWorkspace(userId, principal.workspaceId);
    if (!target) throw new NotFoundException('User not found');
    if (!AccountAccessPolicy.canChangeRole(principal, target.getId(), target.getRole(), role)) throw new ForbiddenException('Role change not allowed');
    if (target.getRole() === UserRole.OWNER && role !== UserRole.OWNER) {
      const owners = await this.users.count({ workspace_id: principal.workspaceId, role: UserRole.OWNER, status: 'active' });
      if (owners <= 1) throw new BadRequestException('Workspace needs at least one owner');
    }
    const before = target.getRole();
    const saved = await this.users.changeRoleIfCurrent(userId, principal.workspaceId, before, role);
    if (!saved) throw new ConflictException('Role changed meanwhile');
    await this.audit.record(principal, 'user.role_changed', 'user', userId, { before, after: role });
    return UserPresenter.toView(saved);
  }
}
