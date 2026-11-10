import { Automation, AutomationActionType, AutomationInput, AutomationRunStatus, AutomationSaved, AutomationTriggerType } from '@/services/automation.types';
import { Member, SpaceNode } from '@/types/api.types';

export interface AutomationDraft {
  name: string;
  listId: string;
  triggerType: AutomationTriggerType;
  triggerValue: string;
  actionType: AutomationActionType;
  actionValue: string;
  actionUserIds: string[];
  rotateSecret: boolean;
}

export type AutomationProblem = 'nameRequired' | 'triggerValueRequired' | 'actionValueRequired' | 'commentTooLong' | 'webhookHttps' | 'webhookTooLong' | 'usersRequired' | null;

export interface AutomationSentenceSource {
  triggerType: AutomationTriggerType;
  triggerValue: string | null;
  actionType: AutomationActionType;
  actionValue: string;
  actionUserIds: string[];
}

export interface DescribedRunReason {
  key: string;
  values?: Record<string, string>;
}

export interface AutomationDialogProps {
  open: boolean;
  automation: Automation | null;
  spaces: SpaceNode[];
  members: Member[];
  onSubmit: (input: AutomationInput) => Promise<AutomationSaved>;
  onSaved: (saved: AutomationSaved) => void;
  onClose: () => void;
}

export interface AutomationSecretDialogProps {
  secret: string | null;
  onClose: () => void;
}

export interface AutomationRowProps {
  automation: Automation;
  spaces: SpaceNode[];
  members: Member[];
  onEdit: (automation: Automation) => void;
  onDelete: (automation: Automation) => void;
}

export interface AutomationHistoryProps {
  automationId: string;
}

export interface AutomationRunBadgeProps {
  status: AutomationRunStatus;
  label: string;
  title?: string;
}

export interface AutomationFieldsProps {
  draft: AutomationDraft;
  statuses: string[];
  members: Member[];
  onChange: (patch: Partial<AutomationDraft>) => void;
}

export interface AutomationPeoplePickerProps {
  legend: string;
  members: Member[];
  selected: string[];
  onChange: (ids: string[]) => void;
}
