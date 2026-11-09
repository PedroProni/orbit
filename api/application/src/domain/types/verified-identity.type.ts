export interface VerifiedIdentity {
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
}
