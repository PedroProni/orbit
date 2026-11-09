'use client';

import { useState } from 'react';
import { useHierarchy } from './use-orbit';

export function useAdminSpace() {
  const hierarchy = useHierarchy();
  const [chosen, setChosen] = useState('');
  const spaces = hierarchy.data ?? [];
  const space = spaces.find((item) => item.id === chosen) ?? spaces[0] ?? null;
  return { hierarchy, spaces, space, choose: setChosen };
}
