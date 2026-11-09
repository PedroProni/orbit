import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TASK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { TaskRepository } from '@domain/repositories/task.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AuditService } from '@application/services/audit.service';
import { RealtimeService } from '@application/services/realtime.service';

@Injectable()
export class DeleteTaskUseCase {
  constructor(
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    private readonly audit: AuditService,
    private readonly realtime: RealtimeService,
  ) {}

  async execute(principal: AuthPrincipal, taskId: string): Promise<void> {
    const task = await this.tasks.findByIdInWorkspace(taskId, principal.workspaceId);
    if (!task) throw new NotFoundException('Task not found');
    const children = await this.tasks.findMany({ workspace_id: principal.workspaceId, parent_id: taskId });
    for (const child of children) await this.tasks.delete(child.getId());
    await this.tasks.delete(taskId);
    await this.audit.record(principal, 'task.deleted', 'task', taskId, { title: task.getTitle() });
    this.realtime.publish({ workspaceId: principal.workspaceId, type: 'task.deleted', taskId, listId: task.getListId(), actorId: principal.userId });
  }
}
