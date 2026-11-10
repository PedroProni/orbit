import { DomainError } from '@domain/errors/domain.error';

export class AutomationError extends DomainError {
  constructor(code: string, message: string, status: number = 400) {
    super(code, message, status);
    this.name = 'AutomationError';
  }
}
