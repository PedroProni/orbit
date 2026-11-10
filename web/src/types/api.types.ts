import { ViewDisplay } from '@/types/view-display.types';

export type StatusType = 'open' | 'active' | 'review' | 'done' | 'closed';
export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low';
export type TaskKind = 'task' | 'milestone' | 'bug' | 'feature' | 'chore';
export type UserRole = 'owner' | 'admin' | 'member' | 'viewer' | 'guest';

export interface StatusDefinition {
  name: string;
  color: string;
  type: StatusType;
  order: number;
}

export interface ListNode {
  id: string;
  spaceId: string;
  folderId: string | null;
  name: string;
  kind: 'list' | 'sprint';
  startDate?: string | null;
  endDate?: string | null;
}

export interface FolderNode {
  id: string;
  spaceId: string;
  name: string;
}

export interface SpaceNode {
  id: string;
  name: string;
  statuses: StatusDefinition[];
  requiredTags: string[];
  titlePrefixes: string[];
  folders: FolderNode[];
  lists: ListNode[];
}

export interface ChecklistItem {
  id: string;
  name: string;
  resolved: boolean;
  assigneeId: string | null;
}

export interface Checklist {
  id: string;
  name: string;
  items: ChecklistItem[];
}

export interface TaskCustomFieldValue {
  fieldId: string;
  value: string | number | null;
}

export type CustomFieldType = 'dropdown' | 'url' | 'date';

export interface CustomFieldOption {
  id: string;
  label: string;
  color: string;
}

export interface CustomFieldDefinition {
  id: string;
  spaceId: string;
  name: string;
  type: CustomFieldType;
  options: CustomFieldOption[];
  listIds: string[] | null;
}

export interface TaskLinks {
  figma: string | null;
  notion: string | null;
  printsFolder: string | null;
}

export type TaskLinkKey = keyof TaskLinks;

export type PullRequestState = 'open' | 'closed' | 'merged';

export type PullRequestSource = 'webhook' | 'manual' | 'sync';

export type GithubChecksState = 'success' | 'failure' | 'pending' | 'none';

export type GithubRefKind = 'branch' | 'commit';

export interface GithubRef {
  id: string;
  repository: string;
  kind: GithubRefKind;
  key: string;
  title: string;
  url: string;
  authorLogin: string | null;
  occurredAt: string | null;
}

export interface PullRequestLink {
  id: string;
  taskId: string;
  repository: string;
  number: number;
  url: string;
  title: string;
  state: PullRequestState | null;
  source: PullRequestSource;
  draft: boolean;
  authorLogin: string | null;
  authorAvatarUrl: string | null;
  headRef: string | null;
  checksState: GithubChecksState | null;
  githubUpdatedAt: string | null;
  syncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskGithub {
  pullRequests: PullRequestLink[];
  branches: GithubRef[];
  commits: GithubRef[];
  syncEnabled: boolean;
  syncedAt: string | null;
}

export interface Task {
  id: string;
  listId: string;
  spaceId: string;
  parentId: string | null;
  title: string;
  descriptionMd: string;
  status: string;
  priority: TaskPriority | null;
  tags: string[];
  assigneeIds: string[];
  watcherIds: string[];
  points: number | null;
  startDate: string | null;
  dueDate: string | null;
  checklists: Checklist[];
  customFields: TaskCustomFieldValue[];
  links: TaskLinks;
  attachmentCount?: number;
  coverAttachmentId?: string | null;
  creatorId: string;
  dateClosed: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskPage {
  data: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  bodyMd: string;
  dailyLogDate: string | null;
  editedAt: string | null;
  createdAt: string;
}

export interface Member {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  status: 'active' | 'disabled';
}

export interface Principal extends Member {
  workspaceId: string;
  scopes: string[];
}

export interface AppNotification {
  id: string;
  type: string;
  taskId: string | null;
  actorId: string;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPage {
  unread: number;
  data: AppNotification[];
}

export interface SearchResult {
  tasks: Task[];
  comments: TaskComment[];
}

export interface TaskFilters {
  statuses: string[];
  assigneeIds: string[];
  tags: string[];
  q: string;
  includeClosed: boolean;
  unassigned?: boolean;
}

export interface AssigneeCount {
  assigneeId: string;
  count: number;
}

export interface AssigneeCounts {
  total: number;
  unassigned: number;
  byAssignee: AssigneeCount[];
}

export interface SavedView {
  id: string;
  ownerId: string;
  name: string;
  viewType: 'list' | 'board' | 'table' | 'calendar' | 'timeline' | 'workload';
  listId: string | null;
  filters: TaskFilters;
  shared: boolean;
  display: ViewDisplay | null;
}

export interface TaskActivityEntry {
  id: string;
  action: string;
  actorId: string;
  diff: Record<string, { before: unknown; after: unknown }>;
  createdAt: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  commentId: string | null;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploaderId: string;
  confirmed: boolean;
  gallery: AttachmentGallery | null;
  createdAt: string;
}

export type AttachmentGallery = 'prints';

export interface AttachmentUploadRequest extends Attachment {
  uploadUrl: string;
}

export interface AttachmentDownload {
  url: string;
  expiresInSeconds: number;
}
