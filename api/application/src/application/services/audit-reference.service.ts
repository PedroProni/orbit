import { Inject, Injectable } from '@nestjs/common';
import { API_TOKEN_INJECT_TOKEN, AUTOMATION_INJECT_TOKEN, CUSTOM_FIELD_DEFINITION_INJECT_TOKEN, DASHBOARD_INJECT_TOKEN, DOC_INJECT_TOKEN, FOLDER_INJECT_TOKEN, FORM_INJECT_TOKEN, GOAL_INJECT_TOKEN, SAVED_VIEW_INJECT_TOKEN, SPACE_INJECT_TOKEN, TASK_INJECT_TOKEN, TASK_LIST_INJECT_TOKEN, TASK_TEMPLATE_INJECT_TOKEN, USER_GROUP_INJECT_TOKEN, USER_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { BaseRepository } from '@domain/repositories/base.repository';
import { ApiTokenRepository } from '@domain/repositories/api-token.repository';
import { UserRepository } from '@domain/repositories/user.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { TaskListRepository } from '@domain/repositories/task-list.repository';
import { SpaceRepository } from '@domain/repositories/space.repository';
import { FolderRepository } from '@domain/repositories/folder.repository';
import { FormRepository } from '@domain/repositories/form.repository';
import { AutomationRepository } from '@domain/repositories/automation.repository';
import { TaskTemplateRepository } from '@domain/repositories/task-template.repository';
import { DocRepository } from '@domain/repositories/doc.repository';
import { CustomFieldDefinitionRepository } from '@domain/repositories/custom-field-definition.repository';
import { UserGroupRepository } from '@domain/repositories/user-group.repository';
import { GoalRepository } from '@domain/repositories/goal.repository';
import { DashboardRepository } from '@domain/repositories/dashboard.repository';
import { SavedViewRepository } from '@domain/repositories/saved-view.repository';
import { NamedEntity, TitledEntity } from '@domain/types/labelled-entity.type';
import { AuditLogEntity } from '@domain/entities/audit-log.entity';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { ApiTokenAccessPolicy } from '@domain/policies/api-token-access.policy';
import { AuditReferenceKeyPolicy } from '@domain/policies/audit-reference-key.policy';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AuditReference, AuditReferences } from '@domain/types/audit-reference.type';
import { AuditLabelResolver } from '@domain/types/audit-label-resolver.type';

@Injectable()
export class AuditReferenceService {
  private readonly resolvers: Record<string, AuditLabelResolver>;

  constructor(
    @Inject(USER_INJECT_TOKEN) private readonly users: UserRepository,
    @Inject(API_TOKEN_INJECT_TOKEN) private readonly tokens: ApiTokenRepository,
    @Inject(TASK_INJECT_TOKEN) tasks: TaskRepository,
    @Inject(TASK_LIST_INJECT_TOKEN) lists: TaskListRepository,
    @Inject(SPACE_INJECT_TOKEN) spaces: SpaceRepository,
    @Inject(FOLDER_INJECT_TOKEN) folders: FolderRepository,
    @Inject(FORM_INJECT_TOKEN) forms: FormRepository,
    @Inject(AUTOMATION_INJECT_TOKEN) automations: AutomationRepository,
    @Inject(TASK_TEMPLATE_INJECT_TOKEN) templates: TaskTemplateRepository,
    @Inject(DOC_INJECT_TOKEN) docs: DocRepository,
    @Inject(CUSTOM_FIELD_DEFINITION_INJECT_TOKEN) fields: CustomFieldDefinitionRepository,
    @Inject(USER_GROUP_INJECT_TOKEN) groups: UserGroupRepository,
    @Inject(GOAL_INJECT_TOKEN) goals: GoalRepository,
    @Inject(DASHBOARD_INJECT_TOKEN) dashboards: DashboardRepository,
    @Inject(SAVED_VIEW_INJECT_TOKEN) views: SavedViewRepository,
  ) {
    const named =
      (repo: BaseRepository<NamedEntity>): AuditLabelResolver =>
      async (workspaceId, ids) =>
        new Map((await repo.findMany({ _id: { $in: ids }, workspace_id: workspaceId }, undefined, ids.length)).map((row) => [row.getId(), row.getName()]));
    const titled =
      (repo: BaseRepository<TitledEntity>): AuditLabelResolver =>
      async (workspaceId, ids) =>
        new Map((await repo.findMany({ _id: { $in: ids }, workspace_id: workspaceId }, undefined, ids.length)).map((row) => [row.getId(), row.getTitle()]));
    this.resolvers = {
      task: titled(tasks),
      doc: titled(docs),
      list: named(lists),
      space: named(spaces),
      folder: named(folders),
      form: named(forms),
      automation: named(automations),
      template: named(templates),
      custom_field: named(fields),
      group: named(groups),
      goal: named(goals),
      dashboard: named(dashboards),
      saved_view: named(views),
    };
  }

  async resolve(principal: AuthPrincipal, logs: AuditLogEntity[]): Promise<AuditReferences> {
    const userIds = this.unique([...logs.filter((log) => log.getActorType() === AuditActorType.USER).map((log) => log.getActorId()), ...this.entityIds(logs, 'user')]);
    const tokenIds = this.unique([...logs.filter((log) => log.getActorType() === AuditActorType.TOKEN).map((log) => log.getActorId()), ...this.entityIds(logs, 'api_token')]);
    const [userNames, tokenNames, labels] = await Promise.all([this.userNames(principal.workspaceId, userIds), this.tokenNames(principal, tokenIds), this.entityLabels(principal.workspaceId, logs)]);
    const actors = new Map<string, AuditReference>();
    const entities = new Map<string, AuditReference>();
    for (const log of logs) {
      const actorKey = AuditReferenceKeyPolicy.of(log.getActorType(), log.getActorId());
      if (log.getActorType() === AuditActorType.USER) actors.set(actorKey, this.reference(userNames, log.getActorId()));
      else if (log.getActorType() === AuditActorType.TOKEN) actors.set(actorKey, this.reference(tokenNames, log.getActorId()));
      else actors.set(actorKey, { label: null, deleted: false });
      const entityKey = AuditReferenceKeyPolicy.of(log.getEntityType(), log.getEntityId());
      if (log.getEntityType() === 'user') entities.set(entityKey, this.reference(userNames, log.getEntityId()));
      else if (log.getEntityType() === 'api_token') entities.set(entityKey, this.reference(tokenNames, log.getEntityId()));
      else if (this.resolvers[log.getEntityType()]) entities.set(entityKey, this.reference(labels.get(log.getEntityType()) ?? new Map(), log.getEntityId()));
      else entities.set(entityKey, { label: null, deleted: false });
    }
    return { actors, entities };
  }

  private reference(names: Map<string, string | null>, id: string): AuditReference {
    return names.has(id) ? { label: names.get(id) ?? null, deleted: false } : { label: null, deleted: true };
  }

  private async userNames(workspaceId: string, ids: string[]): Promise<Map<string, string | null>> {
    if (ids.length === 0) return new Map();
    const rows = await this.users.findMany({ _id: { $in: ids }, workspace_id: workspaceId }, undefined, ids.length);
    return new Map(rows.map((user) => [user.getId(), user.getName()]));
  }

  private async tokenNames(principal: AuthPrincipal, ids: string[]): Promise<Map<string, string | null>> {
    if (ids.length === 0) return new Map();
    const rows = await this.tokens.findMany({ _id: { $in: ids }, workspace_id: principal.workspaceId }, undefined, ids.length);
    return new Map(rows.map((token) => [token.getId(), ApiTokenAccessPolicy.canManage(principal, token.getUserId()) ? token.getName() : null]));
  }

  private async entityLabels(workspaceId: string, logs: AuditLogEntity[]): Promise<Map<string, Map<string, string | null>>> {
    const types = this.unique(logs.map((log) => log.getEntityType()).filter((type) => Boolean(this.resolvers[type])));
    const resolved = await Promise.all(types.map(async (type) => [type, await this.resolvers[type](workspaceId, this.entityIds(logs, type))] as const));
    return new Map(resolved);
  }

  private entityIds(logs: AuditLogEntity[], type: string): string[] {
    return this.unique(logs.filter((log) => log.getEntityType() === type).map((log) => log.getEntityId()));
  }

  private unique(values: string[]): string[] {
    return [...new Set(values.filter(Boolean))];
  }
}
