export interface SessionState {
  authenticated: boolean;
  hydrated: boolean;
  hydrate: (check: () => Promise<unknown>) => Promise<void>;
  setAuthenticated: () => void;
  clear: () => void;
}
