import { describe, expect, it } from 'vitest';
import { activeMentionQuery, collectMentionIds, insertMention, suggestMembers } from '@/components/tasks/mentions.helpers';
import { MENTION_MAX_SUGGESTIONS } from '@/components/tasks/mentions.constants';
import { Member } from '@/types/api.types';

const member = (id: string, name: string, over: Partial<Member> = {}): Member => ({ id, name, email: `${id}@x.io`, avatarUrl: null, role: 'member', status: 'active', ...over });

describe('activeMentionQuery', () => {
  it('finds the mention under the caret', () => {
    expect(activeMentionQuery('oi @an', 6)).toEqual({ start: 3, query: 'an' });
    expect(activeMentionQuery('@', 1)).toEqual({ start: 0, query: '' });
  });

  it('ignores emails, text without an at sign and a finished line', () => {
    expect(activeMentionQuery('ana@x.io', 8)).toBeNull();
    expect(activeMentionQuery('sem mencao', 5)).toBeNull();
    expect(activeMentionQuery('@ana\noi', 7)).toBeNull();
    expect(activeMentionQuery(`@${'a'.repeat(41)}`, 42)).toBeNull();
  });
});

describe('suggestMembers', () => {
  it('matches name or email start, skips disabled people and caps the list', () => {
    const people = [member('ana', 'Ana Souza'), member('bia', 'Beatriz', { status: 'disabled' }), member('caio', 'Caio Ana')];
    expect(suggestMembers(people, 'ana').map((m) => m.id)).toEqual(['ana', 'caio']);
    expect(suggestMembers(people, 'bia')).toEqual([]);
    const many = Array.from({ length: 10 }, (_, i) => member(`m${i}`, `Pessoa ${i}`));
    expect(suggestMembers(many, '')).toHaveLength(MENTION_MAX_SUGGESTIONS);
  });
});

describe('insertMention', () => {
  it('replaces the typed query and moves the caret after the name', () => {
    expect(insertMention('oi @an tudo', { start: 3, query: 'an' }, 6, 'Ana Souza')).toEqual({ text: 'oi @Ana Souza  tudo', caret: 14 });
  });
});

describe('collectMentionIds', () => {
  const people = [member('ana', 'Ana'), member('ana2', 'Ana Souza'), member('bruno', 'Bruno')];

  it('collects each person once, ignoring case', () => {
    expect(collectMentionIds('@bruno e @BRUNO', people)).toEqual(['bruno']);
  });

  it('prefers the longest name and does not also mention the shorter one', () => {
    expect(collectMentionIds('fala @Ana Souza', people)).toEqual(['ana2']);
    expect(collectMentionIds('@Ana Souza e @Ana', people).sort()).toEqual(['ana', 'ana2']);
  });

  it('does not take partial words or emails', () => {
    expect(collectMentionIds('@Brunoo', people)).toEqual([]);
    expect(collectMentionIds('x@Bruno', people)).toEqual([]);
    expect(collectMentionIds('sem nada', people)).toEqual([]);
  });
});
