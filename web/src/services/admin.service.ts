import { api } from '@/lib/api-client';
import { CustomFieldDefinition, FolderNode, ListNode, SpaceNode } from '@/types/api.types';
import { CustomFieldInput, ListInput, SpacePatch, UserGroup, UserGroupInput } from './admin.types';

const send = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

export const adminService = {
  createSpace: (name: string) => api<SpaceNode>('/spaces', send('POST', { name })),
  updateSpace: (id: string, patch: SpacePatch) => api<SpaceNode>(`/spaces/${id}`, send('PATCH', patch)),
  createFolder: (spaceId: string, name: string) => api<FolderNode>(`/spaces/${spaceId}/folders`, send('POST', { name })),
  renameFolder: (id: string, name: string) => api<FolderNode>(`/folders/${id}`, send('PATCH', { name })),
  deleteFolder: (id: string) => api<void>(`/folders/${id}`, send('DELETE')),
  createList: (spaceId: string, input: ListInput) => api<ListNode>(`/spaces/${spaceId}/lists`, send('POST', input)),
  updateList: (id: string, input: Partial<ListInput>) => api<ListNode>(`/lists/${id}`, send('PATCH', input)),
  deleteList: (id: string) => api<void>(`/lists/${id}`, send('DELETE')),
  createCustomField: (spaceId: string, input: CustomFieldInput) => api<CustomFieldDefinition>(`/spaces/${spaceId}/custom-fields`, send('POST', input)),
  deleteCustomField: (id: string) => api<void>(`/custom-fields/${id}`, send('DELETE')),
  groups: () => api<UserGroup[]>('/user-groups'),
  createGroup: (input: UserGroupInput) => api<UserGroup>('/user-groups', send('POST', input)),
  updateGroup: (id: string, input: UserGroupInput) => api<UserGroup>(`/user-groups/${id}`, send('PATCH', input)),
  deleteGroup: (id: string) => api<void>(`/user-groups/${id}`, send('DELETE')),
};
