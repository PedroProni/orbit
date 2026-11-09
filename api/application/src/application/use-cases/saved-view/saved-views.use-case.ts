import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SAVED_VIEW_INJECT_TOKEN, TASK_LIST_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { SavedViewRepository } from '@domain/repositories/saved-view.repository';
import { TaskListRepository } from '@domain/repositories/task-list.repository';
import { SavedViewEntity } from '@domain/entities/saved-view.entity';
import { SavedViewAccessPolicy } from '@domain/policies/saved-view-access.policy';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { guardDomain } from '@common/helpers/functions/domain-guard.helper';
import { newId } from '@common/helpers/functions/id.helper';
import { SavedViewPresenter } from '@application/presenters/saved-view.presenter';
import { AuditService } from '@application/services/audit.service';
import { SaveViewDto } from '@shared/dtos/saved-view/save-view.dto';

@Injectable()
export class SavedViewsUseCase {
  constructor(
    @Inject(SAVED_VIEW_INJECT_TOKEN) private readonly views: SavedViewRepository,
    @Inject(TASK_LIST_INJECT_TOKEN) private readonly lists: TaskListRepository,
    private readonly audit: AuditService,
  ) {}

  async list(principal: AuthPrincipal, listId?: string) {
    const filter: Record<string, unknown> = { workspace_id: principal.workspaceId, $or: [{ owner_id: principal.userId }, { shared: true }] };
    if (listId) filter.$and = [{ $or: [{ list_id: listId }, { list_id: null }] }];
    const found = await this.views.findMany(filter, { created_at: 1 });
    return found.filter((v) => SavedViewAccessPolicy.canSee(principal, v.getOwnerId(), v.getShared())).map(SavedViewPresenter.toView);
  }

  async create(principal: AuthPrincipal, dto: SaveViewDto) {
    await this.assertList(principal, dto.listId ?? null);
    const now = new Date();
    const view = new SavedViewEntity({ _id: newId(), workspaceId: principal.workspaceId, ownerId: principal.userId, name: 'x', viewType: dto.viewType, listId: null, filters: dto.filters, display: null, shared: false, createdAt: now, updatedAt: now });
    guardDomain(() => view.apply(dto.name, dto.viewType, dto.listId ?? null, dto.filters, dto.shared ?? false, dto.display ?? null));
    const saved = await this.views.create(view);
    await this.audit.record(principal, 'saved_view.created', 'saved_view', saved.getId(), { name: saved.getName() });
    return SavedViewPresenter.toView(saved);
  }

  async update(principal: AuthPrincipal, id: string, dto: SaveViewDto) {
    const view = await this.find(principal, id);
    await this.assertList(principal, dto.listId ?? null);
    guardDomain(() => view.apply(dto.name, dto.viewType, dto.listId ?? null, dto.filters, dto.shared ?? view.getShared(), dto.display === undefined ? view.getDisplay() : dto.display));
    const saved = await this.views.update(view);
    await this.audit.record(principal, 'saved_view.updated', 'saved_view', id, { name: saved.getName() });
    return SavedViewPresenter.toView(saved);
  }

  async remove(principal: AuthPrincipal, id: string) {
    const view = await this.find(principal, id);
    await this.views.delete(view.getId());
    await this.audit.record(principal, 'saved_view.deleted', 'saved_view', id, {});
  }

  private async find(principal: AuthPrincipal, id: string): Promise<SavedViewEntity> {
    const view = await this.views.findByIdInWorkspace(id, principal.workspaceId);
    if (!view || !SavedViewAccessPolicy.canSee(principal, view.getOwnerId(), view.getShared())) throw new NotFoundException('View not found');
    if (!SavedViewAccessPolicy.canChange(principal, view.getOwnerId())) throw new ForbiddenException('Only the owner or an admin can change this view');
    return view;
  }

  private async assertList(principal: AuthPrincipal, listId: string | null): Promise<void> {
    if (listId && !(await this.lists.findByIdInWorkspace(listId, principal.workspaceId))) throw new NotFoundException('List not found');
  }
}
