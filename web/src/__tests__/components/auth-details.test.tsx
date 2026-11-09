// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, configure, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { AccessLogin } from '@/components/auth/access-login';
import { AuthCard } from '@/components/auth/auth-card';
import { buildChangePasswordSchema, buildInviteSchema, buildLoginSchema, buildNewPasswordSchema } from '@/components/auth/auth.schema';
import { DevLoginForm } from '@/components/auth/dev-login-form';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { PasswordInput } from '@/components/auth/password-input';
import { PasswordLoginForm } from '@/components/auth/password-login-form';
import { SetPasswordForm } from '@/components/auth/set-password-form';
import { ApiError } from '@/lib/api-client';
import { authService } from '@/services/auth.service';
import { orbitService } from '@/services/orbit.service';

vi.mock('next/link', () => ({ default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => <a href={href} className={className}>{children}</a> }));
vi.mock('@/components/common/locale-switch', () => ({ LocaleSwitch: () => null }));

const TOKEN = 'a'.repeat(43);
const INFO = { kind: 'invite', email: 'ana@example.com', expiresAt: '2026-11-13T10:00:00.000Z' } as const;

const deferred = <T,>() => {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

const buttonNamed = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;

describe('password field', () => {
  afterEach(() => cleanup());

  it('shows and hides what was typed and says which state it is in', () => {
    const { container } = renderWithProviders(<PasswordInput id="campo" aria-label="Campo" />);
    const field = screen.getByLabelText('Campo') as HTMLInputElement;
    expect(field.type).toBe('password');
    const show = buttonNamed('Show password');
    expect(show.getAttribute('aria-pressed')).toBe('false');
    expect(container.querySelector('.lucide-eye-off')).toBeNull();
    fireEvent.click(show);
    expect(field.type).toBe('text');
    const hide = buttonNamed('Hide password');
    expect(hide.getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('.lucide-eye-off')).not.toBeNull();
    fireEvent.click(hide);
    expect(field.type).toBe('password');
  });
});

describe('auth card', () => {
  afterEach(() => cleanup());

  it('draws the subtitle only when there is one', () => {
    const { container } = renderWithProviders(<AuthCard>corpo</AuthCard>);
    expect(container.querySelector('p')).toBeNull();
    cleanup();
    renderWithProviders(<AuthCard subtitle="legenda">corpo</AuthCard>);
    expect(screen.getByText('legenda')).toBeTruthy();
  });
});

describe('password sign in', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => cleanup());

  const submit = () => {
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'uma-senha-longa' } });
    fireEvent.submit(screen.getByLabelText('Email').closest('form') as HTMLFormElement);
  };

  it('starts with no error, blocks a second click and says it is signing in', async () => {
    const pending = deferred<never>();
    vi.spyOn(authService, 'login').mockReturnValue(pending.promise);
    renderWithProviders(<PasswordLoginForm onSignedIn={vi.fn()} />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(buttonNamed('Sign in').disabled).toBe(false);
    submit();
    expect(((await screen.findByRole('button', { name: 'Signing in...' })) as HTMLButtonElement).disabled).toBe(true);
  });

  it('removes the old error while it tries again', async () => {
    const login = vi.spyOn(authService, 'login').mockRejectedValueOnce(new ApiError(401, 'INVALID_CREDENTIALS'));
    renderWithProviders(<PasswordLoginForm onSignedIn={vi.fn()} />);
    submit();
    expect(await screen.findByRole('alert')).toBeTruthy();
    login.mockReturnValue(deferred<never>().promise);
    submit();
    await waitFor(() => expect(login).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
});

describe('forgot password details', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => cleanup());

  const submit = (email = 'ana@example.com') => {
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
    fireEvent.click(buttonNamed('Continue'));
  };

  it('explains the screen, offers the way back and starts with no error', () => {
    renderWithProviders(<ForgotPasswordForm />);
    expect(screen.getByText('Enter your email to recover access.')).toBeTruthy();
    expect(screen.getByText('Back to sign in').getAttribute('href')).toBe('/login');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('refuses a bad address on the screen, without calling the server', async () => {
    const forgot = vi.spyOn(authService, 'forgotPassword').mockResolvedValue({ delivery: 'admin' });
    renderWithProviders(<ForgotPasswordForm />);
    submit('sem-arroba');
    expect(await screen.findByText('Enter a valid email')).toBeTruthy();
    expect(forgot).not.toHaveBeenCalled();
  });

  it('blocks a second click while it waits', async () => {
    vi.spyOn(authService, 'forgotPassword').mockReturnValue(deferred<never>().promise);
    renderWithProviders(<ForgotPasswordForm />);
    submit();
    await waitFor(() => expect(buttonNamed('Continue').disabled).toBe(true));
  });

  it('removes the old error while it tries again, and drops the form and the subtitle at the end', async () => {
    const forgot = vi.spyOn(authService, 'forgotPassword').mockRejectedValueOnce(new ApiError(500, 'x'));
    renderWithProviders(<ForgotPasswordForm />);
    submit();
    expect(await screen.findByRole('alert')).toBeTruthy();
    const pending = deferred<{ delivery: 'admin' }>();
    forgot.mockReturnValue(pending.promise);
    submit();
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    await act(async () => pending.resolve({ delivery: 'admin' }));
    expect(await screen.findByRole('status')).toBeTruthy();
    expect(screen.queryByText('Enter your email to recover access.')).toBeNull();
    expect(screen.getByText('Back to sign in').getAttribute('href')).toBe('/login');
  });
});

describe('set password details', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState(null, '', `/set-password#token=${TOKEN}`);
  });
  afterEach(() => cleanup());

  const fill = (password = 'senha-nova-longa') => {
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: password } });
    fireEvent.change(screen.getByLabelText('Repeat the password'), { target: { value: password } });
    fireEvent.click(buttonNamed('Save password'));
  };

  it('says it is checking and does not show the form until the server answers', async () => {
    const pending = deferred<typeof INFO>();
    vi.spyOn(authService, 'checkLink').mockReturnValue(pending.promise);
    renderWithProviders(<SetPasswordForm />);
    expect(screen.getByRole('status').textContent).toBe('Checking your link...');
    expect(screen.queryByLabelText('New password')).toBeNull();
    await act(async () => pending.resolve(INFO));
    expect(await screen.findByLabelText('New password')).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('checks the link once in strict mode and keeps the token it read', async () => {
    const check = vi.spyOn(authService, 'checkLink').mockResolvedValue(INFO);
    configure({ reactStrictMode: true });
    renderWithProviders(<SetPasswordForm />);
    configure({ reactStrictMode: false });
    expect(await screen.findByLabelText('New password')).toBeTruthy();
    expect(check).toHaveBeenCalledTimes(1);
    expect(check).toHaveBeenCalledWith(TOKEN);
    const save = vi.spyOn(authService, 'setPassword').mockResolvedValue(undefined as never);
    fill();
    await waitFor(() => expect(save).toHaveBeenCalledWith(TOKEN, 'senha-nova-longa'));
  });

  it('ignores an address that carries anything other than the token', async () => {
    window.history.replaceState(null, '', `/set-password#outro=${TOKEN}`);
    const check = vi.spyOn(authService, 'checkLink').mockResolvedValue(INFO);
    renderWithProviders(<SetPasswordForm />);
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(check).not.toHaveBeenCalled();
    expect(screen.getByText('Go to sign in').getAttribute('href')).toBe('/login');
  });

  it('gives password managers the account, read only and out of sight', async () => {
    vi.spyOn(authService, 'checkLink').mockResolvedValue(INFO);
    const { container } = renderWithProviders(<SetPasswordForm />);
    await screen.findByLabelText('New password');
    const account = container.querySelector('input[autocomplete="username"]') as HTMLInputElement;
    expect(account.value).toBe(INFO.email);
    expect(account.readOnly).toBe(true);
    expect(account.hidden).toBe(true);
  });

  it('starts with no error, blocks a second click and removes the old error on the next try', async () => {
    vi.spyOn(authService, 'checkLink').mockResolvedValue(INFO);
    const save = vi.spyOn(authService, 'setPassword').mockRejectedValueOnce(new ApiError(400, 'PASSWORD_EQUALS_EMAIL'));
    renderWithProviders(<SetPasswordForm />);
    await screen.findByLabelText('New password');
    expect(screen.queryByRole('alert')).toBeNull();
    fill();
    expect(await screen.findByRole('alert')).toBeTruthy();
    save.mockReturnValue(deferred<never>().promise);
    fill();
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    await waitFor(() => expect(buttonNamed('Save password').disabled).toBe(true));
  });

  it('goes back to checking and forgets the old error when another link arrives in the same tab', async () => {
    const check = vi.spyOn(authService, 'checkLink').mockResolvedValue(INFO);
    vi.spyOn(authService, 'setPassword').mockRejectedValue(new ApiError(400, 'PASSWORD_EQUALS_EMAIL'));
    renderWithProviders(<SetPasswordForm />);
    await screen.findByLabelText('New password');
    fill();
    expect(await screen.findByRole('alert')).toBeTruthy();
    const pending = deferred<typeof INFO>();
    check.mockReturnValue(pending.promise);
    window.history.replaceState(null, '', `/set-password#token=${'b'.repeat(43)}`);
    await act(async () => {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(screen.getByRole('status').textContent).toBe('Checking your link...');
    await act(async () => pending.resolve(INFO));
    await screen.findByLabelText('New password');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('company account sign in', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => cleanup());

  it('says it is signing in, then hands over', async () => {
    const pending = deferred<never>();
    vi.spyOn(orbitService, 'loginAccess').mockReturnValue(pending.promise);
    renderWithProviders(<AccessLogin onSignedIn={vi.fn()} />);
    expect(screen.getByRole('status').textContent).toContain('Signing in with your company account');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('goes back to signing in when asked to try again', async () => {
    const login = vi.spyOn(orbitService, 'loginAccess').mockRejectedValueOnce(new ApiError(403, 'x'));
    const signedIn = vi.fn();
    renderWithProviders(<AccessLogin onSignedIn={signedIn} />);
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
    const pending = deferred<never>();
    login.mockReturnValue(pending.promise);
    fireEvent.click(buttonNamed('Try again'));
    expect(await screen.findByRole('status')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(signedIn).not.toHaveBeenCalled();
  });
});

describe('development sign in', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => cleanup());

  const submit = (email: string, name: string) => {
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: name } });
    fireEvent.click(buttonNamed('Sign in (development)'));
  };

  it('says it is only for development and refuses empty fields', async () => {
    const dev = vi.spyOn(orbitService, 'devLogin').mockResolvedValue({} as never);
    renderWithProviders(<DevLoginForm onSignedIn={vi.fn()} />);
    expect(screen.getByText('Development sign-in, not available in production builds')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    submit('sem-arroba', '');
    expect(await screen.findByText('Enter a valid email')).toBeTruthy();
    expect(screen.getByText('Name is required')).toBeTruthy();
    expect(dev).not.toHaveBeenCalled();
  });

  it('signs in only after the server accepts', async () => {
    const pending = deferred<never>();
    const dev = vi.spyOn(orbitService, 'devLogin').mockReturnValue(pending.promise);
    const signedIn = vi.fn();
    renderWithProviders(<DevLoginForm onSignedIn={signedIn} />);
    submit('ana@example.com', 'Ana');
    await waitFor(() => expect(dev).toHaveBeenCalledWith('ana@example.com', 'Ana'));
    expect(signedIn).not.toHaveBeenCalled();
    await act(async () => pending.resolve(undefined as never));
    await waitFor(() => expect(signedIn).toHaveBeenCalledTimes(1));
  });

  it('shows the refusal, stays out and removes it on the next try', async () => {
    const dev = vi.spyOn(orbitService, 'devLogin').mockRejectedValueOnce(new ApiError(403, 'x'));
    const signedIn = vi.fn();
    renderWithProviders(<DevLoginForm onSignedIn={signedIn} />);
    submit('ana@example.com', 'Ana');
    expect((await screen.findByRole('alert')).textContent).toBe('Access denied for this account');
    expect(signedIn).not.toHaveBeenCalled();
    dev.mockReturnValue(deferred<never>().promise);
    submit('ana@example.com', 'Ana');
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
});

describe('form limits', () => {
  it('accepts one character as a typed password, and refuses over the limit', () => {
    const schema = buildLoginSchema('email', 'obrigatória');
    expect(schema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true);
    expect(schema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false);
    expect(schema.safeParse({ email: 'a@b.co', password: 'x'.repeat(200) }).success).toBe(true);
    expect(schema.safeParse({ email: 'a@b.co', password: 'x'.repeat(201) }).success).toBe(false);
  });

  it('holds a new password between 10 and 200 characters', () => {
    const schema = buildNewPasswordSchema('curta', 'longa', 'diferente');
    const check = (password: string) => schema.safeParse({ password, confirm: password }).success;
    expect(check('x'.repeat(9))).toBe(false);
    expect(check('x'.repeat(10))).toBe(true);
    expect(check('x'.repeat(200))).toBe(true);
    expect(check('x'.repeat(201))).toBe(false);
  });

  it('asks for the current password, with no minimum beyond typing it', () => {
    const schema = buildChangePasswordSchema('obrigatória', 'curta', 'longa', 'diferente');
    const check = (currentPassword: string) => schema.safeParse({ currentPassword, password: 'x'.repeat(10), confirm: 'x'.repeat(10) }).success;
    expect(check('')).toBe(false);
    expect(check('y')).toBe(true);
  });

  it('holds a name between 1 and 120 characters', () => {
    const schema = buildInviteSchema('email', 'nome');
    const check = (name: string) => schema.safeParse({ email: 'a@b.co', name, allowExternalEmail: false }).success;
    expect(check(' ')).toBe(false);
    expect(check('a')).toBe(true);
    expect(check('x'.repeat(120))).toBe(true);
    expect(check('x'.repeat(121))).toBe(false);
  });
});
