// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { PublicFormPage } from '@/components/public-form/public-form-page';
import { ApiError } from '@/lib/api-client';
import { formService } from '@/services/form.service';
import { PublicFormDefinition } from '@/services/form.types';

vi.mock('next/navigation', () => ({ usePathname: () => '/f/chave-publica', useParams: () => ({ key: 'chave-publica' }), useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));

const DEFINITION: PublicFormDefinition = {
  name: 'Fale com o time',
  fields: [
    { id: 'c1', label: 'Assunto', required: true },
    { id: 'c2', label: 'Detalhes', required: false },
  ],
};

const setup = async () => {
  const load = vi.spyOn(formService, 'publicDefinition').mockResolvedValue(DEFINITION);
  renderWithProviders(<PublicFormPage />);
  await screen.findByText('Fale com o time');
  return load;
};

const fill = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const send = () => fireEvent.click(screen.getByRole('button', { name: 'Send' }));

describe('public form page', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => cleanup());

  it('loads the form by the key in the link and marks required fields', async () => {
    const load = await setup();
    expect(load).toHaveBeenCalledWith('chave-publica');
    expect(screen.getByLabelText('Assunto (required)').getAttribute('aria-required')).toBe('true');
    expect(screen.getByLabelText('Detalhes').getAttribute('aria-required')).toBe('false');
  });

  it('asks for a required answer before sending anything', async () => {
    const submit = vi.spyOn(formService, 'submit').mockResolvedValue({ received: true });
    await setup();
    fill('Assunto (required)', '   ');
    send();
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Fill in "Assunto".');
    expect(submit).not.toHaveBeenCalled();
  });

  it('drops the previous error as soon as the person changes an answer', async () => {
    vi.spyOn(formService, 'submit').mockResolvedValue({ received: true });
    await setup();
    send();
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Fill in "Assunto".');
    fill('Assunto (required)', 'Acesso ao painel');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('sends only filled answers with an empty trap field and thanks the person', async () => {
    const submit = vi.spyOn(formService, 'submit').mockResolvedValue({ received: true });
    await setup();
    fill('Assunto (required)', 'Acesso ao painel');
    send();
    await waitFor(() => expect(submit).toHaveBeenCalledWith('chave-publica', { answers: { c1: 'Acesso ao painel' }, website: '' }));
    expect(await screen.findByText('Thanks, we received your answer.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Send another answer' }));
    expect((screen.getByLabelText('Assunto (required)') as HTMLTextAreaElement).value).toBe('');
  });

  it('keeps the trap field out of reach and passes what a bot typed in it to the server', async () => {
    const submit = vi.spyOn(formService, 'submit').mockResolvedValue({ received: true });
    await setup();
    const trap = document.getElementById('public-form-website') as HTMLInputElement;
    expect(trap.tabIndex).toBe(-1);
    expect(trap.closest('[aria-hidden="true"]')).not.toBeNull();
    fill('Assunto (required)', 'Oferta');
    fireEvent.change(trap, { target: { value: 'http://spam.example' } });
    send();
    await waitFor(() => expect(submit).toHaveBeenCalledWith('chave-publica', { answers: { c1: 'Oferta' }, website: 'http://spam.example' }));
  });

  it('explains the limit when the server answers 429 and keeps the answers', async () => {
    vi.spyOn(formService, 'submit').mockRejectedValue(new ApiError(429, 'Too many submissions, try again later'));
    await setup();
    fill('Assunto (required)', 'Mais um');
    send();
    expect(await screen.findByText('Too many answers were sent from here. Try again in a few minutes.')).toBeTruthy();
    expect((screen.getByLabelText('Assunto (required)') as HTMLTextAreaElement).value).toBe('Mais um');
  });

  it('shows the form as unavailable when it closes while the person is answering', async () => {
    vi.spyOn(formService, 'submit').mockRejectedValue(new ApiError(404, 'Form not found'));
    await setup();
    fill('Assunto (required)', 'Tarde demais');
    send();
    expect(await screen.findByText('This form is not available')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull();
  });

  it('shows the form as unavailable when the link is unknown, paused or off', async () => {
    vi.spyOn(formService, 'publicDefinition').mockRejectedValue(new ApiError(404, 'Form not found'));
    renderWithProviders(<PublicFormPage />);
    expect(await screen.findByText('This form is not available')).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
  });
});
