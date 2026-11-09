import { COMPLETE_STATUS_TYPES } from './task-status-pill.constants';
import { StatusDefinition } from '@/types/api.types';

export const orderedStatuses = (statuses: StatusDefinition[]): StatusDefinition[] => [...statuses].sort((a, b) => a.order - b.order);

export const nextStatus = (statuses: StatusDefinition[], current: string): StatusDefinition | null => {
  const ordered = orderedStatuses(statuses);
  const index = ordered.findIndex((status) => status.name === current);
  return index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null;
};

export const completeStatus = (statuses: StatusDefinition[]): StatusDefinition | null => orderedStatuses(statuses).find((status) => COMPLETE_STATUS_TYPES.includes(status.type)) ?? null;

export const isCompleteStatus = (status: StatusDefinition | undefined): boolean => !!status && COMPLETE_STATUS_TYPES.includes(status.type);
