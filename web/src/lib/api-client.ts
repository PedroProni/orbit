import { API_BASE, CSRF_HEADER, PUBLIC_PATHS } from '@/config/app.constants';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string | null = null,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  headers.set(CSRF_HEADER, '1');
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'same-origin' });
  if (response.status === 401 && typeof window !== 'undefined' && !PUBLIC_PATHS.some((prefix) => window.location.pathname.startsWith(prefix))) window.location.assign('/login');
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, Array.isArray(body.message) ? body.message.join(', ') : (body.message ?? response.statusText), typeof body.code === 'string' ? body.code : null);
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const toQuery = (params: Record<string, unknown>): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) continue;
    search.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
};
