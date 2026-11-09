'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useChannels, useInvalidating, useMessages } from '@/hooks/use-workspace';
import { useMembers } from '@/hooks/use-orbit';
import { workspaceService } from '@/services/workspace.service';

export function ChatScreen() {
  const t = useTranslations('chat');
  const channels = useChannels();
  const members = useMembers();
  const [selected, setSelected] = useState<string | null>(null);
  const messages = useMessages(selected);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const createChannel = useInvalidating(workspaceService.createChannel, ['channels']);
  const post = useInvalidating((args: { id: string; body: string }) => workspaceService.postMessage(args.id, args.body), ['messages']);
  const author = (id: string) => members.data?.find((m) => m.id === id)?.name ?? '';
  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="border-b border-line p-3 md:border-b-0 md:border-r">
        <form
          className="mb-3 flex gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            createChannel.mutate(name.trim(), { onSuccess: (created) => setSelected(created.id) });
            setName('');
          }}
        >
          <input aria-label={t('channelName')} placeholder={t('channelName')} value={name} onChange={(e) => setName(e.target.value)} className="min-w-0 flex-1 rounded border border-line bg-panel2 px-2 py-1 text-sm" />
          <button type="submit" className="rounded border border-line px-2 text-sm">
            {t('create')}
          </button>
        </form>
        <ul className="space-y-1">
          {channels.data?.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => setSelected(c.id)} className={`w-full truncate rounded px-2 py-1 text-left text-sm ${c.id === selected ? 'bg-accentsoft' : 'hover:bg-panel2'}`}>
                # {c.name}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <section className="flex min-h-96 flex-col p-4">
        {!selected ? <p className="text-sm text-muted">{t('pick')}</p> : null}
        {selected ? (
          <>
            <ul className="mb-3 flex-1 space-y-2 overflow-y-auto">
              {messages.data?.map((m) => (
                <li key={m.id} className="text-sm">
                  <span className="mr-2 font-medium">{author(m.authorId)}</span>
                  <span className="whitespace-pre-wrap">{m.bodyMd}</span>
                </li>
              ))}
              {messages.data?.length === 0 ? <li className="text-sm text-muted">{t('noMessages')}</li> : null}
            </ul>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!text.trim()) return;
                post.mutate({ id: selected, body: text.trim() });
                setText('');
              }}
            >
              <input aria-label={t('message')} placeholder={t('message')} value={text} onChange={(e) => setText(e.target.value)} className="flex-1 rounded border border-line bg-panel2 px-3 py-2 text-sm" />
              <button type="submit" disabled={!text.trim()} className="rounded bg-accent px-3 py-2 text-sm text-white disabled:opacity-50">
                {t('send')}
              </button>
            </form>
          </>
        ) : null}
      </section>
    </div>
  );
}
