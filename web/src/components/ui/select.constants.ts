import { SelectVariant } from './select.types';

export const TYPEAHEAD_RESET_MS = 500;
export const SELECT_VARIANT_CLASS: Record<SelectVariant, string> = {
  field: 'w-full rounded-md border border-line bg-panel2 px-2.5 py-1 hover:border-linestrong',
  ghost: 'rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-muted hover:border-line',
  inline: 'group w-full rounded border border-transparent bg-transparent px-1.5 py-1 hover:bg-panel2',
  pill: 'rounded-l bg-transparent px-2 py-0.5 text-[11px] font-semibold uppercase text-white hover:bg-black/15',
};
export const SELECT_CHEVRON_CLASS: Record<SelectVariant, string> = {
  field: '',
  ghost: '',
  inline: 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
  pill: 'hidden',
};
