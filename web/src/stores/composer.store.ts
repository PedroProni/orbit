import { create } from 'zustand';
import { EMPTY_DRAFT, EMPTY_PRESETS } from '@/components/tasks/task-composer.constants';
import { draftFromPresets, moveDraft } from '@/components/tasks/task-composer.helpers';
import { ComposerState } from '@/components/tasks/task-composer.types';

export const useComposerStore = create<ComposerState>((set) => ({
  anchor: null,
  presets: EMPTY_PRESETS,
  draft: EMPTY_DRAFT,
  refusal: null,
  open: (anchor, presets) =>
    set((state) => (state.anchor ? { anchor, presets, draft: moveDraft(state.draft, state.presets, presets), refusal: null } : { anchor, presets, draft: draftFromPresets('', presets), refusal: null })),
  close: () => set({ anchor: null, presets: EMPTY_PRESETS, draft: EMPTY_DRAFT, refusal: null }),
  setDraft: (draft) => set((state) => ({ draft: { ...state.draft, ...draft } })),
  refuse: (refusal) => set({ refusal }),
  clearRefusal: () => set({ refusal: null }),
}));
