import { Inject, Injectable } from '@nestjs/common';
import { SPACE_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { SpaceRepository } from '@domain/repositories/space.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { SpaceFactory } from '@application/services/space.factory';
import { AuditService } from '@application/services/audit.service';
import { CreateSpaceCommand } from '@application/commands/hierarchy/create-space.command';
import { HierarchyPresenter } from '@application/presenters/hierarchy.presenter';

@Injectable()
export class CreateSpaceUseCase {
  constructor(
    @Inject(SPACE_INJECT_TOKEN) private readonly spaces: SpaceRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(principal: AuthPrincipal, command: CreateSpaceCommand) {
    const saved = await this.spaces.create(SpaceFactory.createDefault(principal.workspaceId, command.name.trim()));
    await this.audit.record(principal, 'space.created', 'space', saved.getId(), { name: saved.getName() });
    return HierarchyPresenter.space(saved);
  }
}
