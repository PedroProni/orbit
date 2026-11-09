import { VerifiedIdentity } from '@domain/types/verified-identity.type';

export interface IdentityVerifier {
  verify(idToken: string): Promise<VerifiedIdentity>;
}
