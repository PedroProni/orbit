'use client';

import { useRef, useState } from 'react';
import { Calendar } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { formatCompactDay, formatDay } from '@/lib/calendar-day';
import { cn } from '@/lib/cn';
import { DateCalendar } from './date-calendar';
import { DateFieldProps } from './date-field.types';
import { Popover } from './popover';
import { SELECT_VARIANT_CLASS } from './select.constants';

export function DateField({ value, onChange, ariaLabel, disabled = false, variant = 'field', className }: DateFieldProps) {
  const t = useTranslations('ui');
  const locale = useLocale();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        value={value}
        onClick={() => setOpen((current) => !current)}
        className={cn('inline-flex min-w-0 items-center justify-between gap-1.5 text-left tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-60', SELECT_VARIANT_CLASS[variant], className)}
      >
        <span className={cn('truncate', !value && 'text-muted')}>{value ? (variant === 'inline' ? formatCompactDay(value, locale) : formatDay(value, locale)) : t('noDate')}</span>
        {disabled ? null : <Calendar size={13} aria-hidden="true" className="shrink-0 text-muted" />}
      </button>
      <Popover open={open} anchorRef={triggerRef} onClose={close} role="dialog" label={ariaLabel}>
        {open ? (
          <DateCalendar
            value={value}
            onSelect={(day) => {
              close();
              if (day !== value) onChange(day);
            }}
          />
        ) : null}
      </Popover>
    </>
  );
}
