import { AutomationRunStatus } from '@domain/enums/automation-run.enums';

export interface AutomationRunOutcome {
  status: AutomationRunStatus;
  reason: string | null;
}
