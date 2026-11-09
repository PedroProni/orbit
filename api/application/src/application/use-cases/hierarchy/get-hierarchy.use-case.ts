import { Inject, Injectable } from '@nestjs/common';
import { SPACE_INJECT_TOKEN, FOLDER_INJECT_TOKEN, TASK_LIST_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { SpaceRepository } from '@domain/repositories/space.repository';
import { FolderRepository } from '@domain/repositories/folder.repository';
import { TaskListRepository } from '@domain/repositories/task-list.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { GuestAccessService } from '@application/services/guest-access.service';
import { HierarchyPresenter } from '@application/presenters/hierarchy.presenter';

@Injectable()
export class GetHierarchyUseCase {
  constructor(
    @Inject(SPACE_INJECT_TOKEN) private readonly spaces: SpaceRepository,
    @Inject(FOLDER_INJECT_TOKEN) private readonly folders: FolderRepository,
    @Inject(TASK_LIST_INJECT_TOKEN) private readonly lists: TaskListRepository,
    private readonly guests: GuestAccessService,
  ) {}

  async execute(principal: AuthPrincipal) {
    const allowed = await this.guests.allowedListIds(principal);
    const filter = { workspace_id: principal.workspaceId };
    const [allSpaces, allFolders, allLists] = await Promise.all([this.spaces.findMany(filter, { created_at: 1 }), this.folders.findMany(filter, { order: 1 }), this.lists.findMany(filter, { order: 1 })]);
    const lists = allowed ? allLists.filter((l) => allowed.includes(l.getId())) : allLists;
    const folders = allowed ? allFolders.filter((f) => lists.some((l) => l.getFolderId() === f.getId())) : allFolders;
    const spaces = allowed ? allSpaces.filter((s) => lists.some((l) => l.getSpaceId() === s.getId())) : allSpaces;
    return spaces.map((space) => ({
      ...HierarchyPresenter.space(space),
      folders: folders.filter((f) => f.getSpaceId() === space.getId()).map((folder) => ({ ...HierarchyPresenter.folder(folder), lists: lists.filter((l) => l.getFolderId() === folder.getId()).map(HierarchyPresenter.list) })),
      lists: lists.filter((l) => l.getSpaceId() === space.getId() && !l.getFolderId()).map(HierarchyPresenter.list),
    }));
  }
}
