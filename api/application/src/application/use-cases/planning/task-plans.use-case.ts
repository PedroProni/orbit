import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TASK_INJECT_TOKEN, TASK_PLAN_INJECT_TOKEN, TIME_ENTRY_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { TaskPlanRepository } from '@domain/repositories/task-plan.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { TimeEntryRepository } from '@domain/repositories/time-entry.repository';
import { TaskPlanEntity } from '@domain/entities/task-plan.entity';
import { TaskKind } from '@domain/enums/task-kind.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { guardDomain } from '@common/helpers/functions/domain-guard.helper';
import { newId } from '@common/helpers/functions/id.helper';
import { AuditService } from '@application/services/audit.service';
import { ChangePlanDto } from '@shared/dtos/planning/change-plan.dto';

@Injectable()
export class TaskPlansUseCase {
  constructor(
    @Inject(TASK_PLAN_INJECT_TOKEN) private readonly plans: TaskPlanRepository,
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    @Inject(TIME_ENTRY_INJECT_TOKEN) private readonly entries: TimeEntryRepository,
    private readonly audit: AuditService,
  ) {}

  async get(principal: AuthPrincipal, taskId: string) {
    await this.assertTask(principal, taskId);
    const plan = await this.plans.findOne({ workspace_id: principal.workspaceId, task_id: taskId });
    const entries = await this.entries.findMany({ workspace_id: principal.workspaceId, task_id: taskId });
    const trackedMinutes = entries.reduce((sum, e) => sum + e.getMinutes(), 0);
    const estimate = plan?.getEstimateMinutes() ?? null;
    return { taskId, taskKind: plan?.getTaskKind() ?? TaskKind.TASK, estimateMinutes: estimate, trackedMinutes, remainingMinutes: estimate === null ? null : Math.max(0, estimate - trackedMinutes) };
  }

  async change(principal: AuthPrincipal, taskId: string, dto: ChangePlanDto) {
    await this.assertTask(principal, taskId);
    const now = new Date();
    const existing = await this.plans.findOne({ workspace_id: principal.workspaceId, task_id: taskId });
    const plan = existing ?? new TaskPlanEntity({ _id: newId(), workspaceId: principal.workspaceId, taskId, estimateMinutes: null, taskKind: TaskKind.TASK, createdAt: now, updatedAt: now });
    guardDomain(() => plan.change(dto.estimateMinutes === undefined ? plan.getEstimateMinutes() : dto.estimateMinutes, dto.taskKind ?? plan.getTaskKind()));
    if (existing) await this.plans.update(plan);
    else await this.plans.create(plan);
    await this.audit.record(principal, 'task.plan_changed', 'task', taskId, { estimateMinutes: plan.getEstimateMinutes(), taskKind: plan.getTaskKind() });
    return this.get(principal, taskId);
  }

  private async assertTask(principal: AuthPrincipal, taskId: string): Promise<void> {
    if (!(await this.tasks.findByIdInWorkspace(taskId, principal.workspaceId))) throw new NotFoundException('Task not found');
  }
}
