import { Member, TaskActivityEntry, TaskComment, TaskLinks } from '@/types/api.types';
import { ACTIVITY_FIELDS, ACTIVITY_HIDDEN_FIELDS, GITHUB_ACTOR_ID, PULL_REQUEST_ACTIVITY_FIELD, TASK_LINK_KEYS } from './tasks.constants';
import { ActorLabels, LinkChange, PullRequestChange, TimelineItem } from './task-timeline.types';

export const mergeTimeline = (comments: TaskComment[], activity: TaskActivityEntry[]): TimelineItem[] =>
  [...comments.map((comment): TimelineItem => ({ kind: 'comment', id: `c-${comment.id}`, createdAt: comment.createdAt, comment })), ...activity.map((entry): TimelineItem => ({ kind: 'activity', id: `a-${entry.id}`, createdAt: entry.createdAt, entry }))].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );

export const localDayKey = (iso: string): string => {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

export const formatTimelineDay = (iso: string, locale: string): string => new Date(iso).toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' });

export const formatTimelineTime = (iso: string, locale: string): string => new Date(iso).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });

export const formatCreatedDay = (iso: string, locale: string): string => new Date(iso).toLocaleDateString(locale, { month: 'short', day: 'numeric' });

const isKnownField = (field: string): boolean => (ACTIVITY_FIELDS as readonly string[]).includes(field) && !ACTIVITY_HIDDEN_FIELDS.includes(field);

export const visibleActivityFields = (entry: TaskActivityEntry): string[] => Object.keys(entry.diff ?? {}).filter(isKnownField);

const linkValue = (links: unknown, key: keyof TaskLinks): string => {
  const value = typeof links === 'object' && links !== null ? (links as Partial<TaskLinks>)[key] : null;
  return typeof value === 'string' && value ? value : '-';
};

export const linkChanges = (before: unknown, after: unknown): LinkChange[] => TASK_LINK_KEYS.map((key) => ({ key, before: linkValue(before, key), after: linkValue(after, key) })).filter((change) => change.before !== change.after);

export const actorName = (id: string, members: Member[], labels: ActorLabels): string => (id === GITHUB_ACTOR_ID ? labels.github : (members.find((member) => member.id === id)?.name ?? labels.someone));

export const pullRequestChange = (entry: TaskActivityEntry, fields: string[]): PullRequestChange => {
  if (fields.length !== 1 || fields[0] !== PULL_REQUEST_ACTIVITY_FIELD) return null;
  const { before, after } = entry.diff[PULL_REQUEST_ACTIVITY_FIELD];
  if (typeof after === 'string' && after) return { kind: 'linked', pr: after };
  if (typeof before === 'string' && before) return { kind: 'unlinked', pr: before };
  return null;
};
