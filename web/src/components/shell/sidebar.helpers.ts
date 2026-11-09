import { SPACE_COLORS } from './sidebar.constants';

export const spaceColor = (name: string): string => {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return SPACE_COLORS[hash % SPACE_COLORS.length];
};

export const spaceInitial = (name: string): string => name.trim().charAt(0).toUpperCase();
