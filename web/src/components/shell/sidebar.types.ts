import { ReactNode } from 'react';
import { ListNode, SpaceNode } from '@/types/api.types';

export interface ListLinkProps {
  list: ListNode;
  active: boolean;
}

export interface BranchProps {
  icon: ReactNode;
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  level?: number;
}

export interface SpaceBadgeProps {
  name: string;
}

export interface SpaceTreeProps {
  space: SpaceNode;
  activeId?: string;
}

export interface SpaceCreateMenuProps {
  space: SpaceNode;
}

export type SidebarListDraft = { kind: 'list' | 'sprint' } | null;
