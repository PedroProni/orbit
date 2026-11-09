'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { orbitService } from '@/services/orbit.service';
import { useSessionStore } from '@/stores/session.store';

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 15000, retry: 1, refetchOnWindowFocus: false } } }));
  const hydrate = useSessionStore((s) => s.hydrate);
  useEffect(() => {
    void hydrate(() => client.fetchQuery({ queryKey: ['me'], queryFn: orbitService.me, retry: false }));
  }, [client, hydrate]);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
