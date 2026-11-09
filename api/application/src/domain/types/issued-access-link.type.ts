import { AuthTokenKind } from '@domain/enums/auth-token.enums';

export interface IssuedAccessLink {
  token: string;
  kind: AuthTokenKind;
  expiresAt: Date;
}
