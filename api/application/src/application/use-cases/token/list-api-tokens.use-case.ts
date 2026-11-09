import { ApiTokenAccessPolicy } from '@domain/policies/api-token-access.policy';
import { Inject, Injectable } from '@nestjs/common';
import { API_TOKEN_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { ApiTokenRepository } from '@domain/repositories/api-token.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { ApiTokenPresenter } from '@application/presenters/api-token.presenter';

@Injectable()
export class ListApiTokensUseCase {
  constructor(@Inject(API_TOKEN_INJECT_TOKEN) private readonly tokens: ApiTokenRepository) {}

  async execute(principal: AuthPrincipal) {
    const rows = await this.tokens.findMany(ApiTokenAccessPolicy.seesAll(principal) ? { workspace_id: principal.workspaceId } : { workspace_id: principal.workspaceId, user_id: principal.userId });
    return rows.map(ApiTokenPresenter.toView);
  }
}
