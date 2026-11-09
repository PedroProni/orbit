import { createHash, randomBytes } from 'node:crypto';
import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { API_TOKEN_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { ApiTokenRepository } from '@domain/repositories/api-token.repository';
import { ApiTokenEntity } from '@domain/entities/api-token.entity';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { ALL_SCOPES } from '@domain/constants/scopes.constant';
import { API_TOKEN_PREFIX } from '@domain/constants/app.constant';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { newId } from '@common/helpers/functions/id.helper';
import { AuditService } from '@application/services/audit.service';
import { CreateApiTokenCommand } from '@application/commands/token/create-api-token.command';
import { ApiTokenPresenter } from '@application/presenters/api-token.presenter';

@Injectable()
export class CreateApiTokenUseCase {
  constructor(
    @Inject(API_TOKEN_INJECT_TOKEN) private readonly tokens: ApiTokenRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(principal: AuthPrincipal, command: CreateApiTokenCommand) {
    if (principal.actorType !== AuditActorType.USER) throw new ForbiddenException('Tokens can only be created by a user session');
    const scopes = [...new Set(command.scopes)];
    if (scopes.length === 0) throw new BadRequestException('At least one scope is required');
    if (scopes.some((s) => !ALL_SCOPES.includes(s))) throw new BadRequestException('Unknown scope');
    if (scopes.some((s) => !principal.scopes.includes(s))) throw new ForbiddenException('Cannot grant a scope you do not hold');
    const plain = `${API_TOKEN_PREFIX}${randomBytes(24).toString('hex')}`;
    const now = new Date();
    const entity = await this.tokens.create(
      new ApiTokenEntity({ _id: newId(), workspaceId: principal.workspaceId, userId: principal.userId, name: command.name.trim(), tokenHash: createHash('sha256').update(plain).digest('hex'), scopes, lastUsedAt: null, revokedAt: null, createdAt: now, updatedAt: now }),
    );
    await this.audit.record(principal, 'token.created', 'api_token', entity.getId(), { name: entity.getName(), scopes });
    return { ...ApiTokenPresenter.toView(entity), token: plain };
  }
}
