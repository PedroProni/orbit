import { appendFileSync } from 'node:fs';
import { GetOnlyFetch } from './get-only-fetch.type';

export const describeRequest = (url: string): string => {
  const parsed = new URL(url);
  return parsed.hostname.endsWith('clickup-attachments.com') ? `${parsed.hostname}/(arquivo)` : `${parsed.hostname}${parsed.pathname}`;
};

export const createGetOnlyFetch = (logFile?: string, transport: typeof fetch = fetch): GetOnlyFetch => {
  return async (url, init) => {
    const method = String(init?.method ?? 'GET').toUpperCase();
    if (method !== 'GET') {
      if (logFile) appendFileSync(logFile, `${new Date().toISOString()} REFUSED ${method} ${describeRequest(url)}\n`);
      throw new Error(`Refusing ${method}: the ClickUp copy only reads`);
    }
    const response = await transport(url, { ...init, method: 'GET' });
    if (logFile) appendFileSync(logFile, `${new Date().toISOString()} GET ${describeRequest(url)} ${response.status}\n`);
    return response;
  };
};
