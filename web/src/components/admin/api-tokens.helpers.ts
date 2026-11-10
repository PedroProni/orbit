import { API_TOKEN_SCOPES } from './api-tokens.constants';
import { ApiTokenProblem } from './api-tokens.types';

export const grantableScopes = (held: string[]): string[] => API_TOKEN_SCOPES.filter((scope) => held.includes(scope));

export const apiTokenProblem = (name: string, scopes: string[]): ApiTokenProblem | null => {
  if (!name.trim()) return 'name';
  if (scopes.length === 0) return 'scopes';
  return null;
};
