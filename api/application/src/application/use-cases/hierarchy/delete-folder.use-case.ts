import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FOLDER_INJECT_TOKEN, TASK_LIST_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { FolderRepository } from '@domain/repositories/folder.repository';
import { TaskListRepository } from '@domain/repositories/task-list.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AuditService } from '@application/services/audit.service';

@Injectable()
export class DeleteFolderUseCase {
  constructor(
    @Inject(FOLDER_INJECT_TOKEN) private readonly folders: FolderRepository,
    @Inject(TASK_LIST_INJECT_TOKEN) private readonly lists: TaskListRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(principal: AuthPrincipal, folderId: string): Promise<void> {
    const folder = await this.folders.findByIdInWorkspace(folderId, principal.workspaceId);
    if (!folder) throw new NotFoundException('Folder not found');
    if ((await this.lists.count({ folder_id: folderId })) > 0) throw new BadRequestException('Folder is not empty');
    await this.folders.delete(folderId);
    await this.audit.record(principal, 'folder.deleted', 'folder', folderId);
  }
}
