import { CustomFieldType, StatusDefinition } from '@/types/api.types';

export type StatusInput = Pick<StatusDefinition, 'name' | 'color' | 'type'>;

export interface SpacePatch {
  name?: string;
  statuses?: StatusInput[];
  requiredTags?: string[];
  titlePrefixes?: string[];
}

export interface ListInput {
  name: string;
  kind?: 'list' | 'sprint';
  folderId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface CustomFieldInput {
  name: string;
  type: CustomFieldType;
  options: string[];
}

export interface CustomFieldPatch {
  name?: string;
  listIds?: string[] | null;
}

export interface UserGroup {
  id: string;
  name: string;
  memberIds: string[];
}

export interface UserGroupInput {
  name: string;
  memberIds: string[];
}
