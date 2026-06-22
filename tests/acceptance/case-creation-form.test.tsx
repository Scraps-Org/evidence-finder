import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import Page from '../../src/app/page';

describe('Case creation form (D2-case-input)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the case creation form with input and submit button', () => {
    render(<Page />);
    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });
    expect(input).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
  });

  it('should display case list section', () => {
    render(<Page />);
    expect(screen.getByText(/case.*list|saved.*case/i)).toBeInTheDocument();
  });

  it('should accept identifying terms input', async () => {
    const user = userEvent.setup();
    render(<Page />);
    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    await user.type(input, 'John Doe');
    expect(input).toHaveValue('John Doe');
  });
});
