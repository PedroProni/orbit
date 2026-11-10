import { UserRole } from '@domain/enums/user.enums';

export const PUBLIC_FORM_IP_LIMIT = 5;
export const PUBLIC_FORM_IP_WINDOW_MS = 60 * 1000;
export const PUBLIC_FORM_LIMIT = 200;
export const PUBLIC_FORM_WINDOW_MS = 60 * 60 * 1000;
export const PUBLIC_FORM_THROTTLE_SWEEP_SIZE = 10000;
export const PUBLIC_FORM_KEY_BYTES = 18;
export const PUBLIC_FORM_ANSWER_MAX_LENGTH = 5000;
export const PUBLIC_FORM_HONEYPOT_MAX_LENGTH = 500;
export const PUBLIC_FORM_TITLE_MAX_LENGTH = 300;
export const FORM_FIELD_ID_MAX_LENGTH = 64;
export const FORM_PAUSED_CREATOR_ROLES: readonly UserRole[] = [UserRole.VIEWER, UserRole.GUEST];
