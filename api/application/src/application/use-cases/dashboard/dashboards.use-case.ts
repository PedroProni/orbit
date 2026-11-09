import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DASHBOARD_INJECT_TOKEN, TASK_INJECT_TOKEN, TASK_LIST_INJECT_TOKEN, TIME_ENTRY_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { DashboardRepository } from '@domain/repositories/dashboard.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { TaskListRepository } from '@domain/repositories/task-list.repository';
import { TimeEntryRepository } from '@domain/repositories/time-entry.repository';
import { DashboardEntity } from '@domain/entities/dashboard.entity';
import { DashboardWidgetType } from '@domain/enums/dashboard.enums';
import { OwnedResourceAccessPolicy } from '@domain/policies/owned-resource-access.policy';
import { DashboardWidget } from '@domain/types/dashboard-widget.type';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { guardDomain } from '@common/helpers/functions/domain-guard.helper';
import { newId } from '@common/helpers/functions/id.helper';
import { AuditService } from '@application/services/audit.service';
import { SaveDashboardDto } from '@shared/dtos/dashboard/save-dashboard.dto';
import { CalendarDayPolicy } from '@domain/policies/calendar-day.policy';

@Injectable()
export class DashboardsUseCase {
  constructor(
    @Inject(DASHBOARD_INJECT_TOKEN) private readonly dashboards: DashboardRepository,
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    @Inject(TASK_LIST_INJECT_TOKEN) private readonly lists: TaskListRepository,
    @Inject(TIME_ENTRY_INJECT_TOKEN) private readonly entries: TimeEntryRepository,
    private readonly audit: AuditService,
  ) {}

  async list(principal: AuthPrincipal) {
    const found = await this.dashboards.findMany({ workspace_id: principal.workspaceId, $or: [{ owner_id: principal.userId }, { shared: true }] }, { created_at: 1 });
    return found.filter((d) => OwnedResourceAccessPolicy.canSee(principal, d.getOwnerId(), d.getShared())).map(DashboardsUseCase.view);
  }

  async create(principal: AuthPrincipal, dto: SaveDashboardDto) {
    const widgets = await this.widgetsFrom(principal, dto);
    const now = new Date();
    const dashboard = new DashboardEntity({ _id: newId(), workspaceId: principal.workspaceId, ownerId: principal.userId, name: 'x', shared: false, widgets: [], createdAt: now, updatedAt: now });
    guardDomain(() => dashboard.rewrite(dto.name, dto.shared ?? false, widgets));
    const saved = await this.dashboards.create(dashboard);
    await this.audit.record(principal, 'dashboard.created', 'dashboard', saved.getId(), {});
    return DashboardsUseCase.view(saved);
  }

  async update(principal: AuthPrincipal, id: string, dto: SaveDashboardDto) {
    const dashboard = await this.find(principal, id);
    if (!OwnedResourceAccessPolicy.canChange(principal, dashboard.getOwnerId())) throw new ForbiddenException('Only the owner or an admin can change this dashboard');
    const widgets = await this.widgetsFrom(principal, dto);
    guardDomain(() => dashboard.rewrite(dto.name, dto.shared ?? false, widgets));
    return DashboardsUseCase.view(await this.dashboards.update(dashboard));
  }

  async remove(principal: AuthPrincipal, id: string) {
    const dashboard = await this.find(principal, id);
    if (!OwnedResourceAccessPolicy.canChange(principal, dashboard.getOwnerId())) throw new ForbiddenException('Only the owner or an admin can delete this dashboard');
    await this.dashboards.delete(id);
    await this.audit.record(principal, 'dashboard.deleted', 'dashboard', id, {});
  }

  async data(principal: AuthPrincipal, id: string) {
    const dashboard = await this.find(principal, id);
    const now = Date.now();
    const widgets = [];
    for (const widget of dashboard.getWidgets()) {
      const filter: Record<string, unknown> = { workspace_id: principal.workspaceId, archived: false };
      if (widget.listId) filter.list_id = widget.listId;
      const tasks = await this.tasks.findMany(filter);
      let result: unknown;
      if (widget.type === DashboardWidgetType.TASKS_BY_STATUS) result = DashboardsUseCase.count(tasks.map((t) => t.getStatus()));
      else if (widget.type === DashboardWidgetType.TASKS_BY_ASSIGNEE) result = DashboardsUseCase.count(tasks.filter((t) => !t.getDateClosed()).flatMap((t) => (t.getAssigneeIds().length ? t.getAssigneeIds() : ['unassigned'])));
      else if (widget.type === DashboardWidgetType.OVERDUE) result = { count: tasks.filter((t) => !t.getDateClosed() && CalendarDayPolicy.isOverdue(t.getDueDate(), now)).length };
      else {
        const ids = new Set(tasks.map((t) => t.getId()));
        const entries = await this.entries.findMany({ workspace_id: principal.workspaceId });
        const byUser: Record<string, number> = {};
        for (const entry of entries) if (ids.has(entry.getTaskId())) byUser[entry.getUserId()] = (byUser[entry.getUserId()] ?? 0) + entry.getMinutes();
        result = byUser;
      }
      widgets.push({ id: widget.id, type: widget.type, title: widget.title, listId: widget.listId, result });
    }
    return { id: dashboard.getId(), name: dashboard.getName(), widgets };
  }

  private async widgetsFrom(principal: AuthPrincipal, dto: SaveDashboardDto): Promise<DashboardWidget[]> {
    for (const w of dto.widgets) {
      if (w.listId && !(await this.lists.findByIdInWorkspace(w.listId, principal.workspaceId))) throw new NotFoundException('List not found');
    }
    return dto.widgets.map((w) => ({ id: newId(), type: w.type, title: w.title, listId: w.listId ?? null }));
  }

  private async find(principal: AuthPrincipal, id: string): Promise<DashboardEntity> {
    const dashboard = await this.dashboards.findByIdInWorkspace(id, principal.workspaceId);
    if (!dashboard || !OwnedResourceAccessPolicy.canSee(principal, dashboard.getOwnerId(), dashboard.getShared())) throw new NotFoundException('Dashboard not found');
    return dashboard;
  }

  private static count(values: string[]): Record<string, number> {
    const out: Record<string, number> = {};
    for (const v of values) out[v] = (out[v] ?? 0) + 1;
    return out;
  }

  private static view(d: DashboardEntity) {
    return { id: d.getId(), ownerId: d.getOwnerId(), name: d.getName(), shared: d.getShared(), widgets: d.getWidgets() };
  }
}
