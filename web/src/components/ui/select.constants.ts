import { SelectVariant } from './select.types';

export const TYPEAHEAD_RESET_MS = 500;
export const SELECT_VARIANT_CLASS: Record<SelectVariant, string> = {
  field: 'w-full rounded-md border border-line bg-panel2 px-2.5 py-1 hover:border-linestrong',
  ghost: 'rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-muted hover:border-line',
  inline: 'w-full rounded border border-transparent bg-transparent px-1.5 py-1 hover:bg-panel2',
};
