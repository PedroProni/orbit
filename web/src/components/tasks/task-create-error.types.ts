export interface TaskCreateError {
  key: 'createForbidden' | 'prefixError' | 'tagError' | 'statusError' | 'createFailed';
  values?: Record<string, string>;
}
