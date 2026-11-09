import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SPACE_INJECT_TOKEN, FOLDER_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { SpaceRepository } from '@domain/repositories/space.repository';
import { FolderRepository } from '@domain/repositories/folder.repository';
import { FolderEntity } from '@domain/entities/folder.entity';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { newId } from '@common/helpers/functions/id.helper';
import { AuditService } from '@application/services/audit.service';
import { CreateFolderCommand } from '@application/commands/hierarchy/create-folder.command';
import { HierarchyPresenter } from '@application/presenters/hierarchy.presenter';

@Injectable()
export class CreateFolderUseCase {
  constructor(
    @Inject(SPACE_INJECT_TOKEN) private readonly spaces: SpaceRepository,
    @Inject(FOLDER_INJECT_TOKEN) private readonly folders: FolderRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(principal: AuthPrincipal, command: CreateFolderCommand) {
    const space = await this.spaces.findByIdInWorkspace(command.spaceId, principal.workspaceId);
    if (!space) throw new NotFoundException('Space not found');
    const order = await this.folders.count({ space_id: space.getId() });
    const now = new Date();
    const saved = await this.folders.create(new FolderEntity({ _id: newId(), workspaceId: principal.workspaceId, spaceId: space.getId(), name: command.name.trim(), order, createdAt: now, updatedAt: now }));
    await this.audit.record(principal, 'folder.created', 'folder', saved.getId(), { name: saved.getName() });
    return HierarchyPresenter.folder(saved);
  }
}
