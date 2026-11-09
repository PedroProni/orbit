import { create } from 'zustand';
import { CreateTaskState } from '@/stores/create-task.types';

export const useCreateTaskStore = create<CreateTaskState>((set) => ({
  open: false,
  session: 0,
  defaults: { listId: null },
  show: (defaults) => set((state) => ({ open: true, defaults, session: state.session + 1 })),
  hide: () => set({ open: false }),
}));
