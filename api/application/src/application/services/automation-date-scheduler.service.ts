import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AUTOMATION_INJECT_TOKEN, TASK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AutomationRepository } from '@domain/repositories/automation.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { AutomationEntity } from '@domain/entities/automation.entity';
import { TaskEntity } from '@domain/entities/task.entity';
import { AutomationDateField, AutomationTriggerType } from '@domain/enums/automation.enums';
import { AUTOMATION_DATE_BATCH_LIMIT, AUTOMATION_DATE_LOOKBACK_MS } from '@domain/constants/automation.constant';
import { EnvConfigService } from '@common/env/services/env-config.service';
import { AutomationRunner } from '@application/services/automation-runner.service';

@Injectable()
export class AutomationDateScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AutomationDateScheduler.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    @Inject(AUTOMATION_INJECT_TOKEN) private readonly automations: AutomationRepository,
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    private readonly runner: AutomationRunner,
    private readonly env: EnvConfigService,
  ) {}

  onModuleInit(): void {
    const interval = this.env.getAutomationDateIntervalMs();
    if (!Number.isFinite(interval) || interval <= 0) return;
    this.timer = setInterval(() => void this.tick(), interval);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async tick(now: Date = new Date()): Promise<number> {
    if (this.running) return 0;
    this.running = true;
    let fired = 0;
    try {
      const automations = await this.automations.findMany({ active: true, trigger_type: AutomationTriggerType.DATE_REACHED }, { created_at: 1 });
      for (const automation of automations) fired += await this.process(automation, now);
    } catch (error) {
      this.logger.error(`Automation date tick failed: ${(error as Error).message}`);
    } finally {
      this.running = false;
    }
    return fired;
  }

  private async process(automation: AutomationEntity, now: Date): Promise<number> {
    const field = automation.getTriggerValue() as AutomationDateField;
    if (!Object.values(AutomationDateField).includes(field)) return 0;
    const cursor = automation.getDateCursor();
    const from = new Date(Math.max(automation.getArmedAt().getTime(), cursor ? cursor.getTime() - AUTOMATION_DATE_LOOKBACK_MS : 0));
    const filter: Record<string, unknown> = { workspace_id: automation.getWorkspaceId(), [field]: { $gt: from, $lte: now }, archived: false, date_closed: null };
    if (automation.getListId()) filter.list_id = automation.getListId();
    const due = await this.tasks.findMany(filter, { [field]: 1, _id: 1 }, AUTOMATION_DATE_BATCH_LIMIT);
    let fired = 0;
    for (const task of due) {
      const at = AutomationDateScheduler.dateOf(task, field);
      if (at && (await this.runner.fire(automation, task.getId(), `date:${task.getId()}:${field}:${at.toISOString()}`))) fired += 1;
    }
    const last = due.length === AUTOMATION_DATE_BATCH_LIMIT ? AutomationDateScheduler.dateOf(due[due.length - 1], field) : null;
    await this.automations.moveDateCursor(automation.getId(), automation.getArmedAt(), last ? new Date(last.getTime() + AUTOMATION_DATE_LOOKBACK_MS - 1) : now);
    return fired;
  }

  private static dateOf(task: TaskEntity, field: AutomationDateField): Date | null {
    return field === AutomationDateField.START_DATE ? task.getStartDate() : task.getDueDate();
  }
}
