import { Inject, Injectable } from '@nestjs/common';
import { USER_CREDENTIAL_INJECT_TOKEN, USER_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { UserRepository } from '@domain/repositories/user.repository';
import { UserCredentialRepository } from '@domain/repositories/user-credential.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { UserPresenter } from '@application/presenters/user.presenter';

@Injectable()
export class ListUserAccessUseCase {
  constructor(
    @Inject(USER_INJECT_TOKEN) private readonly users: UserRepository,
    @Inject(USER_CREDENTIAL_INJECT_TOKEN) private readonly credentials: UserCredentialRepository,
  ) {}

  async execute(principal: AuthPrincipal) {
    const [users, credentials] = await Promise.all([this.users.findMany({ workspace_id: principal.workspaceId }, { name: 1 }), this.credentials.findMany({ workspace_id: principal.workspaceId })]);
    const withPassword = new Set(credentials.map(credential => credential.getId()));
    return users.map(user => ({ ...UserPresenter.toView(user), hasPassword: withPassword.has(user.getId()) }));
  }
}
