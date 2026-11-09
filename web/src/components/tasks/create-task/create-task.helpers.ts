import { Checklist } from '@/types/api.types';
import { newChecklistId } from '../task-checklists.helpers';
import { SLASH_COMMANDS } from './create-task.constants';
import { SlashCommand, SlashMatch } from './create-task.types';

export function slashMatch(title: string, caret: number): SlashMatch | null {
  const before = title.slice(0, caret);
  const found = /(^|\s)\/([\p{L}\d]*)$/u.exec(before);
  if (!found) return null;
  return { start: before.length - found[2].length - 1, query: found[2] };
}

export const withoutSlash = (title: string, match: SlashMatch): string => `${title.slice(0, match.start)}${title.slice(match.start + match.query.length + 1)}`.replace(/\s{2,}/g, ' ');

export const filterCommands = (query: string, label: (command: SlashCommand) => string): SlashCommand[] => {
  const needle = query.trim().toLowerCase();
  return needle ? SLASH_COMMANDS.filter((command) => label(command).toLowerCase().includes(needle) || command.id.toLowerCase().includes(needle)) : SLASH_COMMANDS;
};

export const cleanItems = (items: string[]): string[] => items.map((item) => item.trim()).filter(Boolean);

export const checklistFrom = (name: string, items: string[]): Checklist[] => (items.length ? [{ id: newChecklistId(), name, items: items.map((item) => ({ id: newChecklistId(), name: item, resolved: false, assigneeId: null })) }] : []);
