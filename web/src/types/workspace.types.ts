import { Task, TaskKind, TaskPriority } from '@/types/api.types';

export interface InboxData {
  unreadNotifications: number;
  overdue: Task[];
  dueSoon: Task[];
  assignedOpen: number;
}

export interface DocSummary {
  id: string;
  title: string;
  spaceId: string | null;
  parentId: string | null;
  updatedAt: string;
}

export interface Doc extends DocSummary {
  bodyMd: string;
}

export interface GoalTarget {
  id: string;
  name: string;
  kind: 'number' | 'task' | 'boolean';
  targetValue: number;
  currentValue: number;
  taskId: string | null;
  progress: number;
}

export interface Goal {
  id: string;
  name: string;
  description: string;
  progress: number;
  dueDate: string | null;
  targets: GoalTarget[];
}

export interface GoalDraft {
  name: string;
  description: string;
  targets: Array<Pick<GoalTarget, 'name' | 'kind' | 'targetValue' | 'currentValue'>>;
}

export type DashboardWidgetType = 'tasks_by_status' | 'tasks_by_assignee' | 'overdue' | 'time_tracked';

export interface DashboardWidget {
  id: string;
  type: DashboardWidgetType;
  title: string;
  listId: string | null;
}

export interface Dashboard {
  id: string;
  name: string;
  shared: boolean;
  widgets: DashboardWidget[];
}

export interface DashboardData {
  id: string;
  name: string;
  widgets: Array<DashboardWidget & { result: Record<string, number> }>;
}

export interface ChatChannel {
  id: string;
  name: string;
  kind: 'public' | 'private';
}

export interface ChatMessage {
  id: string;
  authorId: string;
  bodyMd: string;
  createdAt: string;
}

export interface TaskPlan {
  taskId: string;
  taskKind: TaskKind;
  estimateMinutes: number | null;
  trackedMinutes: number;
  remainingMinutes: number | null;
}

export interface TimeEntry {
  id: string;
  userId: string;
  minutes: number;
  running: boolean;
}

export interface TimeSummary {
  totalMinutes: number;
  entries: TimeEntry[];
}

export interface TaskDependencies {
  blockedBy: string[];
  blocking: string[];
}

export interface Recurrence {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  nextRunAt: string;
  active: boolean;
}

export interface TaskTemplate {
  id: string;
  spaceId: string;
  name: string;
  titleTemplate: string;
  descriptionMd: string;
  tags: string[];
  priority: TaskPriority | null;
  taskKind: TaskKind;
  estimateMinutes: number | null;
}

export interface InstantiateTemplateArgs {
  id: string;
  listId: string;
  title?: string;
}
