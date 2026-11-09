import { GithubRefEntity } from '@domain/entities/github-ref.entity';

export class GithubRefPresenter {
  static toView(ref: GithubRefEntity) {
    return {
      id: ref.getId(),
      repository: ref.getRepository(),
      kind: ref.getKind(),
      key: ref.getKey(),
      title: ref.getTitle(),
      url: ref.getUrl(),
      authorLogin: ref.getAuthorLogin(),
      occurredAt: ref.getOccurredAt(),
    };
  }
}
