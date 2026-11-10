import { describe, expect, it } from 'vitest';
import { capabilitiesOf } from '@/lib/capabilities';
import { guestCanOpen } from '@/components/shell/guest-access.helpers';
import { Principal } from '@/types/api.types';

const me = (role: Principal['role']): Principal => ({ id: 'u1', email: 'a@x.io', name: 'A', avatarUrl: null, role, status: 'active', workspaceId: 'w', scopes: [] });

describe('capabilitiesOf', () => {
  it('treats an unknown session as neither guest nor member', () => {
    expect(capabilitiesOf(undefined)).toMatchObject({ loaded: false, isGuest: false, member: false, userId: null, canModerateComments: false });
  });

  it('separates guests from members and moderators', () => {
    expect(capabilitiesOf(me('guest'))).toMatchObject({ loaded: true, isGuest: true, member: false, canModerateComments: false });
    expect(capabilitiesOf(me('member'))).toMatchObject({ isGuest: false, member: true, canModerateComments: false });
    expect(capabilitiesOf(me('admin')).canModerateComments).toBe(true);
    expect(capabilitiesOf(me('owner')).canModerateComments).toBe(true);
  });

  it('marks only the owner as owner', () => {
    expect(capabilitiesOf(undefined).isOwner).toBe(false);
    expect(capabilitiesOf(me('admin')).isOwner).toBe(false);
    expect(capabilitiesOf(me('owner')).isOwner).toBe(true);
  });

  it('lets only owners and admins manage access', () => {
    expect(capabilitiesOf(undefined).canManageAccess).toBe(false);
    expect(capabilitiesOf(me('guest')).canManageAccess).toBe(false);
    expect(capabilitiesOf(me('member')).canManageAccess).toBe(false);
    expect(capabilitiesOf(me('admin')).canManageAccess).toBe(true);
    expect(capabilitiesOf(me('owner')).canManageAccess).toBe(true);
  });

  it('keeps a viewer a member who reads everything but writes nothing', () => {
    expect(capabilitiesOf(me('viewer'))).toMatchObject({ loaded: true, isViewer: true, isGuest: false, member: true, canWrite: false, canModerateComments: false, canManageAccess: false, canManageStructure: false });
    expect(capabilitiesOf(me('guest'))).toMatchObject({ isViewer: false, canWrite: false });
    for (const role of ['member', 'admin', 'owner'] as const) expect(capabilitiesOf(me(role))).toMatchObject({ isViewer: false, canWrite: true });
  });
});

describe('guestCanOpen', () => {
  it('allows only home, lists, all tasks, task links and the own account', () => {
    for (const path of ['/', '/lists/abc', '/all-tasks', '/t/86abc', '/account']) expect(guestCanOpen(path)).toBe(true);
    for (const path of ['/inbox', '/docs', '/goals', '/dashboards', '/chat', '/admin', '/admin/people', '/listsx', '/tasks']) expect(guestCanOpen(path)).toBe(false);
  });
});
