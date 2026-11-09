import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AUDIT_LOG_INJECT_TOKEN, TASK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AuditLogRepository } from '@domain/repositories/audit-log.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { GuestAccessService } from '@application/services/guest-access.service';

@Injectable()
export class TaskActivityUseCase {
  constructor(
    @Inject(AUDIT_LOG_INJECT_TOKEN) private readonly logs: AuditLogRepository,
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    private readonly guests: GuestAccessService,
  ) {}

  async execute(principal: AuthPrincipal, taskId: string) {
    const task = await this.tasks.findByIdInWorkspace(taskId, principal.workspaceId);
    const allowed = await this.guests.allowedListIds(principal);
    if (!task || (allowed && !allowed.includes(task.getListId()))) throw new NotFoundException('Task not found');
    const logs = await this.logs.findMany({ workspace_id: principal.workspaceId, entity_type: 'task', entity_id: taskId }, { created_at: -1 }, 100);
    return logs.map((log) => ({ id: log.getId(), action: log.getAction(), actorId: log.getActorId(), diff: (log.getMeta().diff as Record<string, { before: unknown; after: unknown }> | undefined) ?? {}, createdAt: log.getCreatedAt() }));
  }
}
