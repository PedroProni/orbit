import { CSRF_HEADER } from '@domain/constants/auth.constant';

export const CORS_ORIGIN_NOT_ALLOWED = 'CORS_ORIGIN_NOT_ALLOWED';
export const CORS_METHODS: readonly string[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
export const CORS_ALLOWED_HEADERS: readonly string[] = ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'x-api-key', 'user-token', CSRF_HEADER];
