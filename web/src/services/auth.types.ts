import { Member } from '@/types/api.types';

export interface PasswordLoginResponse {
  user: Member;
}

export interface ForgotPasswordResponse {
  delivery: 'admin' | 'email';
}

export interface AccessLinkInfo {
  kind: 'invite' | 'reset';
  email: string;
  expiresAt: string;
}

export interface IssuedAccessLink {
  token: string;
  kind: 'invite' | 'reset';
  expiresAt: string;
}

export interface AccountSession {
  id: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
  current: boolean;
}

export interface UserAccess extends Member {
  hasPassword: boolean;
}

export interface InviteUserInput {
  email: string;
  name: string;
  role: string;
  allowExternalEmail: boolean;
}

export interface InviteUserResponse {
  user: Member;
  link: IssuedAccessLink;
}

export interface ChangeUserRoleInput {
  userId: string;
  role: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface RevokedCount {
  revoked: number;
}

export interface RevokedSession {
  current: boolean;
}
