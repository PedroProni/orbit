import { ApiTokenAccessPolicy } from '@domain/policies/api-token-access.policy';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { API_TOKEN_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { ApiTokenRepository } from '@domain/repositories/api-token.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AuditService } from '@application/services/audit.service';

@Injectable()
export class RevokeApiTokenUseCase {
  constructor(
    @Inject(API_TOKEN_INJECT_TOKEN) private readonly tokens: ApiTokenRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(principal: AuthPrincipal, tokenId: string): Promise<void> {
    const token = await this.tokens.findByIdInWorkspace(tokenId, principal.workspaceId);
    if (!token || !ApiTokenAccessPolicy.canManage(principal, token.getUserId())) throw new NotFoundException('Token not found');
    if (!token.isActive() || !(await this.tokens.revokeIfActive(token.getId(), principal.workspaceId, new Date()))) throw new BadRequestException('Token already revoked');
    await this.audit.record(principal, 'token.revoked', 'api_token', tokenId);
  }
}
