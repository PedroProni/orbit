import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EnvConfigService } from '@common/env/services/env-config.service';
import { TaskRecurrenceUseCase } from '@application/use-cases/planning/task-recurrence.use-case';

@Injectable()
export class RecurrenceScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RecurrenceScheduler.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly env: EnvConfigService,
    private readonly recurrence: TaskRecurrenceUseCase,
  ) {}

  onModuleInit(): void {
    const interval = this.env.getSchedulerIntervalMs();
    if (interval <= 0) return;
    this.timer = setInterval(() => void this.tick(), interval);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const created = await this.recurrence.runDue();
      if (created > 0) this.logger.log(`Recurrence created ${created} task(s)`);
    } catch (error) {
      this.logger.error(`Recurrence tick failed: ${(error as Error).message}`);
    } finally {
      this.running = false;
    }
  }
}
