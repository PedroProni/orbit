import { Bell, GitBranch, LayoutTemplate, ListTree, Paperclip, Shapes, UserCheck, UserPlus } from 'lucide-react';
import { CreateTaskExtra, SlashCommand } from './create-task.types';

export const SLASH_COMMANDS: SlashCommand[] = [
  { id: 'template', icon: LayoutTemplate },
  { id: 'attachment', icon: Paperclip },
  { id: 'assign', icon: UserPlus },
  { id: 'assignMe', icon: UserCheck },
  { id: 'follower', icon: Bell },
  { id: 'move', icon: GitBranch },
  { id: 'subtask', icon: ListTree },
  { id: 'taskKind', icon: Shapes },
];

export const CREATE_TASK_EXTRAS: CreateTaskExtra[] = ['dependencies', 'subtasks', 'checklist'];
export const CREATE_TASK_DESCRIPTION_MAX = 20000;
export const CREATE_TASK_SUBTASK_MAX = 50;
export const BLOCKER_SEARCH_MIN = 2;
