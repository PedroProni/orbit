import { ArrowDown, ChevronsUp, Flag, Minus } from 'lucide-react';

export const PRIORITY_ICONS = { urgent: Flag, high: ChevronsUp, normal: Minus, low: ArrowDown } as const;
