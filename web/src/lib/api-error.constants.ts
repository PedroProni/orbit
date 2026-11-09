export const API_ERROR_KEYS: Readonly<Record<string, string>> = {
  'Subtasks move with their parent': 'subtaskMove',
  'Unknown status for this space': 'unknownStatus',
  'Unknown user in assignees': 'unknownUser',
  'Unknown user in watchers': 'unknownUser',
  'Subtasks cannot recur': 'subtaskRecurrence',
  'Dependency already exists': 'dependencyExists',
  'Dependency would create a cycle': 'dependencyCycle',
  'A timer is already running': 'timerRunning',
  'No running timer for this task': 'timerNotRunning',
  'Unknown user in members': 'unknownUser',
  'List is not empty': 'listNotEmpty',
  'Folder is not empty': 'folderNotEmpty',
  'Cannot remove a status that is in use': 'statusInUse',
  'Default statuses cannot be removed, renamed or reordered': 'defaultStatusLocked',
  'Status names must be unique': 'statusDuplicate',
  'Not a GitHub pull request link': 'pullRequestUrl',
  'Prints must be images attached to the task': 'printsImagesOnly',
  'GitHub refresh: GITHUB_REFRESH_COOLDOWN': 'githubCooldown',
  'GitHub refresh: GITHUB_NOT_CONFIGURED': 'githubNotConfigured',
};
export const API_ERROR_BY_STATUS: Readonly<Record<number, string>> = { 403: 'forbidden', 404: 'notFound', 409: 'conflict' };
export const API_ERROR_FALLBACK = 'generic';
