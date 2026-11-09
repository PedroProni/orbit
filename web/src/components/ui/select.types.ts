import { ReactNode } from 'react';

export type SelectVariant = 'field' | 'ghost' | 'inline' | 'pill';

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

export interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  variant?: SelectVariant;
  className?: string;
}
