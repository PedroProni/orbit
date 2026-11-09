import { CLICKUP_BASE_URL, CLICKUP_V3_BASE_URL, MAX_REQUESTS_PER_MINUTE, MAX_REQUEST_ATTEMPTS, MIN_DOWNLOAD_INTERVAL_MS, MIN_REQUEST_INTERVAL_MS, RETRY_429_WAIT_MS, RETRY_TRANSIENT_WAIT_MS } from './import.constant';
import { createGetOnlyFetch } from './get-only-fetch';
import { GetOnlyFetch } from './get-only-fetch.type';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class ClickupReadonlyClient {
  private readonly sent: number[] = [];
  private requests = 0;
  private downloads = 0;
  private maxPerMinute = 0;
  private lastDownload = 0;

  constructor(
    private readonly token: string,
    private readonly fetcher: GetOnlyFetch = createGetOnlyFetch(),
  ) {}

  getRequestCount(): number {
    return this.requests;
  }

  getDownloadCount(): number {
    return this.downloads;
  }

  getMaxPerMinute(): number {
    return this.maxPerMinute;
  }

  get<T = any>(path: string): Promise<T> {
    return this.read<T>(`${CLICKUP_BASE_URL}${path}`, path);
  }

  getV3<T = any>(path: string): Promise<T> {
    return this.read<T>(`${CLICKUP_V3_BASE_URL}${path}`, path);
  }

  async download(url: string): Promise<Buffer> {
    for (let attempt = 0; attempt < MAX_REQUEST_ATTEMPTS; attempt++) {
      const wait = MIN_DOWNLOAD_INTERVAL_MS - (Date.now() - this.lastDownload);
      if (wait > 0) await sleep(wait);
      this.lastDownload = Date.now();
      this.downloads++;
      const response = await this.fetcher(url, { method: 'GET', redirect: 'manual' }).catch(() => null);
      if (response?.ok) return Buffer.from(await response.arrayBuffer());
      if (response && response.status !== 429 && response.status < 500) throw new Error(`file answered ${response.status}`);
      await sleep(RETRY_TRANSIENT_WAIT_MS);
    }
    throw new Error('file download kept failing');
  }

  private async read<T>(url: string, path: string): Promise<T> {
    const label = path.split('?')[0];
    for (let attempt = 0; attempt < MAX_REQUEST_ATTEMPTS; attempt++) {
      await this.throttle();
      const response = await this.fetcher(url, { method: 'GET', headers: { Authorization: this.token, Accept: 'application/json' } }).catch(() => null);
      if (response?.ok) return (await response.json()) as T;
      if (response?.status === 429) {
        await sleep(RETRY_429_WAIT_MS);
        continue;
      }
      if (response && response.status < 500) throw new Error(`ClickUp ${response.status} for ${label}`);
      await sleep(RETRY_TRANSIENT_WAIT_MS);
    }
    throw new Error(`ClickUp kept failing for ${label}`);
  }

  private async throttle(): Promise<void> {
    const last = this.sent[this.sent.length - 1];
    if (last !== undefined) {
      const wait = MIN_REQUEST_INTERVAL_MS - (Date.now() - last);
      if (wait > 0) await sleep(wait);
    }
    while (this.sent.length >= MAX_REQUESTS_PER_MINUTE && Date.now() - this.sent[this.sent.length - MAX_REQUESTS_PER_MINUTE] < 60000) await sleep(500);
    const now = Date.now();
    this.sent.push(now);
    this.requests++;
    const inWindow = this.sent.filter((t) => now - t < 60000).length;
    this.maxPerMinute = Math.max(this.maxPerMinute, inWindow);
    if (this.sent.length > 500) this.sent.splice(0, this.sent.length - 200);
  }
}
