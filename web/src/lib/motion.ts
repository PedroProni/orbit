export const prefersReducedMotion = (): boolean => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

export const motionEnabled = (): boolean => typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function' && !prefersReducedMotion();
