'use client';

import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FIELD_CLASS } from './auth.constants';
import { PasswordInputProps } from './auth.types';

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(props, ref) {
  const t = useTranslations('login');
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input ref={ref} {...props} type={visible ? 'text' : 'password'} className={`${FIELD_CLASS} pr-9`} />
      <button type="button" aria-label={visible ? t('hidePassword') : t('showPassword')} aria-pressed={visible} onClick={() => setVisible((value) => !value)} className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted hover:text-fg">
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
});
