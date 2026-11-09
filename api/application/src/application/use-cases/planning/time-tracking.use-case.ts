import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TASK_INJECT_TOKEN, TIME_ENTRY_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { TimeEntryRepository } from '@domain/repositories/time-entry.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { TimeEntryEntity } from '@domain/entities/time-entry.entity';
import { UserRole } from '@domain/enums/user.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { guardDomain } from '@common/helpers/functions/domain-guard.helper';
import { newId } from '@common/helpers/functions/id.helper';
import { ManualTimeDto } from '@shared/dtos/planning/manual-time.dto';

@Injectable()
export class TimeTrackingUseCase {
  constructor(
    @Inject(TIME_ENTRY_INJECT_TOKEN) private readonly entries: TimeEntryRepository,
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
  ) {}

  async list(principal: AuthPrincipal, taskId: string) {
    await this.assertTask(principal, taskId);
    const found = await this.entries.findMany({ workspace_id: principal.workspaceId, task_id: taskId }, { started_at: -1 });
    return { totalMinutes: found.reduce((sum, e) => sum + e.getMinutes(), 0), entries: found.map(TimeTrackingUseCase.view) };
  }

  async start(principal: AuthPrincipal, taskId: string) {
    await this.assertTask(principal, taskId);
    const running = await this.entries.findOne({ workspace_id: principal.workspaceId, user_id: principal.userId, ended_at: null });
    if (running) throw new ConflictException('A timer is already running');
    const now = new Date();
    return TimeTrackingUseCase.view(await this.entries.create(new TimeEntryEntity({ _id: newId(), workspaceId: principal.workspaceId, taskId, userId: principal.userId, startedAt: now, endedAt: null, minutes: 0, createdAt: now, updatedAt: now })));
  }

  async stop(principal: AuthPrincipal, taskId: string) {
    await this.assertTask(principal, taskId);
    const running = await this.entries.findOne({ workspace_id: principal.workspaceId, user_id: principal.userId, task_id: taskId, ended_at: null });
    if (!running) throw new NotFoundException('No running timer for this task');
    guardDomain(() => running.stop(new Date()));
    return TimeTrackingUseCase.view(await this.entries.update(running));
  }

  async addManual(principal: AuthPrincipal, taskId: string, dto: ManualTimeDto) {
    await this.assertTask(principal, taskId);
    const started = dto.startedAt ? new Date(dto.startedAt) : new Date(Date.now() - dto.minutes * 60000);
    const now = new Date();
    return TimeTrackingUseCase.view(await this.entries.create(new TimeEntryEntity({ _id: newId(), workspaceId: principal.workspaceId, taskId, userId: principal.userId, startedAt: started, endedAt: new Date(started.getTime() + dto.minutes * 60000), minutes: dto.minutes, createdAt: now, updatedAt: now })));
  }

  async remove(principal: AuthPrincipal, entryId: string) {
    const entry = await this.entries.findByIdInWorkspace(entryId, principal.workspaceId);
    if (!entry) throw new NotFoundException('Time entry not found');
    if (entry.getUserId() !== principal.userId && principal.role !== UserRole.ADMIN && principal.role !== UserRole.OWNER) throw new ForbiddenException('Only the author or an admin can delete a time entry');
    await this.entries.delete(entry.getId());
  }

  private async assertTask(principal: AuthPrincipal, taskId: string): Promise<void> {
    if (!(await this.tasks.findByIdInWorkspace(taskId, principal.workspaceId))) throw new NotFoundException('Task not found');
  }

  private static view(entry: TimeEntryEntity) {
    return { id: entry.getId(), taskId: entry.getTaskId(), userId: entry.getUserId(), startedAt: entry.getStartedAt(), endedAt: entry.getEndedAt(), minutes: entry.getMinutes(), running: entry.isRunning() };
  }
}
