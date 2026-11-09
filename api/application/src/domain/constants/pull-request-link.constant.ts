export const PULL_REQUEST_LINKED_ACTION = 'task.pull_request_linked';
export const PULL_REQUEST_UNLINKED_ACTION = 'task.pull_request_unlinked';
export const PULL_REQUEST_ACTIVITY_FIELD = 'pullRequests';
export const PULL_REQUEST_GITHUB_FIELDS = ['title', 'url', 'state', 'draft', 'authorLogin', 'authorAvatarUrl', 'headRef', 'headSha', 'githubUpdatedAt', 'checksState', 'syncedAt'] as const;
export const PULL_REQUEST_CHECKS_FIELDS = ['checksState', 'syncedAt'] as const;
