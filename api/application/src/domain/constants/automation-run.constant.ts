import { AutomationRunStatus } from '@domain/enums/automation-run.enums';

export const AUTOMATION_RUN_FINISHED_STATUSES = [AutomationRunStatus.DONE, AutomationRunStatus.SKIPPED, AutomationRunStatus.FAILED];
