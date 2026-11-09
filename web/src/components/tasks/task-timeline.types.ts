import { CustomFieldDefinition, Member, StatusDefinition, Task, TaskActivityEntry, TaskComment, TaskLinkKey } from '@/types/api.types';

export type TimelineItem = { kind: 'comment'; id: string; createdAt: string; comment: TaskComment } | { kind: 'activity'; id: string; createdAt: string; entry: TaskActivityEntry };

export interface TaskTimelineProps {
  task: Task;
  statuses: StatusDefinition[];
  readOnly: boolean;
}

export interface ActivityLineProps {
  entry: TaskActivityEntry;
  statuses: StatusDefinition[];
  members: Member[];
  definitions: CustomFieldDefinition[] | undefined;
}

export interface StatusNameProps {
  name: unknown;
  statuses: StatusDefinition[];
}

export interface TaskCommentComposerProps {
  taskId: string;
}

export interface ActorLabels {
  github: string;
  someone: string;
}

export type PullRequestChange = { kind: 'linked' | 'unlinked'; pr: string } | null;

export interface LinkChange {
  key: TaskLinkKey;
  before: string;
  after: string;
}
