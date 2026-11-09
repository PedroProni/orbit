'use client';

import { KeyboardEvent, useEffect, useRef } from 'react';
import { MenuListProps } from './menu.types';

export function MenuList({ items, onClose, label }: MenuListProps) {
  const ref = useRef<HTMLUListElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, []);
  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const buttons = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const targets: Record<string, number> = { ArrowDown: (current + 1) % buttons.length, ArrowUp: (current - 1 + buttons.length) % buttons.length, Home: 0, End: buttons.length - 1 };
    const target = targets[event.key];
    if (target === undefined) return;
    event.preventDefault();
    buttons[target]?.focus();
  };
  return (
    <ul ref={ref} role="menu" aria-label={label} onKeyDown={onKeyDown} className="min-w-44 p-1">
      {items.map((item) => (
        <li key={item.key} role="none">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onClose();
              item.onSelect();
            }}
            className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-panel2 focus:bg-panel2 ${item.danger ? 'text-danger' : ''}`}
          >
            {item.icon}
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
