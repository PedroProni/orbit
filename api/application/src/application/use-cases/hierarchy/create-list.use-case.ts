import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SPACE_INJECT_TOKEN, FOLDER_INJECT_TOKEN, TASK_LIST_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { SpaceRepository } from '@domain/repositories/space.repository';
import { FolderRepository } from '@domain/repositories/folder.repository';
import { TaskListRepository } from '@domain/repositories/task-list.repository';
import { TaskListEntity } from '@domain/entities/task-list.entity';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { guardDomain } from '@common/helpers/functions/domain-guard.helper';
import { newId } from '@common/helpers/functions/id.helper';
import { AuditService } from '@application/services/audit.service';
import { CreateListCommand } from '@application/commands/hierarchy/create-list.command';
import { HierarchyPresenter } from '@application/presenters/hierarchy.presenter';

@Injectable()
export class CreateListUseCase {
  constructor(
    @Inject(SPACE_INJECT_TOKEN) private readonly spaces: SpaceRepository,
    @Inject(FOLDER_INJECT_TOKEN) private readonly folders: FolderRepository,
    @Inject(TASK_LIST_INJECT_TOKEN) private readonly lists: TaskListRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(principal: AuthPrincipal, command: CreateListCommand) {
    const space = await this.spaces.findByIdInWorkspace(command.spaceId, principal.workspaceId);
    if (!space) throw new NotFoundException('Space not found');
    if (command.folderId) {
      const folder = await this.folders.findByIdInWorkspace(command.folderId, principal.workspaceId);
      if (!folder || folder.getSpaceId() !== space.getId()) throw new BadRequestException('Folder does not belong to the space');
    }
    const now = new Date();
    const order = await this.lists.count({ space_id: space.getId(), folder_id: command.folderId });
    const entity = new TaskListEntity({ _id: newId(), workspaceId: principal.workspaceId, spaceId: space.getId(), folderId: command.folderId, name: command.name.trim(), kind: command.kind, startDate: null, endDate: null, order, clickupId: null, createdAt: now, updatedAt: now });
    guardDomain(() => entity.setDates(command.startDate, command.endDate));
    const saved = await this.lists.create(entity);
    await this.audit.record(principal, 'list.created', 'list', saved.getId(), { name: saved.getName(), kind: saved.getKind() });
    return HierarchyPresenter.list(saved);
  }
}
