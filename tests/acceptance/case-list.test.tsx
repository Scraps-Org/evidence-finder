import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Page from '../../src/app/page';

describe('Case List Integration (D2-case-input)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays newly created case in the case list after save', async () => {
    const testCaseName = `Test Case ${new Date().getTime()}`;
    render(<Page />);

    const input = screen.getByRole('textbox', { name: /identifying term|search term|case name|identifier/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save|search/i });

    await userEvent.type(input, testCaseName);
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(new RegExp(testCaseName, 'i'))).toBeInTheDocument();
    });
  });
});
