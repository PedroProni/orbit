// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { SetPasswordForm } from '@/components/auth/set-password-form';
import { ApiError } from '@/lib/api-client';
import { authService } from '@/services/auth.service';

vi.mock('next/link', () => ({ default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => <a href={href} className={className}>{children}</a> }));
vi.mock('@/components/common/locale-switch', () => ({ LocaleSwitch: () => null }));

const TOKEN = 'a'.repeat(43);
const INFO = { kind: 'invite', email: 'ana@example.com', expiresAt: '2026-11-13T10:00:00.000Z' } as const;

const fillPasswords = (password: string, confirm = password) => {
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: password } });
  fireEvent.change(screen.getByLabelText('Repeat the password'), { target: { value: confirm } });
  fireEvent.click(screen.getByRole('button', { name: 'Save password' }));
};

describe('forgot password', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => cleanup());

  it('sends the person to an admin while there is no email provider', async () => {
    const forgot = vi.spyOn(authService, 'forgotPassword').mockResolvedValue({ delivery: 'admin' });
    renderWithProviders(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ana@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect((await screen.findByRole('status')).textContent).toContain('Ask an owner or administrator');
    expect(forgot).toHaveBeenCalledWith('ana@example.com');
  });

  it('gives a neutral answer when email exists', async () => {
    vi.spyOn(authService, 'forgotPassword').mockResolvedValue({ delivery: 'email' });
    renderWithProviders(<ForgotPasswordForm />, 'pt');
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect((await screen.findByRole('status')).textContent).toContain('Se este e-mail tiver uma conta');
  });

  it('shows the limit when the server refuses', async () => {
    vi.spyOn(authService, 'forgotPassword').mockRejectedValue(new ApiError(429, 'TOO_MANY_ATTEMPTS'));
    renderWithProviders(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ana@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Too many attempts');
  });

  it('never repeats what the server said about an account', async () => {
    vi.spyOn(authService, 'forgotPassword').mockRejectedValue(new ApiError(500, 'Nenhuma conta para ana@example.com'));
    renderWithProviders(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ana@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Something went wrong. Try again in a moment.');
  });
});

describe('set password', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState(null, '', `/set-password#token=${TOKEN}`);
  });
  afterEach(() => cleanup());

  it('removes the token from the address and shows who the link is for', async () => {
    const check = vi.spyOn(authService, 'checkLink').mockResolvedValue(INFO);
    renderWithProviders(<SetPasswordForm />);
    expect(await screen.findByText('ana@example.com')).toBeTruthy();
    expect(check).toHaveBeenCalledWith(TOKEN);
    expect(window.location.hash).toBe('');
    expect(window.location.href).not.toContain(TOKEN);
    expect(screen.getByText('Welcome to Orbit. Create your password to finish your account.')).toBeTruthy();
  });

  it('uses the reset wording for a reset link', async () => {
    vi.spyOn(authService, 'checkLink').mockResolvedValue({ ...INFO, kind: 'reset' });
    renderWithProviders(<SetPasswordForm />, 'pt');
    expect(await screen.findByText('Escolha uma nova senha para sua conta.')).toBeTruthy();
  });

  it('checks a new link pasted in the same tab, where the browser does not reload', async () => {
    const check = vi.spyOn(authService, 'checkLink').mockRejectedValueOnce(new ApiError(410, 'INVALID_LINK')).mockResolvedValueOnce(INFO);
    renderWithProviders(<SetPasswordForm />);
    await screen.findByRole('alert');
    window.location.hash = '#token=novo-link';
    expect(await screen.findByText('ana@example.com')).toBeTruthy();
    expect(check).toHaveBeenLastCalledWith('novo-link');
    expect(window.location.hash).toBe('');
  });

  it('refuses an address with no token without calling the server', async () => {
    window.history.replaceState(null, '', '/set-password');
    const check = vi.spyOn(authService, 'checkLink');
    renderWithProviders(<SetPasswordForm />);
    expect((await screen.findByRole('alert')).textContent).toContain('not valid anymore');
    expect(check).not.toHaveBeenCalled();
  });

  it('refuses an expired or used link', async () => {
    vi.spyOn(authService, 'checkLink').mockRejectedValue(new ApiError(410, 'INVALID_LINK'));
    renderWithProviders(<SetPasswordForm />);
    expect((await screen.findByRole('alert')).textContent).toContain('not valid anymore');
    expect(screen.queryByLabelText('New password')).toBeNull();
  });

  it('saves the password and offers the sign in', async () => {
    vi.spyOn(authService, 'checkLink').mockResolvedValue(INFO);
    const save = vi.spyOn(authService, 'setPassword').mockResolvedValue(undefined);
    renderWithProviders(<SetPasswordForm />);
    await screen.findByText('ana@example.com');
    fillPasswords('uma-senha-longa');
    expect((await screen.findByRole('status')).textContent).toContain('Your password is saved');
    expect(save).toHaveBeenCalledWith(TOKEN, 'uma-senha-longa');
    expect(screen.getByRole('link', { name: 'Go to sign in' }).getAttribute('href')).toBe('/login');
  });

  it('checks size and match before calling the server', async () => {
    vi.spyOn(authService, 'checkLink').mockResolvedValue(INFO);
    const save = vi.spyOn(authService, 'setPassword');
    renderWithProviders(<SetPasswordForm />);
    await screen.findByText('ana@example.com');
    fillPasswords('curta');
    expect(await screen.findByText('Use at least 10 characters.')).toBeTruthy();
    fillPasswords('uma-senha-longa', 'outra-senha-longa');
    expect(await screen.findByText('The passwords are different.')).toBeTruthy();
    expect(save).not.toHaveBeenCalled();
  });

  it('shows the rule the server refused and keeps the form', async () => {
    vi.spyOn(authService, 'checkLink').mockResolvedValue(INFO);
    vi.spyOn(authService, 'setPassword').mockRejectedValue(new ApiError(400, 'PASSWORD_EQUALS_EMAIL'));
    renderWithProviders(<SetPasswordForm />);
    await screen.findByText('ana@example.com');
    fillPasswords('ana@example.com');
    expect((await screen.findByRole('alert')).textContent).toBe('Your password cannot be your email.');
    expect(screen.getByLabelText('New password')).toBeTruthy();
  });

  it('goes to the invalid state when the link dies between opening and saving', async () => {
    vi.spyOn(authService, 'checkLink').mockResolvedValue(INFO);
    vi.spyOn(authService, 'setPassword').mockRejectedValue(new ApiError(410, 'INVALID_LINK'));
    renderWithProviders(<SetPasswordForm />);
    await screen.findByText('ana@example.com');
    fillPasswords('uma-senha-longa');
    await waitFor(() => expect(screen.queryByLabelText('New password')).toBeNull());
    expect(screen.getByRole('alert').textContent).toContain('not valid anymore');
  });
});
