import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Page from '../../src/app/page';

describe('D2-case-input: Case List Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('displays newly saved case in the case list after successful creation', async () => {
    const user = userEvent.setup();
    const newCaseName = `Test Case ${Date.now()}`;
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'case-1', searchTerm: newCaseName }),
    } as Response);

    render(await Page());

    const input = screen.getByRole('textbox');
    await user.type(input, newCaseName);

    const submitButton = screen.getByRole('button', { name: /create|submit|save/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(newCaseName)).toBeInTheDocument();
    });
  });
});
