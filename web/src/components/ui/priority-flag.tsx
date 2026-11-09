import { Minus } from 'lucide-react';
import { NO_PRIORITY_COLOR, PRIORITY_COLORS } from '@/components/tasks/tasks.constants';
import { PriorityFlagProps } from './priority-flag.types';
import { PRIORITY_ICONS } from './priority-flag.constants';

export function PriorityFlag({ priority, size = 14 }: PriorityFlagProps) {
  const Icon = priority ? PRIORITY_ICONS[priority] : Minus;
  return <Icon size={size} style={{ color: priority ? PRIORITY_COLORS[priority] : NO_PRIORITY_COLOR }} aria-hidden="true" />;
}
