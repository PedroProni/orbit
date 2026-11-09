import { ComponentType } from 'react';
import { ComposerPicker } from '../composer-field.types';
import { CreateTaskDefaults } from '@/stores/create-task.types';

export type CreateTaskTab = 'task' | 'doc';

export type CreateTaskMode = 'close' | 'open' | 'another';

export type CreateTaskExtra = 'subtasks' | 'checklist' | 'dependencies';

export type SlashCommandId = 'template' | 'attachment' | 'assign' | 'assignMe' | 'follower' | 'move' | 'subtask' | 'taskKind';

export interface SlashCommand {
  id: SlashCommandId;
  icon: ComponentType<{ size?: number; className?: string }>;
}

export interface SlashMatch {
  start: number;
  query: string;
}

export interface BlockerChoice {
  id: string;
  title: string;
}

export interface CreateTaskExtrasInput {
  listId: string;
  subtasks: string[];
  checklist: string[];
  checklistName: string;
  blockers: BlockerChoice[];
  files: File[];
}

export type CreateTaskExtraFailure = 'subtasks' | 'checklist' | 'dependencies' | 'attachments';

export type CreateTaskPicker = ComposerPicker | 'follower' | 'blockers' | 'more' | 'submit';

export interface CreateTaskFormProps {
  open: boolean;
  defaults: CreateTaskDefaults;
  onHide: () => void;
}

export interface SlashState {
  match: SlashMatch;
  active: number;
}

export interface SlashMenuProps {
  query: string;
  active: number;
  onPick: (id: SlashCommandId) => void;
  onHover: (index: number) => void;
}

export interface ExtraListEditorProps {
  label: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
  onRemoveSection: () => void;
  removeLabel: string;
}

export interface BlockerPickerProps {
  selected: BlockerChoice[];
  onToggle: (choice: BlockerChoice) => void;
}

export interface CreateDocFormProps {
  onDone: () => void;
}
