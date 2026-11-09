import { SpaceNode, TaskCustomFieldValue, TaskKind, TaskPriority } from '@/types/api.types';
import { ComposerPicker } from './composer-field.types';

export type ComposerVariant = 'card' | 'row';

export interface ComposerPresets {
  status?: string;
  assigneeIds: string[];
  priority: TaskPriority | null;
  tags: string[];
}

export interface ComposerDraft {
  title: string;
  listId: string | null;
  assigneeIds: string[];
  priority: TaskPriority | null;
  tags: string[];
  startDate: string;
  dueDate: string;
  points: number | null;
  taskKind: TaskKind | null;
  customFields: TaskCustomFieldValue[];
}

export interface ComposerRefusal {
  key: string;
  values?: Record<string, string>;
  draft: ComposerDraft;
}

export interface ComposerState {
  anchor: string | null;
  presets: ComposerPresets;
  draft: ComposerDraft;
  refusal: ComposerRefusal | null;
  open: (anchor: string, presets: ComposerPresets) => void;
  close: () => void;
  setDraft: (draft: Partial<ComposerDraft>) => void;
  refuse: (refusal: ComposerRefusal) => void;
  clearRefusal: () => void;
}

export interface TaskComposerProps {
  listId: string;
  space: SpaceNode;
  label: string;
  variant?: ComposerVariant;
  initialPicker?: ComposerPicker | null;
}

export interface ComposerRule {
  key: string;
  values: Record<string, string>;
}

export interface ComposerOrigin {
  draft: ComposerDraft;
  anchor: string;
  presets: ComposerPresets;
  listName: string;
}

export interface ComposerTarget {
  listId: string;
  listName: string;
  space: SpaceNode;
}
