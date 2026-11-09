import { api } from '@/lib/api-client';
import { AccessLinkInfo, AccountSession, ForgotPasswordResponse, InviteUserInput, InviteUserResponse, IssuedAccessLink, PasswordLoginResponse, UserAccess } from '@/services/auth.types';

const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

export const authService = {
  login: (email: string, password: string) => api<PasswordLoginResponse>('/auth/login', post({ email, password })),
  logout: () => api<void>('/auth/logout', { method: 'POST' }),
  forgotPassword: (email: string) => api<ForgotPasswordResponse>('/auth/password/forgot', post({ email })),
  checkLink: (token: string) => api<AccessLinkInfo>('/auth/password/link', post({ token })),
  setPassword: (token: string, password: string) => api<void>('/auth/password/set', post({ token, password })),
  changePassword: (currentPassword: string, newPassword: string) => api<{ revoked: number }>('/auth/password/change', post({ currentPassword, newPassword })),
  sessions: () => api<AccountSession[]>('/auth/sessions'),
  revokeSession: (id: string) => api<{ current: boolean }>(`/auth/sessions/${id}`, { method: 'DELETE' }),
  revokeOtherSessions: () => api<{ revoked: number }>('/auth/sessions/revoke-others', { method: 'POST' }),
  userAccess: () => api<UserAccess[]>('/users/access'),
  inviteUser: (input: InviteUserInput) => api<InviteUserResponse>('/users/invite', post(input)),
  generateAccessLink: (userId: string) => api<IssuedAccessLink>(`/users/${userId}/access-link`, { method: 'POST' }),
  revokeUserSessions: (userId: string) => api<{ revoked: number }>(`/users/${userId}/sessions`, { method: 'DELETE' }),
};
