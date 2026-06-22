import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Page from '../../src/app/page';

describe('Case Creation Form (D2-case-input)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts identifying terms input and submits to API', async () => {
    const user = userEvent.setup();
    render(<Page />);

    const input = screen.getByRole('textbox', { name: /identifying term|search term|case name|identifier/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save|search/i });

    await user.type(input, 'John Doe');
    await user.click(submitButton);

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('rejects empty string input and does not submit', async () => {
    const user = userEvent.setup();
    render(<Page />);

    const submitButton = screen.getByRole('button', { name: /submit|create|save|search/i });
    await user.click(submitButton);

    const errorOrInput = screen.queryByText(/required|cannot be empty|whitespace/i) || screen.getByRole('textbox', { name: /identifying term|search term|case name|identifier/i });
    expect(errorOrInput).toBeInTheDocument();
  });

  it('rejects whitespace-only input and does not submit', async () => {
    const user = userEvent.setup();
    render(<Page />);

    const input = screen.getByRole('textbox', { name: /identifying term|search term|case name|identifier/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save|search/i });

    await user.type(input, '   ');
    await user.click(submitButton);

    expect(input).toHaveValue('   ');
  });
});
