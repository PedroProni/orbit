import { AllowedRoute } from './allowed-route.type';

export const VIEWER_ALLOWED_WRITE_ROUTES: AllowedRoute[] = [
  { method: 'POST', path: '/auth/access', reason: 'sign in' },
  { method: 'POST', path: '/auth/dev-login', reason: 'sign in outside production' },
  { method: 'POST', path: '/auth/login', reason: 'sign in' },
  { method: 'POST', path: '/auth/logout', reason: 'own session' },
  { method: 'POST', path: '/auth/password/change', reason: 'own password' },
  { method: 'POST', path: '/auth/password/forgot', reason: 'own password' },
  { method: 'POST', path: '/auth/password/link', reason: 'own password' },
  { method: 'POST', path: '/auth/password/set', reason: 'own password' },
  { method: 'DELETE', path: '/auth/sessions/:id', reason: 'own session' },
  { method: 'POST', path: '/auth/sessions/revoke-others', reason: 'own sessions' },
  { method: 'POST', path: '/notifications/read', reason: 'own notifications' },
  { method: 'POST', path: '/public/forms/:key', reason: 'public form, no account' },
  { method: 'POST', path: '/webhooks/github', reason: 'signed GitHub webhook, no account' },
];
