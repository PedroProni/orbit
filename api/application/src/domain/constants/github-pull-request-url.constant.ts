export const GITHUB_PULL_REQUEST_URL_PATTERN =
  /^https:\/\/(?:www\.)?github\.com\/([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9._-]{1,100})\/pull\/([1-9]\d{0,8})(?:\/(?:files|commits|checks))?\/?(?:[?#]\S*)?$/;
export const GITHUB_PULL_REQUEST_URL_MAX_LENGTH = 500;
export const GITHUB_PULL_REQUEST_URL_BASE = 'https://github.com';
