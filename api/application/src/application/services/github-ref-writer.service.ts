import { Inject, Injectable } from '@nestjs/common';
import { GITHUB_REF_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { GithubRefRepository } from '@domain/repositories/github-ref.repository';
import { GithubRefEntity } from '@domain/entities/github-ref.entity';
import { TaskEntity } from '@domain/entities/task.entity';
import { GithubRefInput } from '@domain/types/github-ref-input.type';
import { newId } from '@common/helpers/functions/id.helper';
import { PullRequestLinkWriterService } from '@application/services/pull-request-link-writer.service';

@Injectable()
export class GithubRefWriterService {
  constructor(
    @Inject(GITHUB_REF_INJECT_TOKEN) private readonly refs: GithubRefRepository,
    private readonly linkWriter: PullRequestLinkWriterService,
  ) {}

  async record(task: TaskEntity, input: GithubRefInput, now: Date): Promise<void> {
    await this.refs.upsertRef(
      new GithubRefEntity({
        _id: newId(),
        workspaceId: task.getWorkspaceId(),
        taskId: task.getId(),
        repository: this.linkWriter.canonical(input.repository),
        kind: input.kind,
        key: input.key,
        title: input.title,
        url: input.url,
        authorLogin: input.authorLogin,
        occurredAt: input.occurredAt,
        createdAt: now,
        updatedAt: now,
      }),
    );
  }

  removeBranch(repository: string, name: string): Promise<number> {
    return this.refs.removeBranch(this.linkWriter.canonical(repository), name);
  }

  removeBranchesNotIn(repository: string, keep: string[], seenBefore: Date): Promise<number> {
    return this.refs.removeBranchesNotIn(this.linkWriter.canonical(repository), keep, seenBefore);
  }
}
