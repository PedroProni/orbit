import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RECURRENCE_RULE_INJECT_TOKEN, TASK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { RecurrenceRuleRepository } from '@domain/repositories/recurrence-rule.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { RecurrenceRuleEntity } from '@domain/entities/recurrence-rule.entity';
import { RecurrencePolicy } from '@domain/policies/recurrence.policy';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { UserRole } from '@domain/enums/user.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { guardDomain } from '@common/helpers/functions/domain-guard.helper';
import { newId } from '@common/helpers/functions/id.helper';
import { CreateTaskUseCase } from '@application/use-cases/task/create-task.use-case';
import { AuditService } from '@application/services/audit.service';
import { SetRecurrenceDto } from '@shared/dtos/planning/set-recurrence.dto';

@Injectable()
export class TaskRecurrenceUseCase {
  private readonly logger = new Logger(TaskRecurrenceUseCase.name);

  constructor(
    @Inject(RECURRENCE_RULE_INJECT_TOKEN) private readonly rules: RecurrenceRuleRepository,
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    private readonly createTask: CreateTaskUseCase,
    private readonly audit: AuditService,
  ) {}

  async get(principal: AuthPrincipal, taskId: string) {
    const rule = await this.rules.findOne({ workspace_id: principal.workspaceId, task_id: taskId });
    return rule ? TaskRecurrenceUseCase.view(rule) : null;
  }

  async set(principal: AuthPrincipal, taskId: string, dto: SetRecurrenceDto) {
    const task = await this.tasks.findByIdInWorkspace(taskId, principal.workspaceId);
    if (!task) throw new NotFoundException('Task not found');
    if (task.getParentId()) throw new BadRequestException('Subtasks cannot recur');
    const firstRun = dto.firstRunAt ? new Date(dto.firstRunAt) : RecurrencePolicy.next(new Date(), dto.frequency, dto.interval);
    const existing = await this.rules.findOne({ workspace_id: principal.workspaceId, task_id: taskId });
    const now = new Date();
    const rule = existing ?? new RecurrenceRuleEntity({ _id: newId(), workspaceId: principal.workspaceId, taskId, frequency: dto.frequency, interval: dto.interval, nextRunAt: firstRun, active: true, lastCreatedTaskId: null, createdBy: principal.userId, createdAt: now, updatedAt: now });
    guardDomain(() => rule.change(dto.frequency, dto.interval, firstRun));
    const saved = existing ? await this.rules.update(rule) : await this.rules.create(rule);
    await this.audit.record(principal, 'task.recurrence_set', 'task', taskId, { frequency: dto.frequency, interval: dto.interval });
    return TaskRecurrenceUseCase.view(saved);
  }

  async remove(principal: AuthPrincipal, taskId: string) {
    const rule = await this.rules.findOne({ workspace_id: principal.workspaceId, task_id: taskId });
    if (!rule) throw new NotFoundException('Recurrence not found');
    await this.rules.delete(rule.getId());
    await this.audit.record(principal, 'task.recurrence_removed', 'task', taskId, {});
  }

  async runDue(now: Date = new Date()): Promise<number> {
    const due = await this.rules.findMany({ active: true, next_run_at: { $lte: now } }, { next_run_at: 1 }, 100);
    let created = 0;
    for (const rule of due) {
      const next = RecurrencePolicy.next(rule.getNextRunAt(), rule.getFrequency(), rule.getInterval());
      const claimed = await this.rules.claimDue(rule.getId(), rule.getNextRunAt(), next);
      if (!claimed) continue;
      if (await this.spawn(rule, next)) created++;
    }
    return created;
  }

  private async spawn(rule: RecurrenceRuleEntity, next: Date): Promise<boolean> {
    const source = await this.tasks.findByIdInWorkspace(rule.getTaskId(), rule.getWorkspaceId());
    const principal: AuthPrincipal = { workspaceId: rule.getWorkspaceId(), actorType: AuditActorType.SYSTEM, actorId: 'recurrence', userId: rule.getCreatedBy(), role: UserRole.MEMBER, scopes: [] };
    if (!source) {
      await this.rules.delete(rule.getId());
      return false;
    }
    const step = next.getTime() - rule.getNextRunAt().getTime();
    const shifted = (date: Date | null) => (date ? new Date(date.getTime() + step) : null);
    try {
      const created = await this.createTask.execute(principal, { listId: source.getListId(), parentId: null, title: source.getTitle(), descriptionMd: source.getDescriptionMd(), status: null, priority: source.getPriority(), tags: source.getTags(), assigneeIds: source.getAssigneeIds(), watcherIds: [], points: source.getPoints(), startDate: shifted(source.getStartDate()), dueDate: shifted(source.getDueDate()), customFields: [], taskKind: null });
      const stored = await this.rules.findById(rule.getId());
      if (stored) {
        stored.recordRun(created.id, next);
        await this.rules.patch(stored, ['lastCreatedTaskId', 'nextRunAt', 'updatedAt']);
      }
      await this.audit.record(principal, 'task.recurrence_spawned', 'task', created.id, { sourceTaskId: source.getId() });
      return true;
    } catch (error) {
      this.logger.warn(`Recurrence ${rule.getId()} could not create a task: ${(error as Error).message}`);
      return false;
    }
  }

  private static view(rule: RecurrenceRuleEntity) {
    return { taskId: rule.getTaskId(), frequency: rule.getFrequency(), interval: rule.getInterval(), nextRunAt: rule.getNextRunAt(), active: rule.getActive(), lastCreatedTaskId: rule.getLastCreatedTaskId() };
  }
}
