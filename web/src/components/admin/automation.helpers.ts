import { Automation, AutomationActionType, AutomationInput, AutomationTriggerType } from '@/services/automation.types';
import { ListNode, SpaceNode } from '@/types/api.types';
import { AUTOMATION_ALL_LISTS, AUTOMATION_COMMENT_MAX_LENGTH, AUTOMATION_FALLBACK_REASON, AUTOMATION_KNOWN_REASONS, AUTOMATION_NOTIFY_USERS, AUTOMATION_REQUIRED_TRIGGER_VALUES, AUTOMATION_WEBHOOK_MAX_LENGTH, AUTOMATION_WEBHOOK_SCHEME, AUTOMATION_WEBHOOK_STATUS_REASON } from './automation.constants';
import { AutomationDraft, AutomationProblem, DescribedRunReason } from './automation.types';

export const emptyAutomationDraft = (): AutomationDraft => ({ name: '', listId: AUTOMATION_ALL_LISTS, triggerType: 'task_created', triggerValue: '', actionType: 'assign', actionValue: '', actionUserIds: [], rotateSecret: false });

export const draftFromAutomation = (automation: Automation): AutomationDraft => ({
  name: automation.name,
  listId: automation.listId ?? AUTOMATION_ALL_LISTS,
  triggerType: automation.triggerType,
  triggerValue: automation.triggerValue ?? '',
  actionType: automation.actionType,
  actionValue: automation.actionValue,
  actionUserIds: automation.actionUserIds,
  rotateSecret: false,
});

export const defaultActionValue = (actionType: AutomationActionType): string => (actionType === 'notify' ? 'assignees' : '');

export const isHttpsUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === AUTOMATION_WEBHOOK_SCHEME && !!url.hostname;
  } catch {
    return false;
  }
};

export const webhookHost = (value: string): string => {
  try {
    return new URL(value).host;
  } catch {
    return value;
  }
};

const triggerNeedsValue = (triggerType: AutomationTriggerType): boolean => AUTOMATION_REQUIRED_TRIGGER_VALUES.includes(triggerType);

const actionProblem = (draft: AutomationDraft): AutomationProblem => {
  const value = draft.actionValue.trim();
  if (draft.actionType === 'comment' && value.length > AUTOMATION_COMMENT_MAX_LENGTH) return 'commentTooLong';
  if (!value) return 'actionValueRequired';
  if (draft.actionType === 'webhook' && value.length > AUTOMATION_WEBHOOK_MAX_LENGTH) return 'webhookTooLong';
  if (draft.actionType === 'webhook' && !isHttpsUrl(value)) return 'webhookHttps';
  if (draft.actionType === 'notify' && value === AUTOMATION_NOTIFY_USERS && draft.actionUserIds.length === 0) return 'usersRequired';
  return null;
};

export const automationProblem = (draft: AutomationDraft): AutomationProblem => {
  if (!draft.name.trim()) return 'nameRequired';
  if (triggerNeedsValue(draft.triggerType) && !draft.triggerValue) return 'triggerValueRequired';
  return actionProblem(draft);
};

export const draftToInput = (draft: AutomationDraft): AutomationInput => {
  const actionValue = draft.actionValue.trim();
  return {
    name: draft.name.trim(),
    listId: draft.listId || null,
    triggerType: draft.triggerType,
    triggerValue: draft.triggerType === 'task_created' ? null : draft.triggerValue || null,
    actionType: draft.actionType,
    actionValue,
    actionUserIds: draft.actionType === 'notify' && actionValue === AUTOMATION_NOTIFY_USERS ? draft.actionUserIds : [],
    ...(draft.rotateSecret ? { rotateSecret: true } : {}),
  };
};

export const findAutomationList = (spaces: SpaceNode[], listId: string | null): { space: SpaceNode; list: ListNode } | null => {
  if (!listId) return null;
  for (const space of spaces) {
    const list = space.lists.find((item) => item.id === listId);
    if (list) return { space, list };
  }
  return null;
};

export const automationStatusNames = (spaces: SpaceNode[], listId: string): string[] => {
  const scoped = findAutomationList(spaces, listId);
  const source = scoped ? [scoped.space] : spaces;
  return [...new Set(source.flatMap((space) => [...space.statuses].sort((a, b) => a.order - b.order).map((status) => status.name)))];
};

export const describeRunReason = (reason: string | null): DescribedRunReason | null => {
  if (!reason) return null;
  const status = AUTOMATION_WEBHOOK_STATUS_REASON.exec(reason);
  if (status) return { key: 'webhook_status', values: { code: status[1] } };
  return { key: (AUTOMATION_KNOWN_REASONS as readonly string[]).includes(reason) ? reason : AUTOMATION_FALLBACK_REASON };
};
