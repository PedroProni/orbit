import { DialogVariant } from './dialog.types';

export const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
export const DIALOG_CONTAINER_CLASS: Record<DialogVariant, string> = {
  center: 'z-[80] flex items-start justify-center px-4 pt-[15vh]',
  drawer: 'z-50 flex justify-end',
};
export const DIALOG_ENTER_CLASS: Record<DialogVariant, string> = { center: 'anim-pop-in', drawer: 'anim-slide-in-right' };
export const DIALOG_EXIT_CLASS: Record<DialogVariant, string> = { center: 'anim-pop-out', drawer: 'anim-slide-out-right' };
