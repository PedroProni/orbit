import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EnvConfigService } from '@common/env/services/env-config.service';
import { GithubSyncService } from '@application/services/github-sync.service';

@Injectable()
export class GithubSyncScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GithubSyncScheduler.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly env: EnvConfigService,
    private readonly sync: GithubSyncService,
  ) {}

  onModuleInit(): void {
    const interval = this.env.getGithubSyncIntervalMs();
    if (!Number.isFinite(interval) || interval <= 0 || !this.sync.isEnabled()) return;
    this.timer = setInterval(() => void this.tick(), interval);
    this.timer.unref();
    setTimeout(() => void this.tick(), 0).unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const reports = await this.sync.syncAll();
      for (const report of reports)
        this.logger.log(
          `GitHub sync ${report.repository}: ${report.pullRequests} pull request(s), ${report.branches} branch(es), ${report.commits} commit(s), ${report.removedBranches} removed branch(es)`,
        );
    } catch (error) {
      this.logger.error(`GitHub sync tick failed: ${(error as Error).message}`);
    } finally {
      this.running = false;
    }
  }
}
