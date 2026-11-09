import { create } from 'zustand';
import { SessionState } from '@/stores/session.types';
import { LEGACY_SESSION_STORAGE_KEY } from '@/config/app.constants';

export const useSessionStore = create<SessionState>((set) => ({
  authenticated: false,
  hydrated: false,
  hydrate: async (check) => {
    window.localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
    const authenticated = await check().then(
      () => true,
      () => false,
    );
    set({ authenticated, hydrated: true });
  },
  setAuthenticated: () => set({ authenticated: true, hydrated: true }),
  clear: () => set({ authenticated: false }),
}));
