import { AriaRole, ReactNode, RefObject } from 'react';
import { FloatingAlign } from './floating.types';

export interface PopoverProps {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  children: ReactNode;
  id?: string;
  role?: AriaRole;
  label?: string;
  align?: FloatingAlign;
  matchWidth?: boolean;
  className?: string;
}
