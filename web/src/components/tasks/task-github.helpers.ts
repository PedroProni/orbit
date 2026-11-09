import { describeApiError } from '@/lib/api-error';
import { DescribedApiError } from '@/lib/api-error.types';
import { GITHUB_LINK_URL_PATTERN, GITHUB_UNAVAILABLE_ERROR_KEY, GITHUB_UNAVAILABLE_STATUS } from './task-github.constants';

export const describeRefreshError = (error: unknown): DescribedApiError => {
  const described = describeApiError(error);
  const { status } = (error ?? {}) as { status?: number };
  return status === GITHUB_UNAVAILABLE_STATUS ? { key: GITHUB_UNAVAILABLE_ERROR_KEY } : described;
};

export const safeGithubUrl = (url: string): string | undefined => (GITHUB_LINK_URL_PATTERN.test(url) ? url : undefined);

export const notAfter = (value: string, now: Date): Date => new Date(Math.min(new Date(value).getTime(), now.getTime()));

export const repositoryName = (repository: string): string => repository.slice(repository.indexOf('/') + 1);
