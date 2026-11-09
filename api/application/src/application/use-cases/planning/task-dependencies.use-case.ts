import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TASK_DEPENDENCY_INJECT_TOKEN, TASK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { TaskDependencyRepository } from '@domain/repositories/task-dependency.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { TaskDependencyEntity } from '@domain/entities/task-dependency.entity';
import { DependencyPolicy } from '@domain/policies/dependency.policy';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { newId } from '@common/helpers/functions/id.helper';
import { AuditService } from '@application/services/audit.service';

@Injectable()
export class TaskDependenciesUseCase {
  constructor(
    @Inject(TASK_DEPENDENCY_INJECT_TOKEN) private readonly deps: TaskDependencyRepository,
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    private readonly audit: AuditService,
  ) {}

  async list(principal: AuthPrincipal, taskId: string) {
    await this.assertTask(principal, taskId);
    const [blockedBy, blocking] = await Promise.all([this.deps.findMany({ workspace_id: principal.workspaceId, task_id: taskId }), this.deps.findMany({ workspace_id: principal.workspaceId, depends_on_id: taskId })]);
    return { blockedBy: blockedBy.map((d) => d.getDependsOnId()), blocking: blocking.map((d) => d.getTaskId()) };
  }

  async add(principal: AuthPrincipal, taskId: string, dependsOnId: string) {
    await this.assertTask(principal, taskId);
    await this.assertTask(principal, dependsOnId);
    const edges = await this.deps.findMany({ workspace_id: principal.workspaceId });
    if (edges.some((e) => e.getTaskId() === taskId && e.getDependsOnId() === dependsOnId)) throw new ConflictException('Dependency already exists');
    if (DependencyPolicy.wouldCreateCycle(edges.map((e) => ({ taskId: e.getTaskId(), dependsOnId: e.getDependsOnId() })), taskId, dependsOnId)) throw new BadRequestException('Dependency would create a cycle');
    const now = new Date();
    await this.deps.create(new TaskDependencyEntity({ _id: newId(), workspaceId: principal.workspaceId, taskId, dependsOnId, createdAt: now, updatedAt: now }));
    await this.audit.record(principal, 'task.dependency_added', 'task', taskId, { dependsOnId });
    return this.list(principal, taskId);
  }

  async remove(principal: AuthPrincipal, taskId: string, dependsOnId: string) {
    await this.assertTask(principal, taskId);
    const edge = await this.deps.findOne({ workspace_id: principal.workspaceId, task_id: taskId, depends_on_id: dependsOnId });
    if (!edge) throw new NotFoundException('Dependency not found');
    await this.deps.delete(edge.getId());
    await this.audit.record(principal, 'task.dependency_removed', 'task', taskId, { dependsOnId });
  }

  async openBlockers(workspaceId: string, taskId: string): Promise<string[]> {
    const edges = await this.deps.findMany({ workspace_id: workspaceId, task_id: taskId });
    const open: string[] = [];
    for (const edge of edges) {
      const blocker = await this.tasks.findByIdInWorkspace(edge.getDependsOnId(), workspaceId);
      if (blocker && !blocker.getDateClosed()) open.push(blocker.getId());
    }
    return open;
  }

  private async assertTask(principal: AuthPrincipal, taskId: string): Promise<void> {
    if (!(await this.tasks.findByIdInWorkspace(taskId, principal.workspaceId))) throw new NotFoundException('Task not found');
  }
}
