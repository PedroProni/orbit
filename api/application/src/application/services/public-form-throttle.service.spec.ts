import { PublicFormThrottleService } from './public-form-throttle.service';
import { PUBLIC_FORM_IP_LIMIT, PUBLIC_FORM_IP_WINDOW_MS, PUBLIC_FORM_LIMIT, PUBLIC_FORM_THROTTLE_SWEEP_SIZE, PUBLIC_FORM_WINDOW_MS } from '@domain/constants/public-form.constant';

describe('PublicFormThrottleService', () => {
  const t0 = 1_000_000;
  const reserveMany = (service: PublicFormThrottleService, times: number, formId: string, ip: (i: number) => string | null, now: number) =>
    Array.from({ length: times }, (_, i) => service.reserve(formId, ip(i), now));

  it('lets an address submit a form up to the per-minute limit and refuses the next one', () => {
    const service = new PublicFormThrottleService();
    expect(reserveMany(service, PUBLIC_FORM_IP_LIMIT, 'f1', () => '10.0.0.1', t0).every(Boolean)).toBe(true);
    expect(service.reserve('f1', '10.0.0.1', t0)).toBe(false);
  });

  it('keeps the address limit per form and per address', () => {
    const service = new PublicFormThrottleService();
    reserveMany(service, PUBLIC_FORM_IP_LIMIT, 'f1', () => '10.0.0.1', t0);
    expect(service.reserve('f2', '10.0.0.1', t0)).toBe(true);
    expect(service.reserve('f1', '10.0.0.2', t0)).toBe(true);
  });

  it('groups submits without a known address under one bucket', () => {
    const service = new PublicFormThrottleService();
    reserveMany(service, PUBLIC_FORM_IP_LIMIT, 'f1', () => null, t0);
    expect(service.reserve('f1', null, t0)).toBe(false);
  });

  it('opens the address again only when the minute window ends', () => {
    const service = new PublicFormThrottleService();
    reserveMany(service, PUBLIC_FORM_IP_LIMIT, 'f1', () => '10.0.0.1', t0);
    expect(service.reserve('f1', '10.0.0.1', t0 + PUBLIC_FORM_IP_WINDOW_MS - 1)).toBe(false);
    expect(service.reserve('f1', '10.0.0.1', t0 + PUBLIC_FORM_IP_WINDOW_MS)).toBe(true);
  });

  it('caps a form across every address per hour and opens it when the hour ends', () => {
    const service = new PublicFormThrottleService();
    expect(reserveMany(service, PUBLIC_FORM_LIMIT, 'f1', i => `10.1.${Math.floor(i / 250)}.${i % 250}`, t0).every(Boolean)).toBe(true);
    expect(service.reserve('f1', '10.9.9.9', t0)).toBe(false);
    expect(service.reserve('f2', '10.9.9.9', t0)).toBe(true);
    expect(service.reserve('f1', '10.9.9.9', t0 + PUBLIC_FORM_WINDOW_MS)).toBe(true);
  });

  it('does not count a refused submit toward the form limit', () => {
    const service = new PublicFormThrottleService();
    reserveMany(service, PUBLIC_FORM_IP_LIMIT, 'f1', () => '10.0.0.1', t0);
    reserveMany(service, 50, 'f1', () => '10.0.0.1', t0);
    expect(reserveMany(service, PUBLIC_FORM_LIMIT - PUBLIC_FORM_IP_LIMIT, 'f1', i => `10.2.${Math.floor(i / 250)}.${i % 250}`, t0).every(Boolean)).toBe(true);
    expect(service.reserve('f1', '10.3.0.1', t0)).toBe(false);
  });

  it('drops expired windows once the map is full and keeps the live ones', () => {
    const service = new PublicFormThrottleService();
    const byForm = (service as unknown as { byForm: Map<string, unknown> }).byForm;
    for (let i = 0; i < PUBLIC_FORM_THROTTLE_SWEEP_SIZE - 1; i += 1) service.reserve(`old-${i}`, '10.0.0.1', t0);
    reserveMany(service, PUBLIC_FORM_IP_LIMIT, 'live', () => '10.0.0.2', t0 + PUBLIC_FORM_WINDOW_MS - 1);
    expect(byForm.size).toBe(PUBLIC_FORM_THROTTLE_SWEEP_SIZE);
    expect(service.reserve('new', '10.0.0.3', t0 + PUBLIC_FORM_WINDOW_MS)).toBe(true);
    expect(byForm.size).toBe(2);
    expect(service.reserve('live', '10.0.0.2', t0 + PUBLIC_FORM_WINDOW_MS)).toBe(false);
  });
});
