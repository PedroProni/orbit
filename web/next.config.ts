import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const apiUrl = process.env.ORBIT_API_URL ?? 'http://localhost:56510';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [{ source: '/backend/:path*', destination: `${apiUrl}/:path*` }];
  },
};

export default withNextIntl(nextConfig);
