import { DomainError } from '@domain/errors/domain.error';

export class GithubError extends DomainError {
  constructor(code: string, route: string, status: number, upstreamStatus: number | null = null) {
    super(code, upstreamStatus === null ? `GitHub ${route}: ${code}` : `GitHub ${route}: ${code} (${upstreamStatus})`, status);
    this.name = 'GithubError';
  }
}
