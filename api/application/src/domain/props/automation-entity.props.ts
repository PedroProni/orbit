import { AutomationActionType, AutomationTriggerType } from '@domain/enums/automation.enums';

export interface AutomationEntityProps {
  _id: string;
  workspaceId: string;
  listId: string | null;
  name: string;
  triggerType: AutomationTriggerType;
  triggerValue: string | null;
  actionType: AutomationActionType;
  actionValue: string;
  actionUserIds: string[];
  webhookSecretEnc: string | null;
  active: boolean;
  armedAt: Date;
  dateCursor: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
