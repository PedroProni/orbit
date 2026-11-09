import { BROWSER_PATTERNS, SYSTEM_PATTERNS } from './device.constants';

const firstMatch = (patterns: readonly (readonly [RegExp, string])[], agent: string): string | null => patterns.find(([pattern]) => pattern.test(agent))?.[1] ?? null;

export const describeDevice = (agent: string | null): string | null => {
  if (!agent) return null;
  const parts = [firstMatch(BROWSER_PATTERNS, agent), firstMatch(SYSTEM_PATTERNS, agent)].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
};
