import { SelectOption } from './select.types';

export const matchOption = (options: SelectOption[], text: string): number => {
  const lower = text.toLowerCase();
  return options.findIndex((option) => option.label.toLowerCase().startsWith(lower));
};

export const clampIndex = (index: number, length: number): number => Math.max(0, Math.min(index, length - 1));
