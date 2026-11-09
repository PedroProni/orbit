import { SessionContext } from '@domain/types/session-context.type';

export interface SessionIssuer {
  issue(userId: string, workspaceId: string, context?: SessionContext): Promise<string>;
}
