import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TASK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { TaskRepository } from '@domain/repositories/task.repository';
import { TaskEntity } from '@domain/entities/task.entity';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { GuestAccessService } from '@application/services/guest-access.service';

@Injectable()
export class TaskAccessService {
  constructor(
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    private readonly guests: GuestAccessService,
  ) {}

  async readable(principal: AuthPrincipal, taskId: string): Promise<TaskEntity> {
    const task = await this.tasks.findByIdInWorkspace(taskId, principal.workspaceId);
    const allowed = await this.guests.allowedListIds(principal);
    if (!task || (allowed && !allowed.includes(task.getListId()))) throw new NotFoundException('Task not found');
    return task;
  }
}
