import { AutomationActionType, AutomationTriggerType } from '@domain/enums/automation.enums';

export interface AutomationRewrite {
  listId: string | null;
  name: string;
  triggerType: AutomationTriggerType;
  triggerValue: string | null;
  actionType: AutomationActionType;
  actionValue: string;
  actionUserIds: string[];
  active: boolean;
}
