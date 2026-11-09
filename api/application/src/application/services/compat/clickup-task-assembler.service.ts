import { Inject, Injectable } from '@nestjs/common';
import { FOLDER_INJECT_TOKEN, SPACE_INJECT_TOKEN, TASK_INJECT_TOKEN, TASK_LIST_INJECT_TOKEN, USER_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { FolderRepository } from '@domain/repositories/folder.repository';
import { SpaceRepository } from '@domain/repositories/space.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { TaskListRepository } from '@domain/repositories/task-list.repository';
import { UserRepository } from '@domain/repositories/user.repository';
import { TaskEntity } from '@domain/entities/task.entity';
import { UserEntity } from '@domain/entities/user.entity';
import { CLICKUP_PRIORITIES } from '@domain/constants/clickup-compat.constant';
import { ClickupUserResolver } from '@application/services/compat/clickup-user-resolver.service';

const ms = (date: Date | null): string | null => (date ? String(date.getTime()) : null);

@Injectable()
export class ClickupTaskAssembler {
  constructor(
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    @Inject(TASK_LIST_INJECT_TOKEN) private readonly lists: TaskListRepository,
    @Inject(FOLDER_INJECT_TOKEN) private readonly folders: FolderRepository,
    @Inject(SPACE_INJECT_TOKEN) private readonly spaces: SpaceRepository,
    @Inject(USER_INJECT_TOKEN) private readonly users: UserRepository,
    private readonly resolver: ClickupUserResolver,
  ) {}

  async assemble(workspaceId: string, entities: TaskEntity[], includeSubtasks = false) {
    if (entities.length === 0) return [];
    const uniq = (values: string[]) => [...new Set(values)];
    const subtasks = includeSubtasks ? await this.tasks.findMany({ workspace_id: workspaceId, parent_id: { $in: entities.map((t) => t.getId()) } }, { created_at: 1 }) : [];
    const all = [...entities, ...subtasks];
    const userIds = uniq(all.flatMap((t) => [t.getCreatorId(), ...t.getAssigneeIds(), ...t.getWatcherIds()]));
    const users = new Map<string, UserEntity>((await this.users.findMany({ workspace_id: workspaceId, _id: { $in: userIds } })).map((u) => [u.getId(), u]));
    const lists = new Map((await this.lists.findMany({ workspace_id: workspaceId, _id: { $in: uniq(all.map((t) => t.getListId())) } })).map((l) => [l.getId(), l]));
    const spaces = new Map((await this.spaces.findMany({ workspace_id: workspaceId, _id: { $in: uniq(all.map((t) => t.getSpaceId())) } })).map((s) => [s.getId(), s]));
    const folderIds = uniq([...lists.values()].map((l) => l.getFolderId()).filter((f): f is string => !!f));
    const folders = new Map((await this.folders.findMany({ workspace_id: workspaceId, _id: { $in: folderIds } })).map((f) => [f.getId(), f]));
    const userView = (id: string) => (users.has(id) ? this.resolver.toView(users.get(id)!) : null);

    const build = (task: TaskEntity): Record<string, unknown> => {
      const list = lists.get(task.getListId());
      const space = spaces.get(task.getSpaceId());
      const folder = list?.getFolderId() ? folders.get(list.getFolderId()!) : undefined;
      const statusDef = space?.getStatuses().find((s) => s.name === task.getStatus());
      const priority = task.getPriority() ? { ...CLICKUP_PRIORITIES[task.getPriority()!], priority: task.getPriority() } : null;
      return {
        id: task.getId(),
        custom_id: null,
        name: task.getTitle(),
        text_content: task.getDescriptionMd(),
        description: task.getDescriptionMd(),
        markdown_description: task.getDescriptionMd(),
        status: { id: task.getStatus(), status: task.getStatus(), color: statusDef?.color ?? '#87909e', orderindex: statusDef?.order ?? 0, type: statusDef?.type ?? 'custom' },
        orderindex: '0',
        date_created: ms(task.getCreatedAt()),
        date_updated: ms(task.getUpdatedAt()),
        date_closed: ms(task.getDateClosed()),
        date_done: ms(task.getDateClosed()),
        archived: task.getArchived(),
        creator: userView(task.getCreatorId()),
        assignees: task.getAssigneeIds().map(userView).filter(Boolean),
        watchers: task.getWatcherIds().map(userView).filter(Boolean),
        checklists: task.getChecklists().map((c, i) => ({ id: c.id, name: c.name, orderindex: i, resolved: c.items.filter((x) => x.resolved).length, unresolved: c.items.filter((x) => !x.resolved).length, items: c.items.map((x, j) => ({ id: x.id, name: x.name, orderindex: j, resolved: x.resolved, assignee: x.assigneeId ? userView(x.assigneeId) : null })) })),
        tags: task.getTags().map((name) => ({ name, tag_fg: '#ffffff', tag_bg: '#7b68ee' })),
        parent: task.getParentId(),
        priority,
        due_date: ms(task.getDueDate()),
        start_date: ms(task.getStartDate()),
        points: task.getPoints(),
        time_estimate: null,
        custom_fields: task.getCustomFields().map((c) => ({ id: c.fieldId, value: c.value })),
        list: list ? { id: list.getId(), name: list.getName(), access: true } : null,
        folder: folder ? { id: folder.getId(), name: folder.getName(), hidden: false, access: true } : { id: null, name: 'hidden', hidden: true, access: true },
        space: { id: task.getSpaceId() },
        url: `/t/${task.getId()}`,
      };
    };

    const children = new Map<string, Record<string, unknown>[]>();
    for (const sub of subtasks) children.set(sub.getParentId()!, [...(children.get(sub.getParentId()!) ?? []), build(sub)]);
    return entities.map((t) => (includeSubtasks ? { ...build(t), subtasks: children.get(t.getId()) ?? [] } : build(t)));
  }
}
