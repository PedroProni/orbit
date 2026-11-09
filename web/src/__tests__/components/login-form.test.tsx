// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { renderWithProviders } from '../helpers/render-with-providers';
import { ApiError } from '@/lib/api-client';
import { useSessionStore } from '@/stores/session.store';

const mocks = vi.hoisted(() => ({ replace: vi.fn(), loginAccess: vi.fn(), devLogin: vi.fn(), login: vi.fn(), flags: { access: false, dev: false } }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock('next/link', () => ({ default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => <a href={href} className={className}>{children}</a> }));
vi.mock('@/services/orbit.service', () => ({ orbitService: { loginAccess: mocks.loginAccess, devLogin: mocks.devLogin } }));
vi.mock('@/services/auth.service', () => ({ authService: { login: mocks.login } }));
vi.mock('@/components/common/locale-switch', () => ({ LocaleSwitch: () => null }));
vi.mock('@/config/app.constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/config/app.constants')>();
  return {
    ...actual,
    get ACCESS_LOGIN_ENABLED() {
      return mocks.flags.access;
    },
    get DEV_LOGIN_ENABLED() {
      return mocks.flags.dev;
    },
  };
});

const { LoginForm } = await import('@/components/shell/login-form');

const fill = () => {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ana@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'uma-senha-longa' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
};

describe('LoginForm', () => {
  beforeEach(() => {
    mocks.flags.access = false;
    mocks.flags.dev = false;
    mocks.replace.mockReset();
    mocks.loginAccess.mockReset();
    mocks.devLogin.mockReset();
    mocks.login.mockReset();
    useSessionStore.setState({ authenticated: false, hydrated: true });
  });

  afterEach(() => cleanup());

  it('shows the password form by default, without the development form', () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Sign in (development)' })).toBeNull();
    expect(mocks.loginAccess).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Forgot your password?' }).getAttribute('href')).toBe('/forgot-password');
  });

  it('does not leave the page before the session check ends', async () => {
    useSessionStore.setState({ authenticated: true, hydrated: false });
    renderWithProviders(<LoginForm />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy());
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('opens the session after the development sign in, when that build allows it', async () => {
    mocks.flags.dev = true;
    mocks.devLogin.mockResolvedValue({});
    renderWithProviders(<LoginForm />);
    fireEvent.change(screen.getAllByLabelText('Email').at(-1) as HTMLElement, { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ana' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in (development)' }));
    await waitFor(() => expect(useSessionStore.getState().authenticated).toBe(true));
    expect(mocks.replace).toHaveBeenCalledWith('/');
  });

  it('opens the session after the company account sign in', async () => {
    mocks.flags.access = true;
    mocks.loginAccess.mockResolvedValue({});
    renderWithProviders(<LoginForm />);
    await waitFor(() => expect(useSessionStore.getState().authenticated).toBe(true));
    expect(screen.queryByRole('button', { name: 'Sign in' })).toBeNull();
    expect(mocks.replace).toHaveBeenCalledWith('/');
  });

  it('signs in and goes home', async () => {
    mocks.login.mockResolvedValue({ user: { id: 'u1' } });
    renderWithProviders(<LoginForm />);
    fill();
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/'));
    expect(mocks.login).toHaveBeenCalledWith('ana@example.com', 'uma-senha-longa');
    expect(useSessionStore.getState().authenticated).toBe(true);
  });

  it('drops what the previous person left in the cache when signing in', async () => {
    const clear = vi.spyOn(QueryClient.prototype, 'clear');
    mocks.login.mockResolvedValue({ user: { id: 'u1' } });
    renderWithProviders(<LoginForm />);
    fill();
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/'));
    expect(clear).toHaveBeenCalledTimes(1);
    clear.mockRestore();
  });

  it('says the same thing whatever is wrong with the credentials', async () => {
    mocks.login.mockRejectedValue(new ApiError(401, 'INVALID_CREDENTIALS'));
    renderWithProviders(<LoginForm />);
    fill();
    expect((await screen.findByRole('alert')).textContent).toBe('Email or password is incorrect.');
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(useSessionStore.getState().authenticated).toBe(false);
  });

  it('explains the brute force limit in plain words, in both languages', async () => {
    mocks.login.mockRejectedValue(new ApiError(429, 'TOO_MANY_ATTEMPTS'));
    renderWithProviders(<LoginForm />, 'pt');
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'uma-senha-longa' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Muitas tentativas');
  });

  it('does not call the server with an invalid form', async () => {
    renderWithProviders(<LoginForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Enter a valid email')).toBeTruthy();
    expect(screen.getByText('Enter your password')).toBeTruthy();
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it('shows and hides the password', () => {
    renderWithProviders(<LoginForm />);
    const input = screen.getByLabelText('Password') as HTMLInputElement;
    expect(input.type).toBe('password');
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input.type).toBe('text');
    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input.type).toBe('password');
  });

  it('sends a signed in person home', async () => {
    useSessionStore.setState({ authenticated: true, hydrated: true });
    renderWithProviders(<LoginForm />);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/'));
  });

  it('keeps the company sign-in automatic when that build asks for it', async () => {
    mocks.flags.access = true;
    mocks.loginAccess.mockRejectedValueOnce(new Error('403')).mockResolvedValueOnce({ accessToken: 'ignored' });
    renderWithProviders(<LoginForm />, 'pt');
    expect((await screen.findByRole('alert')).textContent).toBe('Acesso negado para esta conta');
    expect(screen.queryByLabelText('Senha')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/'));
    expect(mocks.loginAccess).toHaveBeenCalledTimes(2);
  });

  it('offers the development form only in a build that enables it', () => {
    mocks.flags.dev = true;
    renderWithProviders(<LoginForm />);
    expect(screen.getByRole('button', { name: 'Sign in (development)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
  });
});
