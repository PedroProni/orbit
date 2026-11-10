'use client';

import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { useCapabilities } from '@/hooks/use-capabilities';
import { useMembers } from '@/hooks/use-orbit';
import { useChannels, useInvalidating, useMessages } from '@/hooks/use-workspace';
import { workspaceService } from '@/services/workspace.service';
import { ChatPostInput } from '@/types/workspace.types';
import { RowsSkeleton } from './screen-skeletons';
import { SCREEN_INPUT_CLASS, SCREEN_PRIMARY_BUTTON_CLASS, SCREEN_SECONDARY_BUTTON_CLASS } from './screens.constants';

export function ChatScreen() {
  const t = useTranslations('chat');
  const tu = useTranslations('ui');
  const channels = useChannels();
  const { canWrite } = useCapabilities();
  const members = useMembers();
  const [selected, setSelected] = useState<string | null>(null);
  const messages = useMessages(selected);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const createChannel = useInvalidating(workspaceService.createChannel, ['channels'], 'channelCreateFailed');
  const post = useInvalidating((args: ChatPostInput) => workspaceService.postMessage(args.id, args.body), ['messages'], 'messageSendFailed');
  const author = (id: string) => members.data?.find((m) => m.id === id)?.name ?? '';
  const channel = channels.data?.find((c) => c.id === selected);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-line px-4 pt-4 md:px-6">
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)]">
        <aside aria-label={t('channels')} className={`${selected ? 'hidden md:block' : ''} min-w-0 p-3 md:border-r md:border-line`}>
          {canWrite ? (
            <form
              className="mb-3 flex gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim()) return;
                createChannel.mutate(name.trim(), {
                  onSuccess: (created) => {
                    setSelected(created.id);
                    setName('');
                  },
                });
              }}
            >
              <input aria-label={t('channelName')} placeholder={t('channelName')} value={name} onChange={(e) => setName(e.target.value)} className={`${SCREEN_INPUT_CLASS} flex-1`} />
              <button type="submit" disabled={!name.trim() || createChannel.isPending} className={SCREEN_SECONDARY_BUTTON_CLASS}>
                {t('create')}
              </button>
            </form>
          ) : null}
          {channels.isLoading ? <RowsSkeleton rows={4} /> : null}
          {channels.isError ? <ErrorState title={tu('loadError')} onRetry={channels.refetch} /> : null}
          {channels.data?.length === 0 ? <EmptyState title={t('noChannels')} hint={t(canWrite ? 'noChannelsHint' : 'noChannelsHintReadOnly')} /> : null}
          <ul className="space-y-1">
            {channels.data?.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  aria-current={c.id === selected ? 'true' : undefined}
                  onClick={() => setSelected(c.id)}
                  className={`w-full truncate rounded px-2 py-1.5 text-left text-sm ${c.id === selected ? 'bg-accentsoft' : 'hover:bg-panel2'}`}
                >
                  # {c.name}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <section aria-label={channel ? `# ${channel.name}` : t('conversation')} className={`${selected ? 'flex' : 'hidden md:flex'} min-h-96 min-w-0 flex-col p-4`}>
          {!selected ? <p className="text-sm text-muted">{t(canWrite ? 'pick' : 'pickOnly')}</p> : null}
          {selected ? (
            <>
              <div className="mb-3 flex items-center gap-2">
                <button type="button" onClick={() => setSelected(null)} className="flex items-center gap-1 rounded px-1 text-sm text-muted hover:text-fg md:hidden">
                  <ChevronLeft size={16} aria-hidden="true" />
                  {t('back')}
                </button>
                {channel ? <h2 className="min-w-0 truncate text-sm font-semibold"># {channel.name}</h2> : null}
              </div>
              {messages.isLoading ? <RowsSkeleton rows={3} /> : null}
              {messages.isError ? <ErrorState title={tu('loadError')} onRetry={messages.refetch} /> : null}
              <ul className="mb-3 flex-1 space-y-2 overflow-y-auto">
                {messages.data?.map((m) => (
                  <li key={m.id} className="break-words text-sm">
                    <span className="mr-2 font-medium">{author(m.authorId)}</span>
                    <span className="whitespace-pre-wrap">{m.bodyMd}</span>
                  </li>
                ))}
                {messages.data?.length === 0 ? <li className="text-sm text-muted">{t('noMessages')}</li> : null}
              </ul>
              {canWrite ? (
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const body = text.trim();
                    if (!body) return;
                    post.mutate({ id: selected, body }, { onSuccess: () => setText((typed) => (typed.trim() === body ? '' : typed)) });
                  }}
                >
                  <input aria-label={t('message')} placeholder={t('message')} value={text} onChange={(e) => setText(e.target.value)} className={`${SCREEN_INPUT_CLASS} flex-1 px-3 py-2`} />
                  <button type="submit" disabled={!text.trim() || post.isPending} className={SCREEN_PRIMARY_BUTTON_CLASS}>
                    {t('send')}
                  </button>
                </form>
              ) : (
                <p role="note" className="rounded border border-line bg-panel2 px-3 py-2 text-sm text-muted">
                  {t('readOnlyNotice')}
                </p>
              )}
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
