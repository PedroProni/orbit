import { create } from 'zustand';
import { motionEnabled } from '@/lib/motion';
import { MOTION_BASE_MS } from '@/lib/motion.constants';
import { ToastState } from '@/stores/toast.types';
import { TOAST_ACTION_TTL_MS, TOAST_MAX_VISIBLE, TOAST_TTL_MS } from '@/stores/toast.constants';

let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => {
  const remove = (id: number) => set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
  return {
    items: [],
    push: (kind, messageKey, values, options) => {
      const id = nextId++;
      const actions = options?.actions?.length ? options.actions : undefined;
      set((state) => ({ items: [...state.items, { id, kind, messageKey, values, actions }].slice(-TOAST_MAX_VISIBLE) }));
      setTimeout(() => get().dismiss(id), options?.ttlMs ?? (actions ? TOAST_ACTION_TTL_MS : TOAST_TTL_MS));
    },
    dismiss: (id) => {
      if (!motionEnabled()) {
        remove(id);
        return;
      }
      set((state) => ({ items: state.items.map((item) => (item.id === id ? { ...item, leaving: true } : item)) }));
      setTimeout(() => remove(id), MOTION_BASE_MS);
    },
  };
});
