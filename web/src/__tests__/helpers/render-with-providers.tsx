import { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { IntlError, IntlErrorCode, NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CATALOGS } from './render-with-providers.constants';

const failOnMissingMessage = (error: IntlError) => {
  if (error.code === IntlErrorCode.MISSING_MESSAGE) throw error;
};

export function renderWithProviders(ui: ReactElement, locale: keyof typeof CATALOGS = 'en') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const Providers = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale={locale} messages={CATALOGS[locale]} onError={failOnMissingMessage}>
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
  return render(ui, { wrapper: Providers });
}
