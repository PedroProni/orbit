'use client';

import { KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Popover } from './popover';
import { SELECT_VARIANT_CLASS, TYPEAHEAD_RESET_MS } from './select.constants';
import { clampIndex, matchOption } from './select.helpers';
import { SelectProps } from './select.types';

export function Select({ value, options, onChange, ariaLabel, placeholder, disabled = false, variant = 'field', className }: SelectProps) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: '', at: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = options[selectedIndex];
  const optionId = (index: number) => `${id}-option-${index}`;

  useEffect(() => {
    if (open) listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [open, active]);

  const show = (index = selectedIndex) => {
    setActive(clampIndex(index, options.length));
    setOpen(true);
  };
  const choose = (index: number) => {
    const option = options[index];
    setOpen(false);
    triggerRef.current?.focus();
    if (option && option.value !== value) onChange(option.value);
  };
  const typeAhead = (key: string) => {
    const now = Date.now();
    const text = now - typed.current.at > TYPEAHEAD_RESET_MS ? key : typed.current.text + key;
    typed.current = { text, at: now };
    const match = matchOption(options, text);
    if (match >= 0) show(match);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === 'Tab') {
      setOpen(false);
      return;
    }
    if (event.key.length === 1 && event.key !== ' ' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      typeAhead(event.key);
      return;
    }
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        show();
      }
      return;
    }
    if (event.key === 'ArrowDown') setActive((index) => clampIndex(index + 1, options.length));
    else if (event.key === 'ArrowUp') setActive((index) => clampIndex(index - 1, options.length));
    else if (event.key === 'Home') setActive(0);
    else if (event.key === 'End') setActive(options.length - 1);
    else if (event.key === 'Enter' || event.key === ' ') choose(active);
    else return;
    event.preventDefault();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-activedescendant={open ? optionId(active) : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className={cn('inline-flex min-w-0 items-center justify-between gap-1.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60', SELECT_VARIANT_CLASS[variant], className)}
      >
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          {selected?.icon}
          <span className="truncate">{selected?.label ?? placeholder}</span>
        </span>
        {disabled ? null : <ChevronDown size={14} aria-hidden="true" className={cn('shrink-0 text-muted transition-transform duration-[var(--motion-fast)]', open && 'rotate-180')} />}
      </button>
      <Popover open={open} anchorRef={triggerRef} onClose={() => setOpen(false)} matchWidth className="max-w-[min(20rem,calc(100vw-1rem))]">
        <ul ref={listRef} id={`${id}-list`} role="listbox" aria-label={ariaLabel} className="max-h-64 overflow-y-auto p-1 text-sm">
          {options.map((option, index) => (
            <li
              key={option.value}
              id={optionId(index)}
              role="option"
              aria-selected={option.value === value}
              data-active={index === active}
              onMouseMove={(event) => {
                if (event.movementX || event.movementY) setActive(index);
              }}
              onClick={() => choose(index)}
              className={cn('flex cursor-pointer items-center gap-2 rounded px-2 py-1.5', index === active && 'bg-panel2')}
            >
              {option.icon}
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {option.value === value ? <Check size={14} aria-hidden="true" className="shrink-0 text-accent" /> : null}
            </li>
          ))}
        </ul>
      </Popover>
    </>
  );
}
