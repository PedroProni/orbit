import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { UserRepository } from '@domain/repositories/user.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { UserPresenter } from '@application/presenters/user.presenter';

@Injectable()
export class GetMeUseCase {
  constructor(@Inject(USER_INJECT_TOKEN) private readonly users: UserRepository) {}

  async execute(principal: AuthPrincipal) {
    const user = await this.users.findByIdInWorkspace(principal.userId, principal.workspaceId);
    if (!user) throw new NotFoundException('User not found');
    return { ...UserPresenter.toView(user), scopes: principal.scopes };
  }
}
