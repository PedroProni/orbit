import { PREFIX_ERROR_PREFIX, TAG_ERROR_PREFIX } from '@/components/tasks/tasks.constants';
import { API_ERROR_BY_STATUS, API_ERROR_CODE_PATTERN, API_ERROR_CODES, API_ERROR_FALLBACK, API_ERROR_KEYS } from './api-error.constants';
import { DescribedApiError } from './api-error.types';

const detailOf = (message: string): string => message.slice(message.indexOf(':') + 1).trim();

const codeKeyOf = (code: string | null | undefined, message: string): string | undefined => {
  if (code && API_ERROR_CODES[code]) return API_ERROR_CODES[code];
  return (message.match(API_ERROR_CODE_PATTERN) ?? []).map((token) => API_ERROR_CODES[token]).find(Boolean);
};

export function describeApiError(error: unknown): DescribedApiError {
  const { message = '', status, code } = (error ?? {}) as { message?: string; status?: number; code?: string | null };
  const codeKey = codeKeyOf(code, message);
  if (codeKey) return { key: codeKey };
  if (message.startsWith(PREFIX_ERROR_PREFIX)) return { key: 'prefix', values: { prefixes: detailOf(message) } };
  if (message.startsWith(TAG_ERROR_PREFIX)) return { key: 'tag', values: { tags: detailOf(message) } };
  return { key: API_ERROR_KEYS[message] ?? API_ERROR_BY_STATUS[status ?? 0] ?? API_ERROR_FALLBACK };
}
