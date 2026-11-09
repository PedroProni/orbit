import { WorkspaceEntity } from '@domain/entities/workspace.entity';
import { UserEntity } from '@domain/entities/user.entity';
import { SpaceEntity } from '@domain/entities/space.entity';
import { FolderEntity } from '@domain/entities/folder.entity';
import { TaskListEntity } from '@domain/entities/task-list.entity';
import { TaskEntity } from '@domain/entities/task.entity';
import { CommentEntity } from '@domain/entities/comment.entity';
import { AttachmentEntity } from '@domain/entities/attachment.entity';
import { TaskDependencyEntity } from '@domain/entities/task-dependency.entity';
import { CustomFieldDefinitionEntity } from '@domain/entities/custom-field-definition.entity';
import { DomainWorkspaceMapper } from '@domain/mappers/workspace.mapper';
import { DomainUserMapper } from '@domain/mappers/user.mapper';
import { DomainSpaceMapper } from '@domain/mappers/space.mapper';
import { DomainFolderMapper } from '@domain/mappers/folder.mapper';
import { DomainTaskListMapper } from '@domain/mappers/task-list.mapper';
import { DomainTaskMapper } from '@domain/mappers/task.mapper';
import { DomainCommentMapper } from '@domain/mappers/comment.mapper';
import { DomainAttachmentMapper } from '@domain/mappers/attachment.mapper';
import { DomainTaskDependencyMapper } from '@domain/mappers/task-dependency.mapper';
import { DomainCustomFieldDefinitionMapper } from '@domain/mappers/custom-field-definition.mapper';
import { UserRole, UserStatus } from '@domain/enums/user.enums';
import { SprintKind } from '@domain/enums/list.enums';
import { DailyLogPolicy } from '@domain/policies/daily-log.policy';
import { DAILY_LOG_HEADING_PREFIX } from '@domain/constants/daily-log.constant';
import { newId } from '@common/helpers/functions/id.helper';
import { ClickupAttachmentLinks } from './clickup-attachment-links';
import { ClickupCommentReader } from './clickup-comment-reader';
import { ClickupReadonlyClient } from './clickup-readonly.client';
import { ClickupImportMapper } from './clickup-import.mapper';
import { ClickupDatePolicy } from './clickup-date.policy';
import { ClickupStatusCatalog } from './clickup-status-catalog';
import { ClickupCustomFieldMapper } from './clickup-custom-field.mapper';
import { ClickupDocsImporter } from './clickup-docs-importer';
import { ClickupFilesImporter } from './clickup-files-importer';
import { ImportLedger } from './import-ledger';
import { LocalStore } from './local-store';
import { ImportObjectStore } from './local-object-store.type';
import { ATTACHMENT_SOURCES_COLLECTION, CLICKUP_ROLE_MAP, DATE_ORIGINS_COLLECTION, DEFAULT_WORKSPACE_ZONE, INLINE_FILE_URL_PATTERN, LIST_ORIGINS_COLLECTION, STATUS_ORIGINS_COLLECTION, SPRINT_LIST_PATTERN, TASK_QUERY, UNTITLED } from './import.constant';
import { ImportDateOrigin, ImportFilesSummary, ImportReport, ImportStatusMapping, ImportStatusOrigin } from './import-report.type';
import { ImportOptions } from './import-options.type';
import { ImportedList, ImportedTask } from './clickup-importer.type';

export class ClickupImporter {
  private readonly ledger = new ImportLedger();
  private readonly userMap = new Map<string, string>();
  private readonly dateOrigins: ImportDateOrigin[] = [];
  private readonly statusOrigins: ImportStatusOrigin[] = [];
  private readonly statusMapping: ImportStatusMapping[] = [];
  private readonly pendingStubs = new Map<string, any>();
  private files: ImportFilesSummary | null = null;
  private workspaceId = '';
  private startedAt = '';
  private zone = DEFAULT_WORKSPACE_ZONE;

  constructor(
    private readonly client: ClickupReadonlyClient,
    private readonly store: LocalStore,
    private readonly objects?: ImportObjectStore,
  ) {}

  async run(options: ImportOptions): Promise<ImportReport> {
    this.startedAt = new Date().toISOString();
    this.zone = options.zone;
    if (options.phase !== 'files') await this.copyData(options);
    if (options.phase !== 'data') await this.copyFiles(options);
    return this.report('finished');
  }

  private report(stage: string): ImportReport {
    return { startedAt: this.startedAt, finishedAt: new Date().toISOString(), stage, zone: this.zone, requests: this.client.getRequestCount(), fileRequests: this.client.getDownloadCount(), maxRequestsInAnyMinute: this.client.getMaxPerMinute(), counts: this.ledger.counts, mismatches: this.ledger.mismatches, notCopied: this.ledger.notCopied, files: this.files, dateOrigins: this.dateOrigins, statusMapping: this.statusMapping, statusOrigins: this.statusOrigins };
  }

  private async copyFiles(options: ImportOptions): Promise<void> {
    if (!this.objects) throw new Error('Object storage is required to copy files');
    const importer = new ClickupFilesImporter(this.client, this.store, this.objects);
    this.files = await importer.run(options.log, (summary) => {
      this.files = summary;
      options.checkpoint?.(this.report('files'));
    });
  }

  private async copyData(options: ImportOptions): Promise<void> {
    const teams = (await this.client.get<{ teams: any[] }>('/team')).teams;
    const team = options.teamId ? teams.find((t) => String(t.id) === options.teamId) : teams[0];
    if (!team) throw new Error('Team not found');
    await this.importWorkspaceAndUsers(team);
    const rawSpaces = new Map<string, any>();
    for (const archived of [false, true]) {
      const { spaces } = await this.client.get<{ spaces: any[] }>(`/team/${team.id}/space?archived=${archived}`);
      for (const space of spaces) rawSpaces.set(String(space.id), space);
    }
    const lists: ImportedList[] = [];
    const catalogs = new Map<string, ClickupStatusCatalog>();
    for (const space of rawSpaces.values()) {
      const catalog = new ClickupStatusCatalog();
      for (const status of space.statuses ?? []) catalog.add(status);
      catalogs.set(String(space.id), catalog);
      await this.importHierarchy(String(space.id), lists, catalog);
    }
    options.log(`spaces=${rawSpaces.size} lists=${lists.length}`);
    const tasks = new Map<string, ImportedTask>();
    for (const list of lists) {
      for (const archived of [false, true]) {
        for (let page = 0; page < 200; page++) {
          const res = await this.client.get<{ tasks: any[]; last_page?: boolean }>(`/list/${list.id}/task?${TASK_QUERY}&archived=${archived}&page=${page}`);
          for (const t of res.tasks) {
            tasks.set(String(t.id), { raw: t, spaceId: list.spaceId, archived });
            catalogs.get(list.spaceId)?.add(t.status);
          }
          if (res.tasks.length < 100 || res.last_page) break;
        }
      }
      options.log(`list ${list.id}: tasks so far ${tasks.size}`);
    }
    const teamIds = new Set<string>();
    for (let page = 0; page < 200; page++) {
      const res = await this.client.get<{ tasks: any[] }>(`/team/${team.id}/task?${TASK_QUERY}&page=${page}`);
      res.tasks.forEach((t) => teamIds.add(String(t.id)));
      if (res.tasks.length < 100) break;
    }
    for (const id of teamIds) if (!tasks.has(id)) this.ledger.mismatch('task', id, 'present in the team-wide listing but not in any list listing');
    this.ledger.counts['tasks_team_wide'] = { fetched: teamIds.size, stored: teamIds.size };
    const spaces = await this.importSpaces(rawSpaces, catalogs);
    await this.importCustomFields(lists, tasks);
    await this.importTasks(tasks, spaces);
    this.recordStatusMapping(tasks, spaces, catalogs);
    await this.importTags(rawSpaces, tasks);
    await new ClickupDocsImporter(this.client, this.store, this.ledger).run(this.workspaceId, (rawId, docId) => this.authorOf(rawId, docId, 'doc author'));
    await this.storeStubs();
    await this.finalizeCounts();
    options.checkpoint?.(this.report('tasks-and-docs'));
    options.log('tasks and docs stored');
    if (options.withComments) await this.importComments([...tasks.keys()], options);
    await this.importAttachmentRecords([...tasks.keys()], options);
    await this.storeStubs();
    await this.finalizeCounts();
    options.checkpoint?.(this.report('data'));
  }

  private async storeStubs(): Promise<void> {
    if (this.pendingStubs.size === 0) return;
    this.ledger.track('users_stubs', this.pendingStubs.size, await this.store.upsert('users', [...this.pendingStubs.values()]));
    this.pendingStubs.clear();
  }

  private authorOf(rawId: unknown, sourceId: string, role: string): string {
    return this.resolveUser(rawId, sourceId, role, this.pendingStubs) ?? [...this.userMap.values()][0];
  }

  private async importWorkspaceAndUsers(team: any): Promise<void> {
    const now = new Date();
    this.workspaceId = String(team.id);
    const currentWorkspace = await this.store.findById('workspaces', this.workspaceId);
    await this.store.upsert('workspaces', [DomainWorkspaceMapper.toPersistence(new WorkspaceEntity({ _id: this.workspaceId, name: team.name, slug: currentWorkspace?.slug ?? 'main', createdAt: currentWorkspace?.created_at ?? now, updatedAt: now }))]);
    const existing = new Map((await this.store.find('users', { clickup_id: { $ne: null } })).map((u) => [String(u.clickup_id), u]));
    for (const [clickupId, user] of existing) this.userMap.set(clickupId, String(user._id));
    const docs = team.members.map((m: any) => {
      const clickupId = String(m.user.id);
      const current = existing.get(clickupId);
      const id = current ? String(current._id) : newId();
      this.userMap.set(clickupId, id);
      const role = (current?.role ?? CLICKUP_ROLE_MAP[m.user.role] ?? 'member') as UserRole;
      const status = (current?.status ?? UserStatus.ACTIVE) as UserStatus;
      return DomainUserMapper.toPersistence(new UserEntity({ _id: id, workspaceId: this.workspaceId, email: String(m.user.email).toLowerCase(), name: m.user.username || m.user.email, avatarUrl: m.user.profilePicture ?? null, clickupId, role, status, createdAt: ClickupImportMapper.date(m.user.date_joined) ?? now, updatedAt: now }));
    });
    this.ledger.track('users', team.members.length, await this.store.upsert('users', docs));
  }

  private async importHierarchy(spaceId: string, lists: ImportedList[], catalog: ClickupStatusCatalog): Promise<void> {
    const now = new Date();
    const folders = new Map<string, any>();
    for (const archived of [false, true]) {
      const res = await this.client.get<{ folders: any[] }>(`/space/${spaceId}/folder?archived=${archived}`);
      for (const f of res.folders) folders.set(String(f.id), { ...f, archivedFlag: archived });
    }
    const folderDocs = [...folders.values()].map((f, i) => DomainFolderMapper.toPersistence(new FolderEntity({ _id: String(f.id), workspaceId: this.workspaceId, spaceId, name: f.name, order: Number(f.orderindex ?? i), createdAt: now, updatedAt: now })));
    this.ledger.track('folders', folders.size, await this.store.upsert('folders', folderDocs));
    const parents: Array<{ folderId: string | null; path: string }> = [{ folderId: null, path: `/space/${spaceId}/list` }, ...[...folders.keys()].map((id) => ({ folderId: id, path: `/folder/${id}/list` }))];
    const seen = new Set<string>();
    const docs: any[] = [];
    const origins: any[] = [];
    for (const parent of parents) {
      for (const archived of [false, true]) {
        const res = await this.client.get<{ lists: any[] }>(`${parent.path}?archived=${archived}`);
        res.lists.forEach((l, i) => {
          const id = String(l.id);
          if (seen.has(id)) return;
          seen.add(id);
          for (const status of l.statuses ?? []) catalog.add(status);
          lists.push({ id, spaceId, archived });
          const start = ClickupDatePolicy.resolve(l.start_date, null, this.zone);
          const end = ClickupDatePolicy.resolve(l.due_date, null, this.zone);
          const kind = SPRINT_LIST_PATTERN.test(String(l.name)) ? SprintKind.SPRINT : SprintKind.LIST;
          if (kind === SprintKind.SPRINT) this.ledger.track('sprints', 1, 1);
          if (archived) this.ledger.track('lists_archived', 1, 1);
          docs.push(DomainTaskListMapper.toPersistence(new TaskListEntity({ _id: id, workspaceId: this.workspaceId, spaceId, folderId: parent.folderId, name: l.name, kind, startDate: start?.day ?? null, endDate: end?.day ?? null, order: Number(l.orderindex ?? i), clickupId: id, createdAt: now, updatedAt: now })));
          origins.push({ _id: id, archived, start_raw: start?.raw ?? null, due_raw: end?.raw ?? null, statuses_overridden: Boolean(l.override_statuses) });
        });
      }
    }
    this.ledger.track('lists', docs.length, await this.store.upsert('task_lists', docs));
    await this.store.upsert(LIST_ORIGINS_COLLECTION, origins);
  }

  private async importSpaces(rawSpaces: Map<string, any>, catalogs: Map<string, ClickupStatusCatalog>): Promise<Map<string, SpaceEntity>> {
    const out = new Map<string, SpaceEntity>();
    for (const [id, raw] of rawSpaces) {
      const now = new Date();
      const current = await this.store.findById('spaces', id);
      const statuses = ClickupStatusCatalog.build(current?.statuses ?? []);
      const entity = new SpaceEntity({ _id: id, workspaceId: this.workspaceId, name: raw.name, statuses, requiredTags: current?.required_tags ?? [], titlePrefixes: current?.title_prefixes ?? [], nextTaskSeq: current?.next_task_seq ?? 1, createdAt: current?.created_at ?? now, updatedAt: now });
      out.set(id, entity);
      this.ledger.track('statuses', catalogs.get(id)!.getEntries().length, statuses.length);
      this.ledger.track('spaces', 1, await this.store.upsert('spaces', [DomainSpaceMapper.toPersistence(entity)]));
    }
    return out;
  }

  private recordStatusMapping(tasks: Map<string, ImportedTask>, spaces: Map<string, SpaceEntity>, catalogs: Map<string, ClickupStatusCatalog>): void {
    const counts = new Map<string, number>();
    for (const { raw, spaceId } of tasks.values()) {
      const key = `${spaceId}:${String(raw.status?.status ?? '').trim().toLowerCase()}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    for (const [spaceId, catalog] of catalogs) {
      for (const { name, type } of catalog.getEntries()) {
        const resolved = spaces.get(spaceId)!.resolveStatus(name);
        this.statusMapping.push({ original: name, status: resolved ?? ClickupStatusCatalog.closest(name, type), tasks: counts.get(`${spaceId}:${name.toLowerCase()}`) ?? 0, closest: !resolved });
      }
    }
  }

  private async importCustomFields(lists: ImportedList[], tasks: Map<string, ImportedTask>): Promise<void> {
    const raws = new Map<string, { raw: any; spaceId: string }>();
    for (const list of lists) {
      try {
        const { fields } = await this.client.get<{ fields: any[] }>(`/list/${list.id}/field`);
        for (const field of fields ?? []) raws.set(String(field.id), { raw: field, spaceId: list.spaceId });
      } catch (error) {
        this.ledger.mismatch('custom_field', list.id, `fields of the list could not be read: ${(error as Error).message}`);
      }
    }
    for (const { raw, spaceId } of tasks.values()) for (const field of raw.custom_fields ?? []) if (!raws.has(String(field.id))) raws.set(String(field.id), { raw: field, spaceId });
    const now = new Date();
    const docs: any[] = [];
    let unsupported = 0;
    for (const [id, { raw, spaceId }] of raws) {
      const type = ClickupCustomFieldMapper.type(raw);
      if (!type) {
        unsupported++;
        this.ledger.mismatch('custom_field', id, `type "${raw.type}" of field "${raw.name}" has no equivalent in Orbit`);
        continue;
      }
      const current = await this.store.findById('custom_field_definitions', id);
      docs.push(DomainCustomFieldDefinitionMapper.toPersistence(new CustomFieldDefinitionEntity({ _id: id, workspaceId: this.workspaceId, spaceId, name: raw.name, type, options: ClickupCustomFieldMapper.options(raw), createdAt: current?.created_at ?? now, updatedAt: now })));
    }
    this.ledger.track('custom_fields', docs.length, await this.store.upsert('custom_field_definitions', docs));
    this.ledger.skip('custom_fields_unsupported', unsupported, 'Orbit only has dropdown, URL and date fields');
  }

  private resolveUser(rawId: unknown, taskId: string, role: string, stubs: Map<string, any>): string | null {
    if (rawId === undefined || rawId === null) return null;
    const key = String(rawId);
    if (!(Number(key) > 0)) return null;
    const known = this.userMap.get(key);
    if (known) return known;
    const id = newId();
    this.userMap.set(key, id);
    const now = new Date();
    stubs.set(key, DomainUserMapper.toPersistence(new UserEntity({ _id: id, workspaceId: this.workspaceId, email: `clickup-${key}@import.invalid`, name: `Usuário ${key}`, avatarUrl: null, clickupId: key, role: UserRole.MEMBER, status: UserStatus.DISABLED, createdAt: now, updatedAt: now })));
    this.ledger.mismatch('user', key, `${role} on ${taskId} is not a member of the team; imported as disabled stub`);
    return id;
  }

  private async importTasks(tasks: Map<string, ImportedTask>, spaces: Map<string, SpaceEntity>): Promise<void> {
    const docs: any[] = [];
    const origins: any[] = [];
    const statusOrigins: any[] = [];
    const dependencies = new Map<string, any>();
    let valuesCopied = 0;
    let valuesSkipped = 0;
    let linked = 0;
    let estimates = 0;
    let inlineFiles = 0;
    const now = new Date();
    for (const [id, { raw, spaceId, archived }] of tasks) {
      const space = spaces.get(spaceId)!;
      const mapped = ClickupImportMapper.statusAndTags(space, raw.status?.status, raw.tags);
      const status = mapped.status ?? ClickupStatusCatalog.closest(mapped.source, raw.status?.type);
      if (!mapped.status) this.ledger.mismatch('task', id, `status "${mapped.source}" has no match among the space statuses; imported as "${status}"`);
      const originalStatus = String(raw.status?.status ?? '').trim();
      this.statusOrigins.push({ taskId: id, original: originalStatus, status });
      statusOrigins.push({ _id: id, original: originalStatus, status });
      const creator = this.authorOf(raw.creator?.id, id, 'creator');
      const assignees = (raw.assignees ?? []).map((a: any) => this.resolveUser(a.id, id, 'assignee', this.pendingStubs)).filter(Boolean) as string[];
      const watchers = (raw.watchers ?? []).map((a: any) => this.resolveUser(a.id, id, 'watcher', this.pendingStubs)).filter(Boolean) as string[];
      const customFields = [];
      for (const field of raw.custom_fields ?? []) {
        if (field.value === undefined || field.value === null || field.value === '') continue;
        const value = ClickupCustomFieldMapper.value(field);
        if (value) {
          customFields.push(value);
          valuesCopied++;
        } else {
          valuesSkipped++;
        }
      }
      if (raw.parent && !tasks.has(String(raw.parent))) this.ledger.mismatch('task', id, `parent ${raw.parent} was not fetched`);
      for (const dep of raw.dependencies ?? []) {
        const taskId = String(dep.task_id);
        const dependsOnId = String(dep.depends_on);
        if (!tasks.has(taskId) || !tasks.has(dependsOnId)) {
          this.ledger.mismatch('dependency', id, `dependency ${taskId} -> ${dependsOnId} points to a task that was not fetched`);
          continue;
        }
        dependencies.set(`${taskId}:${dependsOnId}`, DomainTaskDependencyMapper.toPersistence(new TaskDependencyEntity({ _id: `${taskId}:${dependsOnId}`, workspaceId: this.workspaceId, taskId, dependsOnId, createdAt: now, updatedAt: now })));
      }
      linked += raw.linked_tasks?.length ?? 0;
      if (raw.time_estimate) estimates++;
      const description = ClickupImportMapper.description(raw);
      if (INLINE_FILE_URL_PATTERN.test(description)) inlineFiles++;
      const due = ClickupDatePolicy.resolve(raw.due_date, raw.due_date_time, this.zone);
      const start = ClickupDatePolicy.resolve(raw.start_date, raw.start_date_time, this.zone);
      for (const [field, date] of [['due', due], ['start', start]] as const) if (date) this.dateOrigins.push({ taskId: id, field, raw: date.raw, instant: date.instant.toISOString(), hasTime: date.hasTime, localDay: date.localDay });
      if (due || start) origins.push({ _id: id, due: due ? { raw: due.raw, instant: due.instant, has_time: due.hasTime, local_day: due.localDay } : null, start: start ? { raw: start.raw, instant: start.instant, has_time: start.hasTime, local_day: start.localDay } : null, zone: this.zone });
      const created = ClickupImportMapper.date(raw.date_created) ?? new Date();
      docs.push(DomainTaskMapper.toPersistence(new TaskEntity({
        _id: id,
        workspaceId: this.workspaceId,
        spaceId,
        listId: String(raw.list.id),
        parentId: raw.parent ? String(raw.parent) : null,
        title: String(raw.name ?? '').trim() || UNTITLED,
        descriptionMd: description,
        status,
        priority: ClickupImportMapper.priority(raw.priority),
        tags: mapped.tags,
        assigneeIds: [...new Set(assignees)],
        watcherIds: [...new Set(watchers)],
        points: raw.points === null || raw.points === undefined ? null : Number(raw.points),
        startDate: start?.day ?? null,
        dueDate: due?.day ?? null,
        customFields,
        checklists: ClickupImportMapper.checklists(raw.checklists, (cid) => this.resolveUser(cid, id, 'checklist assignee', this.pendingStubs)),
        creatorId: creator,
        dateClosed: ClickupImportMapper.closedAt(raw, space.isClosedStatus(status), ClickupImportMapper.date(raw.date_updated) ?? created),
        archived: archived || raw.archived === true,
        clickupId: id,
        createdAt: created,
        updatedAt: ClickupImportMapper.date(raw.date_updated) ?? created,
      })));
    }
    await this.storeStubs();
    this.ledger.track('tasks', tasks.size, await this.store.upsert('tasks', docs));
    await this.store.upsert(DATE_ORIGINS_COLLECTION, origins);
    await this.store.upsert(STATUS_ORIGINS_COLLECTION, statusOrigins);
    this.ledger.track('dependencies', dependencies.size, await this.store.upsert('task_dependencies', [...dependencies.values()]));
    this.ledger.track('custom_field_values', valuesCopied + valuesSkipped, valuesCopied);
    this.ledger.skip('custom_field_values', valuesSkipped, 'value of a field type Orbit does not have, or an option that no longer exists');
    this.ledger.skip('linked_tasks', linked, 'Orbit has blockers but no plain link between tasks');
    this.ledger.skip('time_estimates', estimates, 'estimates live in the planning record, not part of this copy');
    this.ledger.skip('inline_file_links', inlineFiles, 'descriptions keep their images as links to ClickUp, the files that are also attachments are copied');
  }

  private async importTags(rawSpaces: Map<string, any>, tasks: Map<string, ImportedTask>): Promise<void> {
    const used = new Set<string>();
    for (const { raw } of tasks.values()) for (const tag of raw.tags ?? []) used.add(String(tag.name).toLowerCase());
    const catalog = new Set<string>();
    for (const id of rawSpaces.keys()) {
      const { tags } = await this.client.get<{ tags: any[] }>(`/space/${id}/tag`);
      for (const tag of tags ?? []) catalog.add(String(tag.name).toLowerCase());
    }
    this.ledger.track('tags', new Set([...catalog, ...used]).size, used.size);
    this.ledger.skip('tags_without_tasks', [...catalog].filter((t) => !used.has(t)).length, 'Orbit keeps tags on tasks, a tag no task uses has nowhere to live');
  }

  private async importComments(taskIds: string[], options: ImportOptions): Promise<void> {
    let fetched = 0;
    let stored = 0;
    for (let n = 0; n < taskIds.length; n++) {
      const taskId = taskIds[n];
      try {
        const all = await this.readComments(taskId);
        fetched += all.length;
        const docs: any[] = [];
        for (const c of all) docs.push(this.toCommentDoc(c, taskId, (await this.store.findById('comments', String(c.id)))?.attachment_ids ?? []));
        stored += await this.store.upsert('comments', docs);
        await this.importCommentFiles(all, taskId);
      } catch (error) {
        this.ledger.mismatch('comment', taskId, `comments could not be read: ${(error as Error).message}`);
      }
      if ((n + 1) % 100 === 0) {
        await this.storeStubs();
        options.log(`comments: ${n + 1}/${taskIds.length} tasks, ${fetched} comments`);
      }
    }
    await this.storeStubs();
    this.ledger.track('comments', fetched, stored);
  }

  private async readComments(taskId: string): Promise<any[]> {
    const { comments, replies } = await new ClickupCommentReader(this.client).read(taskId);
    this.ledger.track('comment_replies', replies.length, replies.length);
    return [...comments, ...replies];
  }

  private toCommentDoc(c: any, taskId: string, attachmentIds: string[]): any {
    const text = String(c.comment_text ?? '');
    const when = ClickupImportMapper.date(c.date) ?? new Date();
    const author = this.authorOf(c.user?.id, taskId, 'comment author');
    return DomainCommentMapper.toPersistence(new CommentEntity({ _id: String(c.id), workspaceId: this.workspaceId, taskId, authorId: author, bodyMd: text, mentionIds: [], attachmentIds, dailyLogDate: text.startsWith(DAILY_LOG_HEADING_PREFIX) ? DailyLogPolicy.dateKey(when) : null, editedAt: null, clickupId: String(c.id), createdAt: when, updatedAt: when }));
  }

  private async importCommentFiles(comments: any[], taskId: string): Promise<void> {
    for (const comment of comments) {
      const files = (comment.comment ?? []).map((block: any) => block?.attachment).filter((a: any) => a?.url);
      if (files.length) await this.storeAttachmentRecords(files, taskId, String(comment.id), 'comment_attachments');
    }
  }

  private async importAttachmentRecords(taskIds: string[], options: ImportOptions): Promise<void> {
    let timeSpent = 0;
    for (let n = 0; n < taskIds.length; n++) {
      const taskId = taskIds[n];
      try {
        const full = await this.client.get<any>(`/task/${taskId}`);
        if (full.time_spent) timeSpent++;
        await this.storeAttachmentRecords(full.attachments ?? [], taskId, null, 'attachments');
      } catch (error) {
        this.ledger.mismatch('attachment', taskId, `attachments of the task could not be read: ${(error as Error).message}`);
      }
      if ((n + 1) % 100 === 0) options.log(`attachment records: ${n + 1}/${taskIds.length} tasks`);
    }
    this.ledger.skip('time_tracked', timeSpent, 'tasks with tracked time; the time entries are not part of this copy');
  }

  private async storeAttachmentRecords(rawFiles: any[], taskId: string, commentId: string | null, countKey: string): Promise<void> {
    const live = rawFiles.filter((a) => !a.deleted && !a.is_folder && a.url);
    const docs: any[] = [];
    const sources: any[] = [];
    for (const file of live) {
      const id = String(file.id);
      const current = await this.store.findById('attachments', id);
      const filename = String(file.title ?? id);
      const safeName = filename.replace(/[^A-Za-z0-9._-]/g, '_').replace(/\.{2,}/g, '_').slice(0, 120);
      const when = ClickupImportMapper.date(file.date) ?? new Date();
      docs.push(DomainAttachmentMapper.toPersistence(new AttachmentEntity({ _id: id, workspaceId: this.workspaceId, taskId, commentId: commentId ?? current?.comment_id ?? null, storageKey: current?.storage_key ?? `${this.workspaceId}/${taskId}/${id}-${safeName}`, filename, mimeType: String(file.mimetype ?? 'application/octet-stream'), sizeBytes: current?.confirmed ? Number(current.size_bytes) : Number(file.size ?? 0), uploaderId: this.authorOf(file.user?.id, taskId, 'attachment uploader'), confirmed: current?.confirmed === true, createdAt: when, updatedAt: when })));
      sources.push({ _id: id, task_id: taskId, url: ClickupAttachmentLinks.withoutToken(file.url), size: Number(file.size ?? 0), date: file.date ?? null });
    }
    this.ledger.track(countKey, live.length, await this.store.upsert('attachments', docs));
    await this.store.upsert(ATTACHMENT_SOURCES_COLLECTION, sources);
  }

  private async finalizeCounts(): Promise<void> {
    const checks: Array<[string, string]> = [['spaces', 'spaces'], ['folders', 'folders'], ['lists', 'task_lists'], ['tasks', 'tasks']];
    for (const [key, collection] of checks) {
      const entry = this.ledger.counts[key];
      if (!entry) continue;
      entry.stored = await this.store.count(collection, { workspace_id: this.workspaceId, clickup_id: { $ne: null } }).then((withId) => (withId > 0 ? withId : this.store.count(collection, { workspace_id: this.workspaceId })));
    }
    const tasks = this.ledger.counts['tasks'];
    const teamWide = this.ledger.counts['tasks_team_wide'];
    if (tasks && tasks.stored < tasks.fetched) this.ledger.mismatch('count', 'tasks', `database holds ${tasks.stored} tasks, ClickUp returned ${tasks.fetched}`);
    if (tasks && teamWide && teamWide.fetched > tasks.fetched) this.ledger.mismatch('count', 'tasks', `team-wide listing returned ${teamWide.fetched}, more than the ${tasks.fetched} from the lists`);
  }
}
