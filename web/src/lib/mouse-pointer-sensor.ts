import type { PointerEvent } from 'react';
import { PointerSensor, PointerSensorOptions } from '@dnd-kit/core';

export class MousePointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: (event: PointerEvent, options: PointerSensorOptions) => event.nativeEvent.pointerType !== 'touch' && PointerSensor.activators[0].handler(event, options),
    },
  ];
}
