'use client';

import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { CustomFieldInput, CustomFieldPatch, ListInput, SpacePatch, UserGroupInput } from '@/services/admin.types';
import { useCapabilities } from './use-capabilities';
import { useInvalidating } from './use-workspace';
import { CUSTOM_FIELDS_KEY, HIERARCHY_KEY, USER_GROUPS_KEY } from './use-admin.constants';

export const useUserGroups = () => {
  const { canManageStructure } = useCapabilities();
  return useQuery({
    queryKey: [USER_GROUPS_KEY],
    queryFn: adminService.groups,
    enabled: canManageStructure,
  });
};

export const useCreateSpace = () => useInvalidating((name: string) => adminService.createSpace(name), [HIERARCHY_KEY]);
export const useUpdateSpace = () => useInvalidating(({ id, patch }: { id: string; patch: SpacePatch }) => adminService.updateSpace(id, patch), [HIERARCHY_KEY]);
export const useCreateFolder = () => useInvalidating(({ spaceId, name }: { spaceId: string; name: string }) => adminService.createFolder(spaceId, name), [HIERARCHY_KEY]);
export const useRenameFolder = () => useInvalidating(({ id, name }: { id: string; name: string }) => adminService.renameFolder(id, name), [HIERARCHY_KEY]);
export const useDeleteFolder = () => useInvalidating((id: string) => adminService.deleteFolder(id), [HIERARCHY_KEY]);
export const useCreateList = () => useInvalidating(({ spaceId, input }: { spaceId: string; input: ListInput }) => adminService.createList(spaceId, input), [HIERARCHY_KEY]);
export const useUpdateList = () => useInvalidating(({ id, input }: { id: string; input: Partial<ListInput> }) => adminService.updateList(id, input), [HIERARCHY_KEY]);
export const useDeleteList = () => useInvalidating((id: string) => adminService.deleteList(id), [HIERARCHY_KEY]);
export const useCreateCustomField = () => useInvalidating(({ spaceId, input }: { spaceId: string; input: CustomFieldInput }) => adminService.createCustomField(spaceId, input), [CUSTOM_FIELDS_KEY]);
export const useUpdateCustomField = () => useInvalidating(({ id, patch }: { id: string; patch: CustomFieldPatch }) => adminService.updateCustomField(id, patch), [CUSTOM_FIELDS_KEY]);
export const useDeleteCustomField = () => useInvalidating((id: string) => adminService.deleteCustomField(id), [CUSTOM_FIELDS_KEY]);
export const useCreateGroup = () => useInvalidating((input: UserGroupInput) => adminService.createGroup(input), [USER_GROUPS_KEY]);
export const useUpdateGroup = () => useInvalidating(({ id, input }: { id: string; input: UserGroupInput }) => adminService.updateGroup(id, input), [USER_GROUPS_KEY]);
export const useDeleteGroup = () => useInvalidating((id: string) => adminService.deleteGroup(id), [USER_GROUPS_KEY]);
