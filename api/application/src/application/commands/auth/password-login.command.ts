import { SessionContext } from '@domain/types/session-context.type';

export interface PasswordLoginCommand {
  email: string;
  password: string;
  context: SessionContext;
}
