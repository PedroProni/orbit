import { Member } from '@/types/api.types';
import { MENTION_MAX_QUERY, MENTION_MAX_SUGGESTIONS, MENTION_WORD_CHAR } from './mentions.constants';
import { MentionQuery } from './mentions.types';

export function activeMentionQuery(text: string, caret: number): MentionQuery | null {
  const before = text.slice(0, caret);
  const start = before.lastIndexOf('@');
  if (start < 0) return null;
  if (start > 0 && MENTION_WORD_CHAR.test(before[start - 1])) return null;
  const query = before.slice(start + 1);
  if (query.length > MENTION_MAX_QUERY || query.includes('\n')) return null;
  return { start, query };
}

export const suggestMembers = (members: Member[], query: string): Member[] => {
  const needle = query.toLowerCase();
  return members.filter((m) => m.status === 'active' && (m.name.toLowerCase().includes(needle) || m.email.toLowerCase().startsWith(needle))).slice(0, MENTION_MAX_SUGGESTIONS);
};

export function insertMention(text: string, mention: MentionQuery, caret: number, name: string): { text: string; caret: number } {
  const inserted = `@${name} `;
  return { text: `${text.slice(0, mention.start)}${inserted}${text.slice(caret)}`, caret: mention.start + inserted.length };
}

export function collectMentionIds(text: string, members: Member[]): string[] {
  let rest = text.toLowerCase();
  const ids: string[] = [];
  const longestFirst = [...members].sort((a, b) => b.name.length - a.name.length);
  for (const member of longestFirst) {
    const token = `@${member.name.toLowerCase()}`;
    let from = rest.indexOf(token);
    while (from >= 0) {
      const end = from + token.length;
      const startsClean = from === 0 || !MENTION_WORD_CHAR.test(rest[from - 1]);
      const endsClean = end === rest.length || !MENTION_WORD_CHAR.test(rest[end]);
      if (startsClean && endsClean) {
        if (!ids.includes(member.id)) ids.push(member.id);
        rest = `${rest.slice(0, from)}${' '.repeat(token.length)}${rest.slice(end)}`;
      }
      from = rest.indexOf(token, from + 1);
    }
  }
  return ids;
}
