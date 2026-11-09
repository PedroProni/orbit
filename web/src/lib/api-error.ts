import { PREFIX_ERROR_PREFIX, TAG_ERROR_PREFIX } from '@/components/tasks/tasks.constants';
import { API_ERROR_BY_STATUS, API_ERROR_FALLBACK, API_ERROR_KEYS } from './api-error.constants';
import { DescribedApiError } from './api-error.types';

const detailOf = (message: string): string => message.slice(message.indexOf(':') + 1).trim();

export function describeApiError(error: unknown): DescribedApiError {
  const { message = '', status } = (error ?? {}) as { message?: string; status?: number };
  if (message.startsWith(PREFIX_ERROR_PREFIX)) return { key: 'prefix', values: { prefixes: detailOf(message) } };
  if (message.startsWith(TAG_ERROR_PREFIX)) return { key: 'tag', values: { tags: detailOf(message) } };
  return { key: API_ERROR_KEYS[message] ?? API_ERROR_BY_STATUS[status ?? 0] ?? API_ERROR_FALLBACK };
}
