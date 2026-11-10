import { Principal } from '@/types/api.types';
import { Capabilities } from '@/types/capabilities.types';

export function capabilitiesOf(me: Principal | undefined): Capabilities {
  const isGuest = me?.role === 'guest';
  const isViewer = me?.role === 'viewer';
  return {
    loaded: !!me,
    isGuest,
    member: !!me && !isGuest,
    isViewer,
    canWrite: !isGuest && !isViewer,
    userId: me?.id ?? null,
    canModerateComments: me?.role === 'owner' || me?.role === 'admin',
    canManageAccess: me?.role === 'owner' || me?.role === 'admin',
    canManageStructure: me?.role === 'owner' || me?.role === 'admin',
    isOwner: me?.role === 'owner',
  };
}
