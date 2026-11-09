import { PaletteItem } from './command-palette.types';
import { PALETTE_MAX_RESULTS } from './command-palette.constants';

const normalize = (value: string): string => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const filterPaletteItems = (items: PaletteItem[], query: string): PaletteItem[] => {
  const needle = normalize(query.trim());
  if (!needle) return items.slice(0, PALETTE_MAX_RESULTS);
  return items.filter((item) => normalize(item.label).includes(needle) || normalize(item.hint ?? '').includes(needle)).slice(0, PALETTE_MAX_RESULTS);
};

export const moveIndex = (current: number, delta: number, size: number): number => (size === 0 ? 0 : (current + delta + size) % size);
