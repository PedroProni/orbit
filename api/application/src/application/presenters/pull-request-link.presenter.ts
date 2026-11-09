import { PullRequestLinkEntity } from '@domain/entities/pull-request-link.entity';

export class PullRequestLinkPresenter {
  static toView(link: PullRequestLinkEntity) {
    return {
      id: link.getId(),
      taskId: link.getTaskId(),
      repository: link.getRepository(),
      number: link.getNumber(),
      url: link.getUrl(),
      title: link.getTitle(),
      state: link.getState(),
      source: link.getSource(),
      createdAt: link.getCreatedAt(),
      updatedAt: link.getUpdatedAt(),
    };
  }
}
