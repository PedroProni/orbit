import { Injectable } from '@nestjs/common';
import { PUBLIC_FORM_IP_LIMIT, PUBLIC_FORM_IP_WINDOW_MS, PUBLIC_FORM_LIMIT, PUBLIC_FORM_THROTTLE_SWEEP_SIZE, PUBLIC_FORM_WINDOW_MS } from '@domain/constants/public-form.constant';
import { ThrottleWindow } from '@domain/types/throttle-window.type';

@Injectable()
export class PublicFormThrottleService {
  private readonly byAddress = new Map<string, ThrottleWindow>();
  private readonly byForm = new Map<string, ThrottleWindow>();

  reserve(formId: string, ip: string | null, now: number = Date.now()): boolean {
    const address = PublicFormThrottleService.current(this.byAddress, `${formId}:${ip ?? 'unknown'}`, PUBLIC_FORM_IP_WINDOW_MS, now);
    const form = PublicFormThrottleService.current(this.byForm, formId, PUBLIC_FORM_WINDOW_MS, now);
    if (address.count >= PUBLIC_FORM_IP_LIMIT || form.count >= PUBLIC_FORM_LIMIT) return false;
    address.count += 1;
    form.count += 1;
    return true;
  }

  private static current(windows: Map<string, ThrottleWindow>, key: string, windowMs: number, now: number): ThrottleWindow {
    const existing = windows.get(key);
    if (existing && existing.resetAt > now) return existing;
    if (windows.size >= PUBLIC_FORM_THROTTLE_SWEEP_SIZE) for (const [stale, window] of windows) if (window.resetAt <= now) windows.delete(stale);
    const fresh: ThrottleWindow = { count: 0, resetAt: now + windowMs };
    windows.set(key, fresh);
    return fresh;
  }
}
