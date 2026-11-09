import { TASK_LINK_PARAM } from './tasks.constants';

export const taskLinkPath = (taskId: string): string => `/t/${taskId}`;

export const taskListPath = (listId: string, taskId: string): string => `/lists/${listId}?${TASK_LINK_PARAM}=${taskId}`;
