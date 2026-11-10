import { ReactNode } from 'react';
import { CustomFieldInput, ListInput, StatusInput, UserGroup, UserGroupInput } from '@/services/admin.types';
import { CustomFieldDefinition, FolderNode, ListNode, Member, SpaceNode } from '@/types/api.types';

export interface AdminPageFrameProps {
  title: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
}

export interface NameDialogProps {
  open: boolean;
  title: string;
  initial?: string;
  submitLabel: string;
  maxLength?: number;
  onSubmit: (name: string) => Promise<unknown>;
  onClose: () => void;
}

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<unknown>;
  onClose: () => void;
}

export interface ListDialogProps {
  open: boolean;
  space: SpaceNode | null;
  list: ListNode | null;
  defaultKind: ListInput['kind'];
  defaultFolderId: string | null;
  onSubmit: (input: ListInput) => Promise<unknown>;
  onClose: () => void;
}

export interface SpacePickerProps {
  spaces: SpaceNode[];
  value: string;
  onChange: (spaceId: string) => void;
}

export interface ValueChipsProps {
  label: string;
  hint: string;
  values: string[];
  onChange: (values: string[]) => void;
  inputId: string;
}

export interface StatusRowProps {
  status: StatusInput;
  position: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onChange: (status: StatusInput) => void;
  onMove: (step: number) => void;
  onRemove: () => void;
}

export interface CustomFieldDialogProps {
  open: boolean;
  onSubmit: (input: CustomFieldInput) => Promise<unknown>;
  onClose: () => void;
}

export interface CustomFieldListsPickerProps {
  field: CustomFieldDefinition;
  space: SpaceNode;
}

export type CustomFieldProblem = 'nameRequired' | 'optionsRequired' | null;

export interface GroupDialogProps {
  open: boolean;
  group: UserGroup | null;
  members: Member[];
  onSubmit: (input: UserGroupInput) => Promise<unknown>;
  onClose: () => void;
}

export type StructureTarget = { kind: 'space'; space: SpaceNode } | { kind: 'folder'; space: SpaceNode; folder: FolderNode } | { kind: 'list'; space: SpaceNode; list: ListNode };

export type ListDraft = {
  space: SpaceNode;
  list: ListNode | null;
  kind: ListInput['kind'];
  folderId: string | null;
};

export interface StructureActions {
  newFolder: (space: SpaceNode) => void;
  newList: (space: SpaceNode, kind: ListInput['kind'], folderId?: string | null) => void;
  rename: (target: StructureTarget) => void;
  editList: (space: SpaceNode, list: ListNode) => void;
  remove: (target: StructureTarget) => void;
}

export interface SpaceCardProps {
  space: SpaceNode;
  actions: StructureActions;
}

export interface ListRowProps {
  space: SpaceNode;
  list: ListNode;
  actions: StructureActions;
}

export type ListDialogProblem = 'nameRequired' | 'datesRequired' | 'datesOrder' | null;

export interface AdminShellProps {
  children: ReactNode;
}

export interface NameRequest {
  title: string;
  initial: string;
  submitLabel: string;
  submit: (name: string) => Promise<unknown>;
}

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  confirm: () => Promise<unknown>;
}

export type StatusDraftProblem = 'nameMissing' | 'nameRepeated' | null;

export interface StatusesEditorProps {
  space: SpaceNode;
}

export interface RulesEditorProps {
  space: SpaceNode;
}

export interface CopyButtonProps {
  value: string;
  label: string;
  copiedLabel: string;
  ariaLabel?: string;
}
