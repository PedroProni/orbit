'use client';

import { useRef, useState } from 'react';
import { MenuList } from './menu-list';
import { DropdownMenuProps } from './menu.types';
import { Popover } from './popover';

export function DropdownMenu({ items, label, children, className }: DropdownMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };
  return (
    <>
      <button ref={triggerRef} type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((current) => !current)} className={className}>
        {children}
      </button>
      <Popover open={open} anchorRef={triggerRef} onClose={close} align="end">
        {open ? <MenuList items={items} onClose={close} label={label} /> : null}
      </Popover>
    </>
  );
}
