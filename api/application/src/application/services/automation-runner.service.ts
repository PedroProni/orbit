import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Subscription } from 'rxjs';
import { AUTOMATION_INJECT_TOKEN, TASK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AutomationRepository } from '@domain/repositories/automation.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { AutomationEntity } from '@domain/entities/automation.entity';
import { AutomationActionType, AutomationTriggerType } from '@domain/enums/automation.enums';
import { TaskPriority } from '@domain/enums/task.enums';
import { TaskEvent } from '@domain/types/task-event.type';
import { RealtimeService } from '@application/services/realtime.service';

@Injectable()
export class AutomationRunner implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AutomationRunner.name);
  private subscription: Subscription | null = null;

  constructor(
    @Inject(AUTOMATION_INJECT_TOKEN) private readonly automations: AutomationRepository,
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    private readonly realtime: RealtimeService,
  ) {}

  onModuleInit(): void {
    this.subscription = this.realtime.all().subscribe((event) => void this.handle(event));
  }

  onModuleDestroy(): void {
    this.subscription?.unsubscribe();
  }

  async handle(event: TaskEvent): Promise<number> {
    let type: AutomationTriggerType | null = null;
    if (event.type === 'task.created') type = AutomationTriggerType.TASK_CREATED;
    else if (event.type === 'task.updated' && event.statusChanged) type = AutomationTriggerType.STATUS_CHANGED;
    if (!type) return 0;
    try {
      const candidates = await this.automations.findMany({ workspace_id: event.workspaceId, active: true, trigger_type: type });
      const matching = candidates.filter((a) => a.matches(type as AutomationTriggerType, event.listId, event.status));
      for (const automation of matching) await this.apply(automation, event);
      return matching.length;
    } catch (error) {
      this.logger.warn(`Automation failed: ${(error as Error).message}`);
      return 0;
    }
  }

  private async apply(automation: AutomationEntity, event: TaskEvent): Promise<void> {
    if (automation.getActionType() === AutomationActionType.ASSIGN) await this.tasks.modifySets(event.taskId, event.workspaceId, { assigneeIds: { add: [automation.getActionValue()], remove: [] } });
    else if (automation.getActionType() === AutomationActionType.ADD_TAG) await this.tasks.modifySets(event.taskId, event.workspaceId, { tags: { add: [automation.getActionValue().toLowerCase()], remove: [] } });
    else {
      const task = await this.tasks.findByIdInWorkspace(event.taskId, event.workspaceId);
      if (!task) return;
      task.changePriority(automation.getActionValue() as TaskPriority);
      await this.tasks.patch(task, ['priority']);
    }
  }
}
