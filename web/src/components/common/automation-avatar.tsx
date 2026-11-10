import { Bot } from 'lucide-react';
import { AutomationAvatarProps } from './automation-avatar.types';

export function AutomationAvatar({ name, size = 22 }: AutomationAvatarProps) {
  return (
    <span role="img" title={name} aria-label={name} data-actor="automation" className="inline-flex shrink-0 items-center justify-center rounded-full bg-accentsoft text-accent ring-2 ring-panel" style={{ width: size, height: size }}>
      <Bot size={Math.round(size * 0.58)} aria-hidden="true" />
    </span>
  );
}
