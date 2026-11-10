import { FormFieldTarget } from '@/services/form.types';
import { FormStatus } from './forms.types';

export const FORM_NAME_MAX_LENGTH = 80;
export const FORM_FIELD_LABEL_MAX_LENGTH = 120;
export const FORM_MAX_FIELDS = 20;
export const FORM_FIELD_TARGETS: FormFieldTarget[] = ['title', 'description'];
export const PUBLIC_FORM_PATH = '/f/';
export const FORM_STATUS_BADGE_CLASS: Record<FormStatus, string> = {
  paused: 'bg-[color-mix(in_srgb,var(--priority-high)_18%,transparent)] text-fg',
  open: 'bg-accentsoft text-fg',
  off: 'bg-panel2 text-muted',
};
