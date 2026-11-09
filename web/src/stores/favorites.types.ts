export interface FavoritesState {
  listIds: string[];
  hydrated: boolean;
  hydrate: () => void;
  toggle: (listId: string) => void;
}
