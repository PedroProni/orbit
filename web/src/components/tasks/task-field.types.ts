import { PickerPerson } from './people-picker.types';
import { Checklist, CustomFieldDefinition, Task, TaskCustomFieldValue } from '@/types/api.types';
import { TaskPatch } from '@/services/orbit.types';

export type SaveTaskPatch = (patch: TaskPatch) => void;

export interface TaskPeopleFieldProps {
  label: string;
  emptyLabel: string;
  people: PickerPerson[];
  selected: string[];
  onToggle: (id: string) => void;
}

export interface TaskTagsFieldProps {
  tags: string[];
  suggestions: string[];
  readOnly: boolean;
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
}

export interface TaskPointsFieldProps {
  value: number | null;
  readOnly: boolean;
  onSave: (points: number | null) => void;
}

export interface TaskCustomFieldsProps {
  task: Task;
  save: SaveTaskPatch;
}

export interface CustomFieldInputProps {
  definition: CustomFieldDefinition;
  value: TaskCustomFieldValue['value'];
  onSave: (value: string | null) => void;
}

export interface TaskChecklistsProps {
  task: Task;
  readOnly: boolean;
  save: SaveTaskPatch;
  adding: boolean;
  onAddingChange: (adding: boolean) => void;
}

export interface TaskSubtasksProps {
  parentId: string;
  listId: string;
  canAdd: boolean;
  composing: boolean;
  onComposingChange: (composing: boolean) => void;
}

export interface TaskWatchersBellProps {
  people: PickerPerson[];
  selected: string[];
  onToggle: (id: string) => void;
}

export interface TaskActionLinksProps {
  canAddSubtask: boolean;
  onAddSubtask: () => void;
  onAddDependency: () => void;
  onAddChecklist: () => void;
  onAttach: (files: File[]) => void;
}

export interface ChecklistEditorProps extends Pick<TaskChecklistsProps, 'task' | 'save'> {
  list: Checklist;
}
