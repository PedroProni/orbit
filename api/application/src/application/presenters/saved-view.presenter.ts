import { SavedViewEntity } from '@domain/entities/saved-view.entity';

export class SavedViewPresenter {
  static toView(view: SavedViewEntity) {
    return {
      id: view.getId(),
      ownerId: view.getOwnerId(),
      name: view.getName(),
      viewType: view.getViewType(),
      listId: view.getListId(),
      filters: view.getFilters(),
      display: view.getDisplay(),
      shared: view.getShared(),
      createdAt: view.getCreatedAt(),
      updatedAt: view.getUpdatedAt(),
    };
  }
}
