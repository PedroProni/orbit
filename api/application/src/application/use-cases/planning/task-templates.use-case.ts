import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SPACE_INJECT_TOKEN, TASK_PLAN_INJECT_TOKEN, TASK_TEMPLATE_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { TaskTemplateRepository } from '@domain/repositories/task-template.repository';
import { TaskPlanRepository } from '@domain/repositories/task-plan.repository';
import { SpaceRepository } from '@domain/repositories/space.repository';
import { TaskTemplateEntity } from '@domain/entities/task-template.entity';
import { TaskPlanEntity } from '@domain/entities/task-plan.entity';
import { TaskKind } from '@domain/enums/task-kind.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { guardDomain } from '@common/helpers/functions/domain-guard.helper';
import { newId } from '@common/helpers/functions/id.helper';
import { CreateTaskUseCase } from '@application/use-cases/task/create-task.use-case';
import { AuditService } from '@application/services/audit.service';
import { SaveTemplateDto } from '@shared/dtos/planning/save-template.dto';
import { InstantiateTemplateDto } from '@shared/dtos/planning/instantiate-template.dto';

@Injectable()
export class TaskTemplatesUseCase {
  constructor(
    @Inject(TASK_TEMPLATE_INJECT_TOKEN) private readonly templates: TaskTemplateRepository,
    @Inject(TASK_PLAN_INJECT_TOKEN) private readonly plans: TaskPlanRepository,
    @Inject(SPACE_INJECT_TOKEN) private readonly spaces: SpaceRepository,
    private readonly createTask: CreateTaskUseCase,
    private readonly audit: AuditService,
  ) {}

  async list(principal: AuthPrincipal, spaceId?: string) {
    const filter: Record<string, unknown> = { workspace_id: principal.workspaceId };
    if (spaceId) filter.space_id = spaceId;
    return (await this.templates.findMany(filter, { name: 1 })).map(TaskTemplatesUseCase.view);
  }

  async create(principal: AuthPrincipal, dto: SaveTemplateDto) {
    if (!(await this.spaces.findByIdInWorkspace(dto.spaceId, principal.workspaceId))) throw new NotFoundException('Space not found');
    const now = new Date();
    const template = new TaskTemplateEntity({ _id: newId(), workspaceId: principal.workspaceId, spaceId: dto.spaceId, name: 'x', titleTemplate: 'x', descriptionMd: '', tags: [], priority: null, taskKind: TaskKind.TASK, estimateMinutes: null, createdAt: now, updatedAt: now });
    guardDomain(() => template.apply(dto.name, dto.titleTemplate, dto.descriptionMd, dto.tags, dto.priority ?? null, dto.taskKind, dto.estimateMinutes ?? null));
    const saved = await this.templates.create(template);
    await this.audit.record(principal, 'template.created', 'template', saved.getId(), { name: saved.getName() });
    return TaskTemplatesUseCase.view(saved);
  }

  async update(principal: AuthPrincipal, id: string, dto: SaveTemplateDto) {
    const template = await this.find(principal, id);
    guardDomain(() => template.apply(dto.name, dto.titleTemplate, dto.descriptionMd, dto.tags, dto.priority ?? null, dto.taskKind, dto.estimateMinutes ?? null));
    return TaskTemplatesUseCase.view(await this.templates.update(template));
  }

  async remove(principal: AuthPrincipal, id: string) {
    const template = await this.find(principal, id);
    await this.templates.delete(template.getId());
    await this.audit.record(principal, 'template.deleted', 'template', id, {});
  }

  async instantiate(principal: AuthPrincipal, id: string, dto: InstantiateTemplateDto) {
    const template = await this.find(principal, id);
    const created = await this.createTask.execute(principal, { listId: dto.listId, parentId: null, title: dto.title?.trim() || template.getTitleTemplate(), descriptionMd: template.getDescriptionMd(), status: null, priority: template.getPriority(), tags: template.getTags(), assigneeIds: [], watcherIds: [], points: null, startDate: null, dueDate: null, customFields: [], taskKind: null });
    const now = new Date();
    await this.plans.create(new TaskPlanEntity({ _id: newId(), workspaceId: principal.workspaceId, taskId: created.id, estimateMinutes: template.getEstimateMinutes(), taskKind: template.getTaskKind(), createdAt: now, updatedAt: now }));
    return created;
  }

  private async find(principal: AuthPrincipal, id: string): Promise<TaskTemplateEntity> {
    const template = await this.templates.findByIdInWorkspace(id, principal.workspaceId);
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  private static view(t: TaskTemplateEntity) {
    return { id: t.getId(), spaceId: t.getSpaceId(), name: t.getName(), titleTemplate: t.getTitleTemplate(), descriptionMd: t.getDescriptionMd(), tags: t.getTags(), priority: t.getPriority(), taskKind: t.getTaskKind(), estimateMinutes: t.getEstimateMinutes() };
  }
}
