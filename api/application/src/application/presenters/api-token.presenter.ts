import { ApiTokenEntity } from '@domain/entities/api-token.entity';

export class ApiTokenPresenter {
  static toView(token: ApiTokenEntity) {
    return { id: token.getId(), userId: token.getUserId(), name: token.getName(), scopes: token.getScopes(), lastUsedAt: token.getLastUsedAt(), revokedAt: token.getRevokedAt(), createdAt: token.getCreatedAt() };
  }
}
