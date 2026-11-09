export interface RecentListsState {
  listIds: string[];
  hydrated: boolean;
  hydrate: () => void;
  remember: (listId: string) => void;
}
