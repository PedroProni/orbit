import { afterEach, describe, expect, it, vi } from 'vitest';
import { workspaceService } from '@/services/workspace.service';

describe('workspaceService.recurrence', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns null, never undefined, for a task without recurrence', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 200 })));
    await expect(workspaceService.recurrence('t1')).resolves.toBeNull();
  });
});
