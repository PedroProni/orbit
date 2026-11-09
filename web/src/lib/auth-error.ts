import { AUTH_ERROR_FALLBACK, AUTH_ERROR_KEYS } from './auth-error.constants';

export const describeAuthError = (error: unknown): string => AUTH_ERROR_KEYS[(error as { message?: string } | null)?.message ?? ''] ?? AUTH_ERROR_FALLBACK;
