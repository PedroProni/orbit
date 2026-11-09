import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { FORM_INJECT_TOKEN, SPACE_INJECT_TOKEN, TASK_LIST_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { FormRepository } from '@domain/repositories/form.repository';
import { SpaceRepository } from '@domain/repositories/space.repository';
import { TaskCreationPolicy } from '@domain/policies/task-creation.policy';
import { TaskListRepository } from '@domain/repositories/task-list.repository';
import { FormEntity } from '@domain/entities/form.entity';
import { FormFieldTarget } from '@domain/enums/form.enums';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { UserRole } from '@domain/enums/user.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { FormField } from '@domain/types/form-field.type';
import { guardDomain } from '@common/helpers/functions/domain-guard.helper';
import { newId } from '@common/helpers/functions/id.helper';
import { CreateTaskUseCase } from '@application/use-cases/task/create-task.use-case';
import { AuditService } from '@application/services/audit.service';
import { SaveFormDto } from '@shared/dtos/form/save-form.dto';

@Injectable()
export class FormsUseCase {
  constructor(
    @Inject(FORM_INJECT_TOKEN) private readonly forms: FormRepository,
    @Inject(TASK_LIST_INJECT_TOKEN) private readonly lists: TaskListRepository,
    @Inject(SPACE_INJECT_TOKEN) private readonly spaces: SpaceRepository,
    private readonly createTask: CreateTaskUseCase,
    private readonly audit: AuditService,
  ) {}

  async list(principal: AuthPrincipal) {
    return (await this.forms.findMany({ workspace_id: principal.workspaceId }, { created_at: -1 })).map(FormsUseCase.admin);
  }

  async create(principal: AuthPrincipal, dto: SaveFormDto) {
    if (!(await this.lists.findByIdInWorkspace(dto.listId, principal.workspaceId))) throw new NotFoundException('List not found');
    const now = new Date();
    const form = new FormEntity({ _id: newId(), workspaceId: principal.workspaceId, listId: dto.listId, name: 'x', publicKey: randomBytes(18).toString('base64url'), fields: [], active: true, createdBy: principal.userId, createdAt: now, updatedAt: now });
    guardDomain(() => form.rewrite(dto.name, FormsUseCase.fieldsFrom(dto), dto.active ?? true));
    const saved = await this.forms.create(form);
    await this.audit.record(principal, 'form.created', 'form', saved.getId(), {});
    return FormsUseCase.admin(saved);
  }

  async update(principal: AuthPrincipal, id: string, dto: SaveFormDto) {
    const form = await this.find(principal, id);
    guardDomain(() => form.rewrite(dto.name, FormsUseCase.fieldsFrom(dto), dto.active ?? form.getActive()));
    return FormsUseCase.admin(await this.forms.update(form));
  }

  async remove(principal: AuthPrincipal, id: string) {
    await this.find(principal, id);
    await this.forms.delete(id);
    await this.audit.record(principal, 'form.deleted', 'form', id, {});
  }

  async publicDefinition(publicKey: string) {
    const form = await this.byKey(publicKey);
    return { name: form.getName(), fields: form.getFields().map((f) => ({ id: f.id, label: f.label, required: f.required })) };
  }

  async submit(publicKey: string, answers: Record<string, string>) {
    const form = await this.byKey(publicKey);
    const fields = form.getFields();
    const known = new Set(fields.map((f) => f.id));
    for (const [key, value] of Object.entries(answers)) {
      if (!known.has(key)) throw new BadRequestException('Unknown field');
      if (typeof value !== 'string' || value.length > 5000) throw new BadRequestException('Invalid answer');
    }
    for (const field of fields) if (field.required && !answers[field.id]?.trim()) throw new BadRequestException(`Field is required: ${field.label}`);
    const title = fields.filter((f) => f.target === FormFieldTarget.TITLE).map((f) => answers[f.id]?.trim()).filter(Boolean).join(' - ');
    if (!title) throw new BadRequestException('A title answer is required');
    const description = fields.filter((f) => f.target === FormFieldTarget.DESCRIPTION && answers[f.id]?.trim()).map((f) => `**${f.label}**\n\n${answers[f.id].trim()}`).join('\n\n');
    const principal: AuthPrincipal = { workspaceId: form.getWorkspaceId(), actorType: AuditActorType.WEBHOOK, actorId: `form:${form.getId()}`, userId: form.getCreatedBy(), role: UserRole.MEMBER, scopes: [] };
    const list = await this.lists.findByIdInWorkspace(form.getListId(), form.getWorkspaceId());
    const space = list ? await this.spaces.findByIdInWorkspace(list.getSpaceId(), form.getWorkspaceId()) : null;
    const prefixes = space?.getTitlePrefixes() ?? [];
    const tags = (space?.getRequiredTags() ?? []).slice(0, 1);
    const finalTitle = TaskCreationPolicy.hasAllowedPrefix(title, prefixes) ? title : `[${prefixes[0]}] ${title}`;
    const created = await this.createTask.execute(principal, { listId: form.getListId(), parentId: null, title: finalTitle.slice(0, 300), descriptionMd: description, status: null, priority: null, tags, assigneeIds: [], watcherIds: [], points: null, startDate: null, dueDate: null, customFields: [], taskKind: null });
    return { taskId: created.id };
  }

  private async byKey(publicKey: string): Promise<FormEntity> {
    const form = await this.forms.findOne({ public_key: publicKey });
    if (!form || !form.getActive()) throw new NotFoundException('Form not found');
    return form;
  }

  private async find(principal: AuthPrincipal, id: string): Promise<FormEntity> {
    const form = await this.forms.findByIdInWorkspace(id, principal.workspaceId);
    if (!form) throw new NotFoundException('Form not found');
    return form;
  }

  private static fieldsFrom(dto: SaveFormDto): FormField[] {
    return dto.fields.map((f) => ({ id: newId(), label: f.label, required: f.required, target: f.target }));
  }

  private static admin(f: FormEntity) {
    return { id: f.getId(), listId: f.getListId(), name: f.getName(), publicKey: f.getPublicKey(), fields: f.getFields(), active: f.getActive() };
  }
}
