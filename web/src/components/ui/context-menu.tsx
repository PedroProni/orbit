'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEscapeLayer } from '@/hooks/use-escape-layer';
import { CONTEXT_MENU_ITEM_HEIGHT_PX, CONTEXT_MENU_PADDING_PX, CONTEXT_MENU_WIDTH_PX } from './context-menu.constants';
import { ContextMenuProps } from './context-menu.types';
import { MenuList } from './menu-list';

export function ContextMenu({ items, children, className, as: Tag = 'div', motionKey }: ContextMenuProps) {
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const close = () => setPoint(null);
  useEscapeLayer(point !== null, close);
  useEffect(() => {
    if (!point) return;
    const dismiss = () => setPoint(null);
    window.addEventListener('click', dismiss);
    window.addEventListener('scroll', dismiss, true);
    return () => {
      window.removeEventListener('click', dismiss);
      window.removeEventListener('scroll', dismiss, true);
    };
  }, [point]);
  return (
    <Tag
      className={className}
      data-motion-key={motionKey}
      onContextMenu={(e) => {
        e.preventDefault();
        setPoint({ x: Math.min(e.clientX, window.innerWidth - CONTEXT_MENU_WIDTH_PX), y: Math.min(e.clientY, window.innerHeight - items.length * CONTEXT_MENU_ITEM_HEIGHT_PX - CONTEXT_MENU_PADDING_PX) });
      }}
    >
      {children}
      {point
        ? createPortal(
            <div style={{ left: point.x, top: point.y }} className="anim-pop-in fixed z-[90] rounded-lg border border-linestrong bg-raised shadow-floating">
              <MenuList items={items} onClose={close} />
            </div>,
            document.body,
          )
        : null}
    </Tag>
  );
}
