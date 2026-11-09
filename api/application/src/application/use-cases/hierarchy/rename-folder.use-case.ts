import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FOLDER_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { FolderRepository } from '@domain/repositories/folder.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { guardDomain } from '@common/helpers/functions/domain-guard.helper';
import { AuditService } from '@application/services/audit.service';
import { HierarchyPresenter } from '@application/presenters/hierarchy.presenter';

@Injectable()
export class RenameFolderUseCase {
  constructor(
    @Inject(FOLDER_INJECT_TOKEN) private readonly folders: FolderRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(principal: AuthPrincipal, folderId: string, name: string) {
    const folder = await this.folders.findByIdInWorkspace(folderId, principal.workspaceId);
    if (!folder) throw new NotFoundException('Folder not found');
    guardDomain(() => folder.rename(name));
    const saved = await this.folders.update(folder);
    await this.audit.record(principal, 'folder.renamed', 'folder', folderId, { name });
    return HierarchyPresenter.folder(saved);
  }
}
