import { AutomationRunEntity } from '@domain/entities/automation-run.entity';
import { BaseRepository } from '@domain/repositories/base.repository';
import { AutomationRunStatus } from '@domain/enums/automation-run.enums';
import { AutomationLastRun } from '@domain/types/automation-last-run.type';

export interface AutomationRunRepository extends BaseRepository<AutomationRunEntity> {
  claim(run: AutomationRunEntity): Promise<boolean>;
  finish(id: string, status: AutomationRunStatus, reason: string | null): Promise<void>;
  recentFinished(automationId: string, limit: number): Promise<AutomationRunEntity[]>;
  lastFinished(automationIds: string[]): Promise<Map<string, AutomationLastRun>>;
  removeForAutomation(automationId: string): Promise<void>;
}
