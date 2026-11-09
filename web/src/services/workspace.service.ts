import { api, toQuery } from '@/lib/api-client';
import { Task } from '@/types/api.types';
import { ChatChannel, ChatMessage, Dashboard, DashboardData, DashboardWidgetType, Doc, DocSummary, Goal, GoalDraft, InboxData, Recurrence, TaskDependencies, TaskPlan, TaskTemplate, TimeSummary } from '@/types/workspace.types';

const json = (body: unknown): RequestInit => ({ body: JSON.stringify(body) });

export const workspaceService = {
  inbox: () => api<InboxData>('/inbox'),
  docs: () => api<DocSummary[]>('/docs'),
  doc: (id: string) => api<Doc>(`/docs/${id}`),
  createDoc: (body: { title: string; bodyMd: string; parentId?: string }) => api<Doc>('/docs', { method: 'POST', ...json(body) }),
  saveDoc: (id: string, body: { title: string; bodyMd: string }) => api<Doc>(`/docs/${id}`, { method: 'PATCH', ...json(body) }),
  archiveDoc: (id: string) => api<void>(`/docs/${id}`, { method: 'DELETE' }),
  goals: () => api<Goal[]>('/goals'),
  createGoal: (body: GoalDraft) => api<Goal>('/goals', { method: 'POST', ...json(body) }),
  deleteGoal: (id: string) => api<void>(`/goals/${id}`, { method: 'DELETE' }),
  dashboards: () => api<Dashboard[]>('/dashboards'),
  dashboardData: (id: string) => api<DashboardData>(`/dashboards/${id}/data`),
  createDashboard: (body: { name: string; widgets: Array<{ type: DashboardWidgetType; title: string }> }) => api<Dashboard>('/dashboards', { method: 'POST', ...json(body) }),
  updateDashboard: (id: string, body: { name: string; widgets: Array<{ type: DashboardWidgetType; title: string }> }) => api<Dashboard>(`/dashboards/${id}`, { method: 'PATCH', ...json(body) }),
  deleteDashboard: (id: string) => api<void>(`/dashboards/${id}`, { method: 'DELETE' }),
  channels: () => api<ChatChannel[]>('/chat/channels'),
  createChannel: (name: string) => api<ChatChannel>('/chat/channels', { method: 'POST', ...json({ name, kind: 'public' }) }),
  messages: (id: string) => api<ChatMessage[]>(`/chat/channels/${id}/messages${toQuery({})}`),
  postMessage: (id: string, bodyMd: string) => api<ChatMessage>(`/chat/channels/${id}/messages`, { method: 'POST', ...json({ bodyMd }) }),
  plan: (taskId: string) => api<TaskPlan>(`/tasks/${taskId}/plan`),
  changePlan: (taskId: string, body: { estimateMinutes?: number | null; taskKind?: string }) => api<TaskPlan>(`/tasks/${taskId}/plan`, { method: 'PATCH', ...json(body) }),
  time: (taskId: string) => api<TimeSummary>(`/tasks/${taskId}/time`),
  startTimer: (taskId: string) => api<unknown>(`/tasks/${taskId}/time/start`, { method: 'POST' }),
  stopTimer: (taskId: string) => api<unknown>(`/tasks/${taskId}/time/stop`, { method: 'POST' }),
  addTime: (taskId: string, minutes: number) => api<unknown>(`/tasks/${taskId}/time`, { method: 'POST', ...json({ minutes }) }),
  templates: (spaceId: string) => api<TaskTemplate[]>(`/task-templates${toQuery({ spaceId })}`),
  instantiateTemplate: (id: string, body: { listId: string; title?: string }) => api<Task>(`/task-templates/${id}/instantiate`, { method: 'POST', ...json(body) }),
  dependencies: (taskId: string) => api<TaskDependencies>(`/tasks/${taskId}/dependencies`),
  addDependency: (taskId: string, dependsOnId: string) => api<TaskDependencies>(`/tasks/${taskId}/dependencies`, { method: 'POST', ...json({ dependsOnId }) }),
  removeDependency: (taskId: string, dependsOnId: string) => api<void>(`/tasks/${taskId}/dependencies/${dependsOnId}`, { method: 'DELETE' }),
  recurrence: async (taskId: string) => (await api<Recurrence | null>(`/tasks/${taskId}/recurrence`)) ?? null,
  setRecurrence: (taskId: string, body: { frequency: string; interval: number }) => api<Recurrence>(`/tasks/${taskId}/recurrence`, { method: 'PUT', ...json(body) }),
  removeRecurrence: (taskId: string) => api<void>(`/tasks/${taskId}/recurrence`, { method: 'DELETE' }),
};
