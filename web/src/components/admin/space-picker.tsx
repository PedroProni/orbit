'use client';

import { useTranslations } from 'next-intl';
import { Select } from '@/components/ui/select';
import { ADMIN_LABEL_CLASS } from './admin.constants';
import { SpacePickerProps } from './admin.types';

export function SpacePicker({ spaces, value, onChange }: SpacePickerProps) {
  const t = useTranslations('admin');
  return (
    <div className="mb-4 max-w-xs">
      <span className={ADMIN_LABEL_CLASS}>{t('spacePicker')}</span>
      <Select
        ariaLabel={t('spacePicker')}
        value={value}
        onChange={onChange}
        options={spaces.map((space) => ({
          value: space.id,
          label: space.name,
        }))}
      />
    </div>
  );
}
