import { AutomationTriggerType } from '@domain/enums/automation.enums';
import { AutomationActionType } from '@domain/enums/automation.enums';

export interface AutomationEntityProps {
  _id: string;
  workspaceId: string;
  listId: string | null;
  name: string;
  triggerType: AutomationTriggerType;
  triggerStatus: string | null;
  actionType: AutomationActionType;
  actionValue: string;
  active: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
