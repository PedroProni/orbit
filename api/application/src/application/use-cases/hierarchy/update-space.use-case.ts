import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SPACE_INJECT_TOKEN, TASK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { SpaceRepository } from '@domain/repositories/space.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { guardDomain } from '@common/helpers/functions/domain-guard.helper';
import { AuditService } from '@application/services/audit.service';
import { UpdateSpaceCommand } from '@application/commands/hierarchy/update-space.command';
import { HierarchyPresenter } from '@application/presenters/hierarchy.presenter';

@Injectable()
export class UpdateSpaceUseCase {
  constructor(
    @Inject(SPACE_INJECT_TOKEN) private readonly spaces: SpaceRepository,
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(principal: AuthPrincipal, spaceId: string, command: UpdateSpaceCommand) {
    const space = await this.spaces.findByIdInWorkspace(spaceId, principal.workspaceId);
    if (!space) throw new NotFoundException('Space not found');
    if (command.name !== undefined) guardDomain(() => space.rename(command.name!));
    if (command.statuses) {
      const keep = new Set(command.statuses.map((s) => s.name.trim()));
      const removed = space.getStatuses().map((s) => s.name).filter((name) => !keep.has(name));
      if (removed.length > 0 && (await this.tasks.count({ space_id: spaceId, status: { $in: removed } })) > 0) throw new BadRequestException('Cannot remove a status that is in use');
      guardDomain(() => space.replaceStatuses(command.statuses!));
    }
    if (command.requiredTags || command.titlePrefixes) guardDomain(() => space.updateRules(command.requiredTags ?? space.getRequiredTags(), command.titlePrefixes ?? space.getTitlePrefixes()));
    const saved = await this.spaces.update(space);
    await this.audit.record(principal, 'space.updated', 'space', spaceId, { fields: Object.keys(command) });
    return HierarchyPresenter.space(saved);
  }
}
