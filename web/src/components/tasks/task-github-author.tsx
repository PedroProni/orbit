import { Avatar } from '@/components/common/avatar';
import { GITHUB_AVATAR_URL_PATTERN } from './task-github.constants';
import { TaskGithubAuthorProps } from './task-github.types';

export function TaskGithubAuthor({ login, avatarUrl }: TaskGithubAuthorProps) {
  return (
    <span className="flex min-w-0 items-center gap-1">
      {avatarUrl && GITHUB_AVATAR_URL_PATTERN.test(avatarUrl) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" width={14} height={14} loading="lazy" referrerPolicy="no-referrer" className="h-3.5 w-3.5 shrink-0 rounded-full" />
      ) : (
        <Avatar id={login} name={login} size={14} />
      )}
      <span className="min-w-0 truncate">{login}</span>
    </span>
  );
}
