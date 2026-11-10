'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { ChangePasswordInput, ChangeUserRoleInput, InviteUserInput } from '@/services/auth.types';
import { useToastStore } from '@/stores/toast.store';
import { SESSIONS_KEY, USER_ACCESS_KEY } from './use-account.constants';

export const useAccountSessions = () => useQuery({ queryKey: SESSIONS_KEY, queryFn: authService.sessions });

export const useRevokeSession = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: authService.revokeSession,
    onSuccess: () => client.invalidateQueries({ queryKey: SESSIONS_KEY }),
    onError: () => useToastStore.getState().push('error', 'sessionRevokeFailed'),
  });
};

export const useRevokeOtherSessions = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: authService.revokeOtherSessions,
    onSuccess: () => {
      useToastStore.getState().push('success', 'sessionsEnded');
      return client.invalidateQueries({ queryKey: SESSIONS_KEY });
    },
    onError: () => useToastStore.getState().push('error', 'sessionRevokeFailed'),
  });
};

export const useChangePassword = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: ChangePasswordInput) => authService.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      useToastStore.getState().push('success', 'passwordChanged');
      return client.invalidateQueries({ queryKey: SESSIONS_KEY });
    },
  });
};

export const useUserAccess = (enabled: boolean) => useQuery({ queryKey: USER_ACCESS_KEY, queryFn: authService.userAccess, enabled });

export const useInviteUser = () => {
  const client = useQueryClient();
  return useMutation({ mutationFn: (input: InviteUserInput) => authService.inviteUser(input), onSuccess: () => client.invalidateQueries({ queryKey: USER_ACCESS_KEY }), gcTime: 0 });
};

export const useGenerateAccessLink = () => useMutation({ mutationFn: authService.generateAccessLink, gcTime: 0 });

export const useRevokeUserSessions = () =>
  useMutation({
    mutationFn: authService.revokeUserSessions,
    onSuccess: () => useToastStore.getState().push('success', 'sessionsEnded'),
    onError: () => useToastStore.getState().push('error', 'sessionRevokeFailed'),
  });

export const useChangeUserRole = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ChangeUserRoleInput) => authService.changeUserRole(input.userId, input.role),
    onSuccess: () => {
      useToastStore.getState().push('success', 'roleChanged');
      return client.invalidateQueries({ queryKey: USER_ACCESS_KEY });
    },
    onError: () => useToastStore.getState().push('error', 'roleChangeFailed'),
  });
};
