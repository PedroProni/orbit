import { ChangeEvent, KeyboardEvent, Ref } from 'react';

export interface TitleTextareaProps {
  ref?: Ref<HTMLTextAreaElement>;
  value: string;
  label: string;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  className?: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
}
