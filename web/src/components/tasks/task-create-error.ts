import { CREATE_ERROR_FORBIDDEN_STATUS, PREFIX_ERROR_PREFIX, STATUS_ERROR_PREFIX, TAG_ERROR_PREFIX } from './tasks.constants';
import { TaskCreateError } from './task-create-error.types';

const detailOf = (message: string): string => message.slice(message.indexOf(':') + 1).trim();

export function describeCreateError(error: Error & { status?: number }): TaskCreateError {
  if (error.status === CREATE_ERROR_FORBIDDEN_STATUS) return { key: 'createForbidden' };
  if (error.message.startsWith(PREFIX_ERROR_PREFIX)) return { key: 'prefixError', values: { prefixes: detailOf(error.message) } };
  if (error.message.startsWith(TAG_ERROR_PREFIX)) return { key: 'tagError', values: { tags: detailOf(error.message) } };
  if (error.message.startsWith(STATUS_ERROR_PREFIX)) return { key: 'statusError' };
  return { key: 'createFailed' };
}
