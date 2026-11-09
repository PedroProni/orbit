import { describe, expect, it, vi } from 'vitest';
import { filterPaletteItems, moveIndex } from '@/components/shell/command-palette.helpers';
import { PaletteItem } from '@/components/shell/command-palette.types';

const item = (key: string, label: string, hint?: string): PaletteItem => ({ key, group: 'lists', label, hint, run: vi.fn() });

describe('palette helpers', () => {
  const items = [item('a', 'Sprint 12', 'Engenharia'), item('b', 'Roadmap'), item('c', 'Revisão de código')];

  it('returns everything for an empty query', () => {
    expect(filterPaletteItems(items, '  ')).toHaveLength(3);
  });

  it('matches label and hint ignoring case and accents', () => {
    expect(filterPaletteItems(items, 'revisao').map((i) => i.key)).toEqual(['c']);
    expect(filterPaletteItems(items, 'ENGENHARIA').map((i) => i.key)).toEqual(['a']);
    expect(filterPaletteItems(items, 'zzz')).toEqual([]);
  });

  it('wraps the active index in both directions', () => {
    expect(moveIndex(2, 1, 3)).toBe(0);
    expect(moveIndex(0, -1, 3)).toBe(2);
    expect(moveIndex(0, 1, 0)).toBe(0);
  });
});
