'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Checklist } from '@/types/api.types';
import { addChecklist, addItem, changeItem, removeChecklist, removeItem, renameChecklist } from './task-checklists.helpers';
import { TASK_CHECKLIST_ITEM_MAX, TASK_CHECKLIST_NAME_MAX } from './task-checklists.constants';
import { ChecklistEditorProps, TaskChecklistsProps } from './task-field.types';

function ChecklistEditor({ list, task, save }: ChecklistEditorProps) {
  const t = useTranslations('drawer');
  const [item, setItem] = useState('');
  const send = (checklists: Checklist[]) => save({ checklists });
  const done = list.items.filter((entry) => entry.resolved).length;
  return (
    <section aria-label={list.name}>
      <div className="mb-1 flex items-center gap-2">
        <input
          aria-label={t('renameChecklist', { name: list.name })}
          defaultValue={list.name}
          maxLength={TASK_CHECKLIST_NAME_MAX}
          key={list.name}
          onBlur={(e) => {
            const next = e.target.value.trim();
            if (next && next !== list.name) send(renameChecklist(task.checklists, list.id, next));
            else e.target.value = list.name;
          }}
          className="no-focus-ring min-w-0 flex-1 bg-transparent text-xs uppercase text-muted outline-none focus:text-fg"
        />
        <span className="text-xs text-muted">
          {done}/{list.items.length}
        </span>
        <button type="button" aria-label={t('deleteChecklist', { name: list.name })} onClick={() => send(removeChecklist(task.checklists, list.id))} className="text-muted hover:text-danger">
          <X size={13} />
        </button>
      </div>
      <ul className="space-y-1 text-sm">
        {list.items.map((entry) => (
          <li key={entry.id} className="flex items-center gap-2">
            <input type="checkbox" aria-label={t('toggleItem', { name: entry.name })} checked={entry.resolved} onChange={(e) => send(changeItem(task.checklists, list.id, entry.id, { resolved: e.target.checked }))} />
            <input
              aria-label={t('renameItem', { name: entry.name })}
              defaultValue={entry.name}
              maxLength={TASK_CHECKLIST_ITEM_MAX}
              key={entry.name}
              onBlur={(e) => {
                const next = e.target.value.trim();
                if (next && next !== entry.name) send(changeItem(task.checklists, list.id, entry.id, { name: next }));
                else e.target.value = entry.name;
              }}
              className={`no-focus-ring min-w-0 flex-1 bg-transparent outline-none ${entry.resolved ? 'text-muted line-through' : ''}`}
            />
            <button type="button" aria-label={t('deleteItem', { name: entry.name })} onClick={() => send(removeItem(task.checklists, list.id, entry.id))} className="shrink-0 text-muted hover:text-danger">
              <X size={13} />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-1"
        onSubmit={(event) => {
          event.preventDefault();
          const name = item.trim();
          if (!name) return;
          send(addItem(task.checklists, list.id, name));
          setItem('');
        }}
      >
        <input aria-label={t('addItemTo', { name: list.name })} placeholder={t('addItem')} maxLength={TASK_CHECKLIST_ITEM_MAX} value={item} onChange={(e) => setItem(e.target.value)} className="w-full rounded border border-line bg-panel2 px-2 py-1 text-sm" />
      </form>
    </section>
  );
}

export function TaskChecklists({ task, readOnly, save, adding, onAddingChange: setAdding }: TaskChecklistsProps) {
  const t = useTranslations('drawer');
  const [name, setName] = useState('');
  if (readOnly) {
    return (
      <>
        {task.checklists.map((list) => (
          <section key={list.id}>
            <h2 className="mb-1 text-xs uppercase text-muted">{list.name}</h2>
            <ul className="space-y-1 text-sm">
              {list.items.map((entry) => (
                <li key={entry.id} className={entry.resolved ? 'text-muted line-through' : ''}>
                  {entry.name}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </>
    );
  }
  if (task.checklists.length === 0 && !adding) return null;
  return (
    <div className="space-y-3">
      {task.checklists.map((list) => (
        <ChecklistEditor key={list.id} list={list} task={task} save={save} />
      ))}
      {adding ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const value = name.trim();
            if (!value) return;
            save({ checklists: addChecklist(task.checklists, value) });
            setName('');
            setAdding(false);
          }}
        >
          <input
            autoFocus
            aria-label={t('checklistName')}
            placeholder={t('checklistName')}
            maxLength={TASK_CHECKLIST_NAME_MAX}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => !name.trim() && setAdding(false)}
            className="w-full rounded border border-line bg-panel2 px-2 py-1 text-sm"
          />
        </form>
      ) : task.checklists.length === 0 ? null : (
        <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-1 text-xs text-muted hover:text-fg">
          <Plus size={12} />
          {t('addChecklist')}
        </button>
      )}
    </div>
  );
}
