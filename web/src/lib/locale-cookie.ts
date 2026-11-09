import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from '@/config/app.constants';

export function writeLocaleCookie(locale: string): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}`;
}
