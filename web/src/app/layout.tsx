import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { APP_NAME } from '@/config/app.constants';
import { Providers } from '@/components/common/providers';
import { headingFont, textFont } from '@/config/fonts';
import { DARK_CLASS, THEME_INIT_SCRIPT } from '@/config/theme.constants';
import './globals.css';

export const metadata: Metadata = { title: APP_NAME };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} className={`${DARK_CLASS} ${headingFont.variable} ${textFont.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
