import { GUEST_ALLOWED_PATHS } from './guest-access.constants';

export const guestCanOpen = (pathname: string): boolean => pathname === '/' || GUEST_ALLOWED_PATHS.some((prefix) => pathname.startsWith(prefix));
