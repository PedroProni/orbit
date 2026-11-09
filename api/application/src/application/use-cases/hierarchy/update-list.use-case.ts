import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FOLDER_INJECT_TOKEN, TASK_LIST_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { FolderRepository } from '@domain/repositories/folder.repository';
import { TaskListRepository } from '@domain/repositories/task-list.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { guardDomain } from '@common/helpers/functions/domain-guard.helper';
import { AuditService } from '@application/services/audit.service';
import { UpdateListCommand } from '@application/commands/hierarchy/update-list.command';
import { HierarchyPresenter } from '@application/presenters/hierarchy.presenter';

@Injectable()
export class UpdateListUseCase {
  constructor(
    @Inject(FOLDER_INJECT_TOKEN) private readonly folders: FolderRepository,
    @Inject(TASK_LIST_INJECT_TOKEN) private readonly lists: TaskListRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(principal: AuthPrincipal, listId: string, command: UpdateListCommand) {
    const list = await this.lists.findByIdInWorkspace(listId, principal.workspaceId);
    if (!list) throw new NotFoundException('List not found');
    if (command.name !== undefined) guardDomain(() => list.rename(command.name!));
    if (command.folderId !== undefined) {
      if (command.folderId) {
        const folder = await this.folders.findByIdInWorkspace(command.folderId, principal.workspaceId);
        if (!folder || folder.getSpaceId() !== list.getSpaceId()) throw new BadRequestException('Folder does not belong to the space');
      }
      list.moveToFolder(command.folderId);
    }
    if (command.startDate !== undefined || command.endDate !== undefined) {
      guardDomain(() => list.setDates(command.startDate !== undefined ? command.startDate : list.getStartDate(), command.endDate !== undefined ? command.endDate : list.getEndDate()));
    }
    const saved = await this.lists.update(list);
    await this.audit.record(principal, 'list.updated', 'list', listId, { fields: Object.keys(command) });
    return HierarchyPresenter.list(saved);
  }
}
