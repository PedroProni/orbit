import { AVATAR_STACK_MAX } from './avatar.constants';
import { colorOf, initialsOf } from './avatar.helpers';

export function Avatar({ id, name, size = 22 }: { id: string; name: string; size?: number }) {
  return (
    <span title={name} aria-label={name} className="inline-flex shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2 ring-panel" style={{ width: size, height: size, backgroundColor: colorOf(id) }}>
      {initialsOf(name)}
    </span>
  );
}

export function AvatarStack({ people }: { people: Array<{ id: string; name: string }> }) {
  const shown = people.slice(0, AVATAR_STACK_MAX);
  return (
    <span className="flex -space-x-1.5">
      {shown.map((p) => (
        <Avatar key={p.id} id={p.id} name={p.name} />
      ))}
      {people.length > shown.length ? <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-panel2 text-[10px] ring-2 ring-panel">+{people.length - shown.length}</span> : null}
    </span>
  );
}
