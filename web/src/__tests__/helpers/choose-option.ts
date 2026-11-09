import { fireEvent, screen } from '@testing-library/react';

export const chooseOption = (trigger: HTMLElement, name: string): void => {
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole('option', { name }));
};
