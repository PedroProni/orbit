import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TASK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { TaskRepository } from '@domain/repositories/task.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { GuestAccessService } from '@application/services/guest-access.service';
import { TaskPresenter } from '@application/presenters/task.presenter';

@Injectable()
export class GetTaskUseCase {
  constructor(
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    private readonly guests: GuestAccessService,
  ) {}

  async execute(principal: AuthPrincipal, taskId: string) {
    const task = await this.tasks.findByIdInWorkspace(taskId, principal.workspaceId);
    const allowed = await this.guests.allowedListIds(principal);
    if (!task || (allowed && !allowed.includes(task.getListId()))) throw new NotFoundException('Task not found');
    const subtasks = await this.tasks.findMany({ workspace_id: principal.workspaceId, parent_id: taskId }, { created_at: 1 });
    return { ...TaskPresenter.toView(task), subtasks: subtasks.map(TaskPresenter.toView) };
  }
}
