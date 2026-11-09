export class DomainError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly context?: Record<string, unknown>;

  constructor(code: string, message: string, status: number = 400, context?: Record<string, unknown>) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.status = status;
    this.context = context;
  }
}
