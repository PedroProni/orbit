import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE } from '@/config/app.constants';

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookie = store.get(LOCALE_COOKIE)?.value ?? DEFAULT_LOCALE;
  const locale = (LOCALES as readonly string[]).includes(cookie) ? cookie : DEFAULT_LOCALE;
  return { locale, messages: (await import(`../../messages/${locale}.json`)).default };
});
