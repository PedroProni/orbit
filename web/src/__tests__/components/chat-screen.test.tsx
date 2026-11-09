// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { MEMBERS } from '../helpers/fixtures';
import { ChatScreen } from '@/components/workspace/chat-screen';
import { workspaceService } from '@/services/workspace.service';

vi.mock('@/hooks/use-orbit', () => ({ useMembers: () => ({ data: MEMBERS }) }));
vi.mock('@/services/workspace.service', () => ({ workspaceService: { createChannel: vi.fn(), postMessage: vi.fn() } }));

const state = vi.hoisted(() => ({ messages: [] as unknown[] }));

vi.mock('@/hooks/use-workspace', () => ({
  useChannels: () => ({ data: [{ id: 'c1', name: 'general', kind: 'public' }] }),
  useMessages: (id: string | null) => ({ data: id ? state.messages : undefined }),
  useInvalidating: (fn: (args: unknown) => unknown) => ({ mutate: (args: unknown) => fn(args), isPending: false }),
}));

describe('ChatScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.messages = [];
  });

  it('asks to pick a channel and lists the channels', () => {
    renderWithProviders(<ChatScreen />);
    expect(screen.getByText('Pick or create a channel')).toBeTruthy();
    expect(screen.getByRole('button', { name: '# general' })).toBeTruthy();
  });

  it('shows messages with author names after selecting a channel', () => {
    state.messages = [{ id: 'm1', authorId: 'u2', bodyMd: 'hi team', createdAt: '2026-11-04T10:00:00Z' }];
    renderWithProviders(<ChatScreen />);
    fireEvent.click(screen.getByRole('button', { name: '# general' }));
    expect(screen.getByText('Bruno Lima')).toBeTruthy();
    expect(screen.getByText('hi team')).toBeTruthy();
  });

  it('shows the no messages state and posts a trimmed message', () => {
    renderWithProviders(<ChatScreen />);
    fireEvent.click(screen.getByRole('button', { name: '# general' }));
    expect(screen.getByText('No messages yet')).toBeTruthy();
    const send = screen.getByRole('button', { name: 'Send' }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Write a message'), { target: { value: '  hello  ' } });
    fireEvent.click(send);
    expect(workspaceService.postMessage).toHaveBeenCalledWith('c1', 'hello');
  });

  it('creates a channel from the sidebar form', () => {
    renderWithProviders(<ChatScreen />);
    fireEvent.change(screen.getByLabelText('Channel name'), { target: { value: ' random ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(workspaceService.createChannel).toHaveBeenCalledWith('random');
  });
});
