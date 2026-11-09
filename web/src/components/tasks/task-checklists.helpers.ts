import { Checklist, ChecklistItem } from '@/types/api.types';

export const newChecklistId = (): string => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const addChecklist = (lists: Checklist[], name: string): Checklist[] => [...lists, { id: newChecklistId(), name, items: [] }];

export const renameChecklist = (lists: Checklist[], id: string, name: string): Checklist[] => lists.map((list) => (list.id === id ? { ...list, name } : list));

export const removeChecklist = (lists: Checklist[], id: string): Checklist[] => lists.filter((list) => list.id !== id);

export const addItem = (lists: Checklist[], id: string, name: string): Checklist[] => lists.map((list) => (list.id === id ? { ...list, items: [...list.items, { id: newChecklistId(), name, resolved: false, assigneeId: null }] } : list));

export const changeItem = (lists: Checklist[], listId: string, itemId: string, change: Partial<ChecklistItem>): Checklist[] => lists.map((list) => (list.id === listId ? { ...list, items: list.items.map((item) => (item.id === itemId ? { ...item, ...change } : item)) } : list));

export const removeItem = (lists: Checklist[], listId: string, itemId: string): Checklist[] => lists.map((list) => (list.id === listId ? { ...list, items: list.items.filter((item) => item.id !== itemId) } : list));
