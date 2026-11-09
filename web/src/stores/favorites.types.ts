export interface FavoriteTask {
  id: string;
  title: string;
}

export interface FavoritesState {
  listIds: string[];
  tasks: FavoriteTask[];
  hydrated: boolean;
  hydrate: () => void;
  toggle: (listId: string) => void;
  toggleTask: (task: FavoriteTask) => void;
  renameTask: (task: FavoriteTask) => void;
}
