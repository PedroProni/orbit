import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { UserRepository } from '@domain/repositories/user.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { UserRole } from '@domain/enums/user.enums';
import { RolePolicy } from '@domain/policies/role.policy';
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
    if (!RolePolicy.canChangeRole(principal.role, target.getRole(), role)) throw new ForbiddenException('Role change not allowed');
    if (target.getRole() === UserRole.OWNER && role !== UserRole.OWNER) {
      const owners = await this.users.count({ workspace_id: principal.workspaceId, role: UserRole.OWNER, status: 'active' });
      if (owners <= 1) throw new BadRequestException('Workspace needs at least one owner');
    }
    const before = target.getRole();
    target.changeRole(role);
    const saved = await this.users.update(target);
    await this.audit.record(principal, 'user.role_changed', 'user', userId, { before, after: role });
    return UserPresenter.toView(saved);
  }
}
