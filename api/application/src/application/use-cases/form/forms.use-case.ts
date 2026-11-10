import { BadRequestException, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { FORM_INJECT_TOKEN, SPACE_INJECT_TOKEN, TASK_LIST_INJECT_TOKEN, USER_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { PUBLIC_FORM_ANSWER_MAX_LENGTH, PUBLIC_FORM_KEY_BYTES, PUBLIC_FORM_TITLE_MAX_LENGTH } from '@domain/constants/public-form.constant';
import { FormRepository } from '@domain/repositories/form.repository';
import { SpaceRepository } from '@domain/repositories/space.repository';
import { TaskListRepository } from '@domain/repositories/task-list.repository';
import { UserRepository } from '@domain/repositories/user.repository';
import { TaskCreationPolicy } from '@domain/policies/task-creation.policy';
import { FormOwnerPolicy } from '@domain/policies/form-owner.policy';
import { FormEntity } from '@domain/entities/form.entity';
import { UserEntity } from '@domain/entities/user.entity';
import { FormFieldTarget } from '@domain/enums/form.enums';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { FormField } from '@domain/types/form-field.type';
import { FormChange } from '@domain/types/form-change.type';
import { guardDomain } from '@common/helpers/functions/domain-guard.helper';
import { newId } from '@common/helpers/functions/id.helper';
import { CreateTaskUseCase } from '@application/use-cases/task/create-task.use-case';
import { AuditService } from '@application/services/audit.service';
import { PublicFormThrottleService } from '@application/services/public-form-throttle.service';
import { SaveFormDto } from '@shared/dtos/form/save-form.dto';
import { SubmitFormDto } from '@shared/dtos/form/submit-form.dto';

@Injectable()
export class FormsUseCase {
  constructor(
    @Inject(FORM_INJECT_TOKEN) private readonly forms: FormRepository,
    @Inject(TASK_LIST_INJECT_TOKEN) private readonly lists: TaskListRepository,
    @Inject(SPACE_INJECT_TOKEN) private readonly spaces: SpaceRepository,
    @Inject(USER_INJECT_TOKEN) private readonly users: UserRepository,
    private readonly createTask: CreateTaskUseCase,
    private readonly audit: AuditService,
    private readonly throttle: PublicFormThrottleService,
  ) {}

  async list(principal: AuthPrincipal) {
    const forms = await this.forms.findMany({ workspace_id: principal.workspaceId }, { created_at: -1 });
    const ownerIds = [...new Set(forms.map(f => f.getCreatedBy()))];
    const owners = ownerIds.length ? await this.users.findMany({ _id: { $in: ownerIds }, workspace_id: principal.workspaceId }) : [];
    const byId = new Map(owners.map(u => [u.getId(), u]));
    return forms.map(f => FormsUseCase.admin(f, byId.get(f.getCreatedBy()) ?? null));
  }

  async create(principal: AuthPrincipal, dto: SaveFormDto) {
    await this.listInWorkspace(principal, dto.listId);
    const now = new Date();
    const form = new FormEntity({
      _id: newId(),
      workspaceId: principal.workspaceId,
      listId: dto.listId,
      name: 'x',
      publicKey: FormsUseCase.newKey(),
      fields: [],
      active: true,
      createdBy: principal.userId,
      createdAt: now,
      updatedAt: now,
    });
    guardDomain(() => form.rewrite(dto.name, FormsUseCase.fieldsFrom(dto, []), dto.active ?? true));
    const saved = await this.forms.create(form);
    await this.audit.record(principal, 'form.created', 'form', saved.getId(), { name: saved.getName(), listId: saved.getListId() });
    return FormsUseCase.admin(saved, await this.owner(saved));
  }

  async update(principal: AuthPrincipal, id: string, dto: SaveFormDto) {
    const form = await this.find(principal, id);
    const before = { name: form.getName(), fields: JSON.stringify(form.getFields()), active: form.getActive(), listId: form.getListId() };
    if (dto.listId !== form.getListId()) await this.listInWorkspace(principal, dto.listId);
    const previousOwner = form.getCreatedBy();
    const paused = !FormOwnerPolicy.canAct(await this.owner(form));
    guardDomain(() => {
      form.rewrite(dto.name, FormsUseCase.fieldsFrom(dto, form.getFields()), dto.active ?? form.getActive());
      form.moveTo(dto.listId);
      if (paused) form.transferTo(principal.userId);
    });
    const changed: FormChange[] = [];
    if (before.name !== form.getName()) changed.push('name');
    if (before.fields !== JSON.stringify(form.getFields())) changed.push('fields');
    if (before.active !== form.getActive()) changed.push('active');
    if (before.listId !== form.getListId()) changed.push('listId');
    const saved = await this.forms.patch(form, [...changed, ...(paused ? ['createdBy'] : [])]);
    await this.audit.record(principal, 'form.updated', 'form', saved.getId(), { changed });
    if (paused) await this.audit.record(principal, 'form.owner_changed', 'form', saved.getId(), { from: previousOwner, to: principal.userId });
    return FormsUseCase.admin(saved, await this.owner(saved));
  }

  async rotateKey(principal: AuthPrincipal, id: string) {
    const form = await this.find(principal, id);
    guardDomain(() => form.rotateKey(FormsUseCase.newKey()));
    const saved = await this.forms.patch(form, ['publicKey']);
    await this.audit.record(principal, 'form.key_rotated', 'form', saved.getId(), {});
    return FormsUseCase.admin(saved, await this.owner(saved));
  }

  async remove(principal: AuthPrincipal, id: string) {
    await this.find(principal, id);
    await this.forms.delete(id);
    await this.audit.record(principal, 'form.deleted', 'form', id, {});
  }

  async publicDefinition(publicKey: string) {
    const { form } = await this.byKey(publicKey);
    return { name: form.getName(), fields: form.getFields().map(f => ({ id: f.id, label: f.label, required: f.required })) };
  }

  async submit(publicKey: string, dto: SubmitFormDto, ip: string | null) {
    const { form, owner } = await this.byKey(publicKey);
    if (!this.throttle.reserve(form.getId(), ip)) throw new HttpException('Too many submissions, try again later', HttpStatus.TOO_MANY_REQUESTS);
    if (dto.website?.trim()) return { received: true };
    const answers = dto.answers;
    const fields = form.getFields();
    const known = new Set(fields.map(f => f.id));
    for (const [key, value] of Object.entries(answers)) {
      if (!known.has(key)) throw new BadRequestException('Unknown field');
      if (typeof value !== 'string' || value.length > PUBLIC_FORM_ANSWER_MAX_LENGTH) throw new BadRequestException('Invalid answer');
    }
    for (const field of fields) if (field.required && !answers[field.id]?.trim()) throw new BadRequestException(`Field is required: ${field.label}`);
    const title = fields
      .filter(f => f.target === FormFieldTarget.TITLE)
      .map(f => answers[f.id]?.trim())
      .filter(Boolean)
      .join(' - ');
    if (!title) throw new BadRequestException('A title answer is required');
    const description = fields
      .filter(f => f.target === FormFieldTarget.DESCRIPTION && answers[f.id]?.trim())
      .map(f => `**${f.label}**\n\n${answers[f.id].trim()}`)
      .join('\n\n');
    const principal: AuthPrincipal = {
      workspaceId: form.getWorkspaceId(),
      actorType: AuditActorType.WEBHOOK,
      actorId: `form:${form.getId()}`,
      userId: owner.getId(),
      role: owner.getRole(),
      scopes: [],
    };
    const list = await this.lists.findByIdInWorkspace(form.getListId(), form.getWorkspaceId());
    const space = list ? await this.spaces.findByIdInWorkspace(list.getSpaceId(), form.getWorkspaceId()) : null;
    const prefixes = space?.getTitlePrefixes() ?? [];
    const tags = (space?.getRequiredTags() ?? []).slice(0, 1);
    const finalTitle = TaskCreationPolicy.hasAllowedPrefix(title, prefixes) ? title : `[${prefixes[0]}] ${title}`;
    await this.createTask.execute(principal, {
      listId: form.getListId(),
      parentId: null,
      title: finalTitle.slice(0, PUBLIC_FORM_TITLE_MAX_LENGTH),
      descriptionMd: description,
      status: null,
      priority: null,
      tags,
      assigneeIds: [],
      watcherIds: [],
      points: null,
      startDate: null,
      dueDate: null,
      customFields: [],
      taskKind: null,
    });
    return { received: true };
  }

  private async byKey(publicKey: string): Promise<{ form: FormEntity; owner: UserEntity }> {
    const form = await this.forms.findOne({ public_key: publicKey });
    if (!form || !form.getActive()) throw new NotFoundException('Form not found');
    const owner = await this.owner(form);
    if (!FormOwnerPolicy.canAct(owner)) throw new NotFoundException('Form not found');
    return { form, owner };
  }

  private owner(form: FormEntity): Promise<UserEntity | null> {
    return this.users.findByIdInWorkspace(form.getCreatedBy(), form.getWorkspaceId());
  }

  private async listInWorkspace(principal: AuthPrincipal, listId: string): Promise<void> {
    if (!(await this.lists.findByIdInWorkspace(listId, principal.workspaceId))) throw new NotFoundException('List not found');
  }

  private async find(principal: AuthPrincipal, id: string): Promise<FormEntity> {
    const form = await this.forms.findByIdInWorkspace(id, principal.workspaceId);
    if (!form) throw new NotFoundException('Form not found');
    return form;
  }

  private static newKey(): string {
    return randomBytes(PUBLIC_FORM_KEY_BYTES).toString('base64url');
  }

  private static fieldsFrom(dto: SaveFormDto, current: FormField[]): FormField[] {
    const existing = new Set(current.map(f => f.id));
    const used = new Set<string>();
    return dto.fields.map(f => {
      const id = f.id && existing.has(f.id) && !used.has(f.id) ? f.id : newId();
      used.add(id);
      return { id, label: f.label, required: f.required, target: f.target };
    });
  }

  private static admin(f: FormEntity, owner: UserEntity | null) {
    return {
      id: f.getId(),
      listId: f.getListId(),
      name: f.getName(),
      publicKey: f.getPublicKey(),
      fields: f.getFields(),
      active: f.getActive(),
      paused: !FormOwnerPolicy.canAct(owner),
      ownerId: f.getCreatedBy(),
      updatedAt: f.getUpdatedAt(),
    };
  }
}
