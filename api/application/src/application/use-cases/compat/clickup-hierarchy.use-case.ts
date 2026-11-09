import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FOLDER_INJECT_TOKEN, SPACE_INJECT_TOKEN, TASK_LIST_INJECT_TOKEN, USER_INJECT_TOKEN, WORKSPACE_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { FolderRepository } from '@domain/repositories/folder.repository';
import { SpaceRepository } from '@domain/repositories/space.repository';
import { TaskListRepository } from '@domain/repositories/task-list.repository';
import { UserRepository } from '@domain/repositories/user.repository';
import { WorkspaceRepository } from '@domain/repositories/workspace.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { ClickupUserResolver } from '@application/services/compat/clickup-user-resolver.service';
import { TaskListEntity } from '@domain/entities/task-list.entity';

@Injectable()
export class ClickupHierarchyUseCase {
  constructor(
    @Inject(WORKSPACE_INJECT_TOKEN) private readonly workspaces: WorkspaceRepository,
    @Inject(USER_INJECT_TOKEN) private readonly users: UserRepository,
    @Inject(SPACE_INJECT_TOKEN) private readonly spaces: SpaceRepository,
    @Inject(FOLDER_INJECT_TOKEN) private readonly folders: FolderRepository,
    @Inject(TASK_LIST_INJECT_TOKEN) private readonly lists: TaskListRepository,
    private readonly resolver: ClickupUserResolver,
  ) {}

  async teams(principal: AuthPrincipal) {
    const workspace = await this.workspaces.findById(principal.workspaceId);
    if (!workspace) throw new NotFoundException('Workspace not found');
    const members = await this.users.findMany({ workspace_id: principal.workspaceId });
    return { teams: [{ id: workspace.getId(), name: workspace.getName(), color: '#7b68ee', avatar: null, members: members.map((u) => ({ user: this.resolver.toView(u) })) }] };
  }

  async spacesOf(principal: AuthPrincipal) {
    const items = await this.spaces.findMany({ workspace_id: principal.workspaceId }, { created_at: 1 });
    return { spaces: items.map((s) => ({ id: s.getId(), name: s.getName(), private: false, statuses: s.getStatuses().map((st) => ({ id: st.name, status: st.name, type: st.type, orderindex: st.order, color: st.color })) })) };
  }

  async foldersOf(principal: AuthPrincipal, spaceId: string) {
    const items = await this.folders.findMany({ workspace_id: principal.workspaceId, space_id: spaceId }, { order: 1 });
    return { folders: items.map((f) => ({ id: f.getId(), name: f.getName(), hidden: false, space: { id: spaceId }, lists: [] })) };
  }

  async listsOf(principal: AuthPrincipal, filter: { spaceId?: string; folderId?: string }) {
    const query: Record<string, unknown> = { workspace_id: principal.workspaceId };
    if (filter.folderId) query.folder_id = filter.folderId;
    if (filter.spaceId) {
      query.space_id = filter.spaceId;
      query.folder_id = null;
    }
    const items = await this.lists.findMany(query, { order: 1 });
    return { lists: items.map((l) => this.listView(l)) };
  }

  async list(principal: AuthPrincipal, listId: string) {
    const list = await this.lists.findByIdInWorkspace(listId, principal.workspaceId);
    if (!list) throw new NotFoundException('List not found');
    return this.listView(list);
  }

  private listView(l: TaskListEntity) {
    return { id: l.getId(), name: l.getName(), orderindex: l.getOrder(), folder: { id: l.getFolderId() }, space: { id: l.getSpaceId() }, start_date: l.getStartDate() ? String(l.getStartDate()!.getTime()) : null, due_date: l.getEndDate() ? String(l.getEndDate()!.getTime()) : null };
  }
}
