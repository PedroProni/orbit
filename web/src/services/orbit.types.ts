import { AttachmentGallery, Checklist, Member, SavedView, TaskCustomFieldValue, TaskKind, TaskLinks, TaskPriority } from '@/types/api.types';

export interface LoginResponse {
  accessToken: string;
  user: Member;
}

export interface TaskPatch {
  title?: string;
  descriptionMd?: string;
  status?: string;
  priority?: string | null;
  addTags?: string[];
  removeTags?: string[];
  addAssigneeIds?: string[];
  removeAssigneeIds?: string[];
  watcherIds?: string[];
  points?: number | null;
  startDate?: string | null;
  dueDate?: string | null;
  customFields?: TaskCustomFieldValue[];
  checklists?: Checklist[];
  archived?: boolean;
  links?: Partial<TaskLinks>;
}

export interface CreateTaskInput {
  title: string;
  status?: string;
  priority?: TaskPriority;
  tags?: string[];
  assigneeIds?: string[];
  points?: number;
  startDate?: string;
  dueDate?: string;
  parentId?: string;
  descriptionMd?: string;
  watcherIds?: string[];
  taskKind?: TaskKind;
  customFields?: TaskCustomFieldValue[];
}

export interface UpdateTaskVariables {
  id: string;
  patch: TaskPatch;
}

export interface CreateTaskOptions {
  inlineError?: boolean;
}

export interface AddCommentVariables {
  bodyMd: string;
  mentionIds: string[];
}

export interface EditCommentVariables extends AddCommentVariables {
  id: string;
}

export interface UpdateViewVariables {
  id: string;
  view: Omit<SavedView, 'id' | 'ownerId'>;
}

export interface UploadFileMeta {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  commentId?: string;
  gallery?: AttachmentGallery;
}
