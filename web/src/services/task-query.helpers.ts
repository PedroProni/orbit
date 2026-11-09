import { TaskFilters } from '@/types/api.types';

export const taskFilterParams = (filters: TaskFilters) => ({ statuses: filters.statuses, assigneeIds: filters.assigneeIds, unassigned: filters.unassigned || undefined, tags: filters.tags, q: filters.q, includeClosed: filters.includeClosed });

export const countFilterParams = (filters: TaskFilters) => ({ statuses: filters.statuses, tags: filters.tags, q: filters.q, includeClosed: filters.includeClosed });
