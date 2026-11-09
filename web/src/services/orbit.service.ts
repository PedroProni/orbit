import { api, toQuery } from '@/lib/api-client';
import { AppNotification, AssigneeCounts, Attachment, AttachmentDownload, AttachmentUploadRequest, CustomFieldDefinition, SavedView, Member, NotificationPage, Principal, PullRequestLink, SearchResult, Task, TaskActivityEntry, TaskComment, TaskFilters, TaskPage } from '@/types/api.types';
import { CreateTaskInput, LoginResponse, TaskPatch, UploadFileMeta } from '@/services/orbit.types';
import { HierarchyResponse } from '@/services/hierarchy.types';
import { normalizeSpace } from '@/services/hierarchy.helpers';
import { TASK_PAGE_SIZE } from '@/config/app.constants';
import { countFilterParams, taskFilterParams } from '@/services/task-query.helpers';

export const orbitService = {
  loginAccess: () => api<LoginResponse>('/auth/access', { method: 'POST' }),
  devLogin: (email: string, name: string) => api<LoginResponse>('/auth/dev-login', { method: 'POST', body: JSON.stringify({ email, name }) }),
  me: () => api<Principal>('/auth/me'),
  hierarchy: async () => (await api<HierarchyResponse[]>('/hierarchy')).map(normalizeSpace),
  members: () => api<Member[]>('/users'),
  tasks: (listId: string, filters: TaskFilters) => api<TaskPage>(`/tasks${toQuery({ listId, ...taskFilterParams(filters), limit: TASK_PAGE_SIZE })}`),
  allTasks: (filters: TaskFilters, page: number) => api<TaskPage>(`/tasks${toQuery({ ...taskFilterParams(filters), topLevel: true, page, limit: TASK_PAGE_SIZE })}`),
  allTaskPages: async (filters: TaskFilters, pages: number): Promise<TaskPage> => {
    const loaded = await Promise.all(Array.from({ length: pages }, (_, index) => orbitService.allTasks(filters, index + 1)));
    const last = loaded[loaded.length - 1];
    const seen = new Set<string>();
    const data = loaded.flatMap((page) => page.data).filter((task) => !seen.has(task.id) && !!seen.add(task.id));
    return { ...last, data, page: pages };
  },
  assigneeCounts: (listId: string | null, filters: TaskFilters) => api<AssigneeCounts>(`/tasks/assignee-counts${toQuery({ listId, ...countFilterParams(filters) })}`),
  task: (id: string) => api<Task>(`/tasks/${id}`),
  taskActivity: (id: string) => api<TaskActivityEntry[]>(`/tasks/${id}/activity`),
  createTask: (listId: string, input: CreateTaskInput) => api<Task>(`/lists/${listId}/tasks`, { method: 'POST', body: JSON.stringify(input) }),
  updateTask: (id: string, patch: TaskPatch) => api<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  subtasks: (parentId: string) => api<TaskPage>(`/tasks${toQuery({ parentId, includeClosed: true, limit: TASK_PAGE_SIZE })}`),
  comments: (taskId: string) => api<TaskComment[]>(`/tasks/${taskId}/comments`),
  addComment: (taskId: string, bodyMd: string, mentionIds: string[]) => api<TaskComment>(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ bodyMd, mentionIds }) }),
  editComment: (id: string, bodyMd: string, mentionIds: string[]) => api<TaskComment>(`/comments/${id}`, { method: 'PATCH', body: JSON.stringify({ bodyMd, mentionIds }) }),
  deleteComment: (id: string) => api<void>(`/comments/${id}`, { method: 'DELETE' }),
  attachments: (taskId: string) => api<Attachment[]>(`/tasks/${taskId}/attachments`),
  requestUpload: (taskId: string, file: UploadFileMeta) => api<AttachmentUploadRequest>(`/tasks/${taskId}/attachments`, { method: 'POST', body: JSON.stringify(file) }),
  prints: (taskId: string) => api<Attachment[]>(`/tasks/${taskId}/prints`),
  pullRequests: (taskId: string) => api<PullRequestLink[]>(`/tasks/${taskId}/pull-requests`),
  linkPullRequest: (taskId: string, url: string) => api<PullRequestLink>(`/tasks/${taskId}/pull-requests`, { method: 'POST', body: JSON.stringify({ url }) }),
  unlinkPullRequest: (taskId: string, linkId: string) => api<void>(`/tasks/${taskId}/pull-requests/${linkId}`, { method: 'DELETE' }),
  confirmUpload: (id: string) => api<Attachment>(`/attachments/${id}/confirm`, { method: 'POST' }),
  attachmentDownload: (id: string) => api<AttachmentDownload>(`/attachments/${id}/download`),
  removeAttachment: (id: string) => api<void>(`/attachments/${id}`, { method: 'DELETE' }),
  search: (q: string) => api<SearchResult>(`/search${toQuery({ q })}`),
  notifications: () => api<NotificationPage>('/notifications'),
  savedViews: (listId: string) => api<SavedView[]>(`/saved-views${toQuery({ listId })}`),
  saveView: (view: Omit<SavedView, 'id' | 'ownerId'>) => api<SavedView>('/saved-views', { method: 'POST', body: JSON.stringify(view) }),
  updateView: (id: string, view: Omit<SavedView, 'id' | 'ownerId'>) => api<SavedView>(`/saved-views/${id}`, { method: 'PATCH', body: JSON.stringify(view) }),
  customFields: (spaceId: string) => api<CustomFieldDefinition[]>(`/spaces/${spaceId}/custom-fields`),
  deleteView: (id: string) => api<void>(`/saved-views/${id}`, { method: 'DELETE' }),
  markRead: (ids?: string[]) => api<void>('/notifications/read', { method: 'POST', body: JSON.stringify({ ids }) }),
};

export type { AppNotification };
