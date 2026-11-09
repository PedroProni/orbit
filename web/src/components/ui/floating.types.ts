export type FloatingAlign = 'start' | 'end';

export interface FloatingOptions {
  align?: FloatingAlign;
  matchWidth?: boolean;
}

export interface FloatingBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface FloatingPosition {
  left: number;
  top: number;
  above: boolean;
}
