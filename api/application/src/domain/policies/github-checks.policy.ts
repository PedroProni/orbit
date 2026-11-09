import { GithubChecksState } from '@domain/enums/github.enums';
import { GithubCheckRun } from '@domain/types/github-check-run.type';
import { GithubCombinedStatus } from '@domain/types/github-combined-status.type';
import { GITHUB_FAILED_CONCLUSIONS, GITHUB_FAILED_STATUS_STATES, GITHUB_CHECKS_PRIORITY } from '@domain/constants/github-checks.constant';

export class GithubChecksPolicy {
  static summarize(runs: GithubCheckRun[], combined: GithubCombinedStatus | null): GithubChecksState {
    return [this.fromRuns(runs), this.fromStatus(combined)].reduce(
      (worst, state) => (GITHUB_CHECKS_PRIORITY.indexOf(state) < GITHUB_CHECKS_PRIORITY.indexOf(worst) ? state : worst),
      GithubChecksState.NONE,
    );
  }

  private static fromRuns(runs: GithubCheckRun[]): GithubChecksState {
    if (!runs.length) return GithubChecksState.NONE;
    if (runs.some(run => run.status === 'completed' && GITHUB_FAILED_CONCLUSIONS.includes(run.conclusion ?? ''))) return GithubChecksState.FAILURE;
    if (runs.some(run => run.status !== 'completed')) return GithubChecksState.PENDING;
    return GithubChecksState.SUCCESS;
  }

  private static fromStatus(combined: GithubCombinedStatus | null): GithubChecksState {
    if (!combined || combined.totalCount === 0) return GithubChecksState.NONE;
    if (GITHUB_FAILED_STATUS_STATES.includes(combined.state)) return GithubChecksState.FAILURE;
    if (combined.state === 'pending') return GithubChecksState.PENDING;
    return combined.state === 'success' ? GithubChecksState.SUCCESS : GithubChecksState.NONE;
  }
}
