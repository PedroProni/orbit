import { AutomationRunStatus } from '@domain/enums/automation-run.enums';

export interface AutomationLastRun {
  status: AutomationRunStatus;
  reason: string | null;
  at: Date;
}
