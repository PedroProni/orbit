import { TooltipProps } from './tooltip.types';

export function Tooltip({ label, children, side = 'top', align = 'center' }: TooltipProps) {
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span role="tooltip" className={`pointer-events-none absolute z-50 whitespace-nowrap rounded bg-black px-2 py-1 text-[11px] text-white opacity-0 shadow transition-opacity delay-300 duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100 ${side === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} ${align === 'start' ? 'left-0' : 'left-1/2 -translate-x-1/2'}`}>
        {label}
      </span>
    </span>
  );
}
