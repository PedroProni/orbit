import { Inject, Injectable } from '@nestjs/common';
import { USER_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { UserRepository } from '@domain/repositories/user.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { UserPresenter } from '@application/presenters/user.presenter';

@Injectable()
export class ListUsersUseCase {
  constructor(@Inject(USER_INJECT_TOKEN) private readonly users: UserRepository) {}

  async execute(principal: AuthPrincipal) {
    const rows = await this.users.findMany({ workspace_id: principal.workspaceId }, { name: 1 });
    return rows.map(UserPresenter.toView);
  }
}
