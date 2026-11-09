// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { buildDocTree, wrapSelection } from '@/components/workspace/docs.helpers';
import { formatActivityValue } from '@/components/tasks/task-helpers';
import { colorOf, initialsOf } from '@/components/common/avatar.helpers';
import { AVATAR_COLORS } from '@/components/common/avatar.constants';
import { DocSummary } from '@/types/workspace.types';

const doc = (id: string, parentId: string | null): DocSummary => ({ id, title: id, spaceId: null, parentId, updatedAt: '2026-01-01T00:00:00Z' });

describe('buildDocTree', () => {
  it('nests children and keeps roots in order', () => {
    const tree = buildDocTree([doc('a', null), doc('b', 'a'), doc('c', 'b'), doc('d', null)]);
    expect(tree.map((n) => n.id)).toEqual(['a', 'd']);
    expect(tree[0].children[0].children[0].id).toBe('c');
  });

  it('treats docs with a missing parent as roots', () => {
    expect(buildDocTree([doc('x', 'ghost')]).map((n) => n.id)).toEqual(['x']);
  });
});

describe('wrapSelection', () => {
  it('wraps the selected range and puts the cursor after the selection', () => {
    expect(wrapSelection('hello world', 0, 5, '**', '**')).toEqual({ value: '**hello** world', cursor: 7 });
  });

  it('inserts only the markers for an empty selection', () => {
    expect(wrapSelection('ab', 1, 1, '[', '](https://)')).toEqual({ value: 'a[](https://)b', cursor: 2 });
  });
});

describe('formatActivityValue', () => {
  it('resolves ids with the given resolver', () => {
    expect(formatActivityValue(['u1', 'u2'], (id) => id.toUpperCase())).toBe('U1, U2');
  });

  it('formats empty values as a dash', () => {
    expect([null, undefined, '', []].map((v) => formatActivityValue(v))).toEqual(['-', '-', '-', '-']);
  });

  it('joins arrays, trims ISO dates and stringifies the rest', () => {
    expect(formatActivityValue(['a', 'b'])).toBe('a, b');
    expect(formatActivityValue('2026-11-04T10:00:00Z')).toBe('2026-11-04');
    expect(formatActivityValue(5)).toBe('5');
  });
});

describe('avatar helpers', () => {
  it('builds up to two uppercase initials', () => {
    expect(initialsOf('ana souza lima')).toBe('AS');
    expect(initialsOf('  bruno ')).toBe('B');
    expect(initialsOf('')).toBe('');
  });

  it('returns a stable palette color per key', () => {
    expect(colorOf('u1')).toBe(colorOf('u1'));
    expect(AVATAR_COLORS).toContain(colorOf('anything'));
  });
});
