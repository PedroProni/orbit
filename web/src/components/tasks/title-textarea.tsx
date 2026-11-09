'use client';

import { ChangeEvent, KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';
import { TitleTextareaProps } from './title-textarea.types';

export function TitleTextarea({ ref, value, label, placeholder, maxLength, autoFocus, className, onChange, onKeyDown }: TitleTextareaProps) {
  const change = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (event.target.value.includes('\n')) event.target.value = event.target.value.replace(/\r?\n/g, ' ');
    onChange(event);
  };
  const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.key !== 'Enter' || event.nativeEvent.isComposing) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };
  return (
    <textarea
      ref={ref}
      rows={1}
      aria-label={label}
      placeholder={placeholder}
      value={value}
      maxLength={maxLength}
      autoFocus={autoFocus}
      onChange={change}
      onKeyDown={keyDown}
      className={cn('no-focus-ring block w-full resize-none overflow-hidden break-words bg-transparent outline-none [field-sizing:content]', className)}
    />
  );
}
