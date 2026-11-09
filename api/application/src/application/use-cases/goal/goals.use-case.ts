import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { GOAL_INJECT_TOKEN, TASK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { GoalRepository } from '@domain/repositories/goal.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { GoalEntity } from '@domain/entities/goal.entity';
import { GoalProgressPolicy } from '@domain/policies/goal-progress.policy';
import { OwnedResourceAccessPolicy } from '@domain/policies/owned-resource-access.policy';
import { GoalTarget } from '@domain/types/goal-target.type';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { guardDomain } from '@common/helpers/functions/domain-guard.helper';
import { newId } from '@common/helpers/functions/id.helper';
import { AuditService } from '@application/services/audit.service';
import { SaveGoalDto } from '@shared/dtos/goal/save-goal.dto';

@Injectable()
export class GoalsUseCase {
  constructor(
    @Inject(GOAL_INJECT_TOKEN) private readonly goals: GoalRepository,
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    private readonly audit: AuditService,
  ) {}

  async list(principal: AuthPrincipal) {
    const found = await this.goals.findMany({ workspace_id: principal.workspaceId }, { created_at: -1 });
    return Promise.all(found.map((g) => this.view(principal, g)));
  }

  async get(principal: AuthPrincipal, id: string) {
    return this.view(principal, await this.find(principal, id));
  }

  async create(principal: AuthPrincipal, dto: SaveGoalDto) {
    const targets = await this.targetsFrom(principal, dto);
    const now = new Date();
    const goal = new GoalEntity({ _id: newId(), workspaceId: principal.workspaceId, name: 'x', description: '', ownerId: principal.userId, dueDate: null, targets: [], createdAt: now, updatedAt: now });
    guardDomain(() => goal.rewrite(dto.name, dto.description, dto.dueDate ? new Date(dto.dueDate) : null, targets));
    const saved = await this.goals.create(goal);
    await this.audit.record(principal, 'goal.created', 'goal', saved.getId(), { name: saved.getName() });
    return this.view(principal, saved);
  }

  async update(principal: AuthPrincipal, id: string, dto: SaveGoalDto) {
    const goal = await this.find(principal, id);
    if (!OwnedResourceAccessPolicy.canChange(principal, goal.getOwnerId())) throw new ForbiddenException('Only the owner or an admin can change this goal');
    const targets = await this.targetsFrom(principal, dto);
    guardDomain(() => goal.rewrite(dto.name, dto.description, dto.dueDate ? new Date(dto.dueDate) : null, targets));
    const saved = await this.goals.update(goal);
    await this.audit.record(principal, 'goal.updated', 'goal', id, {});
    return this.view(principal, saved);
  }

  async remove(principal: AuthPrincipal, id: string) {
    const goal = await this.find(principal, id);
    if (!OwnedResourceAccessPolicy.canChange(principal, goal.getOwnerId())) throw new ForbiddenException('Only the owner or an admin can delete this goal');
    await this.goals.delete(id);
    await this.audit.record(principal, 'goal.deleted', 'goal', id, {});
  }

  private async targetsFrom(principal: AuthPrincipal, dto: SaveGoalDto): Promise<GoalTarget[]> {
    const targets: GoalTarget[] = dto.targets.map((t) => ({ id: newId(), name: t.name, kind: t.kind, targetValue: t.targetValue, currentValue: t.currentValue, taskId: t.taskId ?? null }));
    for (const target of targets) {
      if (target.taskId && !(await this.tasks.findByIdInWorkspace(target.taskId, principal.workspaceId))) throw new NotFoundException('Target task not found');
    }
    return targets;
  }

  private async find(principal: AuthPrincipal, id: string): Promise<GoalEntity> {
    const goal = await this.goals.findByIdInWorkspace(id, principal.workspaceId);
    if (!goal) throw new NotFoundException('Goal not found');
    return goal;
  }

  private async view(principal: AuthPrincipal, goal: GoalEntity) {
    const closed = new Set<string>();
    for (const target of goal.getTargets()) {
      if (!target.taskId) continue;
      const task = await this.tasks.findByIdInWorkspace(target.taskId, principal.workspaceId);
      if (task?.getDateClosed()) closed.add(task.getId());
    }
    return { id: goal.getId(), name: goal.getName(), description: goal.getDescription(), ownerId: goal.getOwnerId(), dueDate: goal.getDueDate(), progress: GoalProgressPolicy.progress(goal.getTargets(), closed), targets: goal.getTargets().map((t) => ({ ...t, progress: GoalProgressPolicy.targetProgress(t, closed) })) };
  }
}
