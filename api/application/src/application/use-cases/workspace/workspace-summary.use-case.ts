import { Inject, Injectable } from '@nestjs/common';
import { DOC_INJECT_TOKEN, FOLDER_INJECT_TOKEN, SPACE_INJECT_TOKEN, TASK_INJECT_TOKEN, TASK_LIST_INJECT_TOKEN, USER_INJECT_TOKEN, WORKSPACE_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { WorkspaceRepository } from '@domain/repositories/workspace.repository';
import { UserRepository } from '@domain/repositories/user.repository';
import { SpaceRepository } from '@domain/repositories/space.repository';
import { FolderRepository } from '@domain/repositories/folder.repository';
import { TaskListRepository } from '@domain/repositories/task-list.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { DocRepository } from '@domain/repositories/doc.repository';
import { UserRole, UserStatus } from '@domain/enums/user.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { WorkspaceSummaryView } from '@domain/types/workspace-summary-view.type';
import { EnvConfigService } from '@common/env/services/env-config.service';

@Injectable()
export class WorkspaceSummaryUseCase {
  constructor(
    @Inject(WORKSPACE_INJECT_TOKEN) private readonly workspaces: WorkspaceRepository,
    @Inject(USER_INJECT_TOKEN) private readonly users: UserRepository,
    @Inject(SPACE_INJECT_TOKEN) private readonly spaces: SpaceRepository,
    @Inject(FOLDER_INJECT_TOKEN) private readonly folders: FolderRepository,
    @Inject(TASK_LIST_INJECT_TOKEN) private readonly lists: TaskListRepository,
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    @Inject(DOC_INJECT_TOKEN) private readonly docs: DocRepository,
    private readonly env: EnvConfigService,
  ) {}

  async execute(principal: AuthPrincipal): Promise<WorkspaceSummaryView> {
    const workspaceId = principal.workspaceId;
    const roles = Object.values(UserRole);
    const statuses = Object.values(UserStatus);
    const [workspace, roleCounts, statusCounts, spaces, folders, lists, openTasks, closedTasks, docs] = await Promise.all([
      this.workspaces.findById(workspaceId),
      Promise.all(roles.map((role) => this.users.count({ workspace_id: workspaceId, role }))),
      Promise.all(statuses.map((status) => this.users.count({ workspace_id: workspaceId, status }))),
      this.spaces.count({ workspace_id: workspaceId }),
      this.folders.count({ workspace_id: workspaceId }),
      this.lists.count({ workspace_id: workspaceId }),
      this.tasks.count({ workspace_id: workspaceId, archived: { $ne: true }, date_closed: null }),
      this.tasks.count({ workspace_id: workspaceId, archived: { $ne: true }, date_closed: { $ne: null } }),
      this.docs.count({ workspace_id: workspaceId, archived: { $ne: true } }),
    ]);
    return {
      workspace: workspace ? { name: workspace.getName(), slug: workspace.getSlug(), createdAt: workspace.getCreatedAt() } : null,
      members: { byRole: Object.fromEntries(roles.map((role, index) => [role, roleCounts[index]])), byStatus: Object.fromEntries(statuses.map((status, index) => [status, statusCounts[index]])) },
      counts: { spaces, folders, lists, openTasks, closedTasks, docs },
      integrations: {
        githubWebhookSecret: this.env.getGithubWebhookSecret().length > 0,
        githubToken: this.env.getGithubToken().length > 0,
        githubRepositories: this.env.getGithubRepositories().length,
        automationKey: this.env.getAutomationSecretKey().length > 0,
        fileStorage: this.env.getS3Endpoint().length > 0 && this.env.getS3AccessKey().length > 0 && this.env.getS3SecretKey().length > 0,
        devLogin: this.env.isDevLoginEnabled(),
      },
    };
  }
}
