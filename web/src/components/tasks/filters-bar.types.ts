import { SpaceNode } from '@/types/api.types';

export interface FilterChip {
  key: string;
  label: string;
  clear: () => void;
}

export interface FiltersBarProps {
  space?: SpaceNode;
}
