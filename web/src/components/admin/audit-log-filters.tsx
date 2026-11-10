'use client';

import { useTranslations } from 'next-intl';
import { Select } from '@/components/ui/select';
import { useMembers } from '@/hooks/use-orbit';
import { ADMIN_FIELD_CLASS, ADMIN_LABEL_CLASS } from './admin.constants';
import { AUDIT_ACTION_GROUPS, AUDIT_ALL, AUDIT_ENTITY_TYPES, AUDIT_FILTERABLE_SYSTEM_ACTORS, AUDIT_SYSTEM_ACTOR_KEYS } from './audit-log.constants';
import { AuditLogFiltersProps } from './audit-log.types';

export function AuditLogFilters({ draft, invalidRange, onChange }: AuditLogFiltersProps) {
  const t = useTranslations('admin.auditLog');
  const members = useMembers();
  const people = [
    { value: AUDIT_ALL, label: t('filters.anyone') },
    ...(members.data ?? []).map((member) => ({ value: member.id, label: member.name })),
    ...AUDIT_FILTERABLE_SYSTEM_ACTORS.map((id) => ({ value: id, label: t(`actor.system.${AUDIT_SYSTEM_ACTOR_KEYS[id]}`) })),
  ];
  const groups = [{ value: AUDIT_ALL, label: t('filters.anyAction') }, ...AUDIT_ACTION_GROUPS.map((group) => ({ value: group, label: t(`groups.${group}`) }))];
  const types = [{ value: AUDIT_ALL, label: t('filters.anyEntity') }, ...AUDIT_ENTITY_TYPES.map((type) => ({ value: type, label: t(`entityTypes.${type}`) }))];
  return (
    <section aria-label={t('filters.label')} className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div>
        <span className={ADMIN_LABEL_CLASS}>{t('filters.person')}</span>
        <Select ariaLabel={t('filters.person')} value={draft.actorId} options={people} onChange={(actorId) => onChange({ ...draft, actorId })} />
      </div>
      <div>
        <span className={ADMIN_LABEL_CLASS}>{t('filters.action')}</span>
        <Select ariaLabel={t('filters.action')} value={draft.group} options={groups} onChange={(group) => onChange({ ...draft, group })} />
      </div>
      <div>
        <span className={ADMIN_LABEL_CLASS}>{t('filters.entity')}</span>
        <Select ariaLabel={t('filters.entity')} value={draft.entityType} options={types} onChange={(entityType) => onChange({ ...draft, entityType })} />
      </div>
      <label className="block">
        <span className={ADMIN_LABEL_CLASS}>{t('filters.from')}</span>
        <input type="date" value={draft.fromDay} onChange={(event) => onChange({ ...draft, fromDay: event.target.value })} aria-invalid={invalidRange} className={ADMIN_FIELD_CLASS} />
      </label>
      <label className="block">
        <span className={ADMIN_LABEL_CLASS}>{t('filters.to')}</span>
        <input type="date" value={draft.toDay} onChange={(event) => onChange({ ...draft, toDay: event.target.value })} aria-invalid={invalidRange} className={ADMIN_FIELD_CLASS} />
      </label>
      {invalidRange ? (
        <p role="alert" className="text-xs text-danger sm:col-span-2 lg:col-span-5">
          {t('filters.invalidRange')}
        </p>
      ) : null}
    </section>
  );
}
