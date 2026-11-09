'use client';

import { useQuery } from '@tanstack/react-query';
import { capabilitiesOf } from '@/lib/capabilities';
import { orbitService } from '@/services/orbit.service';
import { useSessionStore } from '@/stores/session.store';
import { Capabilities } from '@/types/capabilities.types';

export const useMe = () => {
  const authenticated = useSessionStore((s) => s.authenticated);
  return useQuery({ queryKey: ['me'], queryFn: orbitService.me, enabled: authenticated });
};

export function useCapabilities(): Capabilities {
  const me = useMe();
  return capabilitiesOf(me.data);
}
