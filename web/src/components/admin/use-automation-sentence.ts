'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useStatusLabel } from '@/hooks/use-status-label';
import { Member } from '@/types/api.types';
import { webhookHost } from './automation.helpers';
import { AutomationSentenceSource } from './automation.types';

export function useAutomationSentence(members: Member[]): (source: AutomationSentenceSource) => string {
  const t = useTranslations('admin.automations');
  const tp = useTranslations('tasks.priority');
  const statusLabel = useStatusLabel();
  return useCallback(
    (source: AutomationSentenceSource) => {
      const person = (id: string | null) => members.find((member) => member.id === id)?.name ?? t('unknownPerson');
      const value = source.triggerValue;
      const trigger = (() => {
        switch (source.triggerType) {
          case 'status_changed':
            return t('triggerText.status_changed', { status: statusLabel(value ?? '') });
          case 'priority_changed':
            return value ? t('triggerText.priority_changed', { priority: tp(value) }) : t('triggerText.priority_changed_any');
          case 'assignee_added':
            return value ? t('triggerText.assignee_added', { person: person(value) }) : t('triggerText.assignee_added_any');
          case 'date_reached':
            return t(value === 'start_date' ? 'triggerText.date_reached_start_date' : 'triggerText.date_reached_due_date');
          default:
            return t('triggerText.task_created');
        }
      })();
      const action = (() => {
        switch (source.actionType) {
          case 'assign':
            return t('actionText.assign', { person: person(source.actionValue) });
          case 'add_tag':
            return t('actionText.add_tag', { tag: source.actionValue });
          case 'set_priority':
            return t('actionText.set_priority', { priority: tp(source.actionValue) });
          case 'set_status':
            return t('actionText.set_status', { status: statusLabel(source.actionValue) });
          case 'comment':
            return t('actionText.comment');
          case 'notify':
            return source.actionValue === 'users' ? t('actionText.notify_users', { people: source.actionUserIds.map(person).join(', ') }) : t(source.actionValue === 'watchers' ? 'actionText.notify_watchers' : 'actionText.notify_assignees');
          default:
            return t('actionText.webhook', { host: webhookHost(source.actionValue) });
        }
      })();
      return t('sentence', { trigger, action });
    },
    [members, statusLabel, t, tp],
  );
}
