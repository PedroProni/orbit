'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { ADMIN_SECONDARY_BUTTON_CLASS } from './admin.constants';
import { CopyButtonProps } from './admin.types';

export function CopyButton({ value, label, copiedLabel, ariaLabel }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button type="button" aria-label={ariaLabel} onClick={() => void copy()} className={ADMIN_SECONDARY_BUTTON_CLASS}>
      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      {copied ? copiedLabel : label}
    </button>
  );
}
