import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Page from '../../src/app/page';

describe('D2-case-input: Case List Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays newly created case in the case list', async () => {
    const user = userEvent.setup();
    const testCaseName = `Test Case ${Date.now()}`;

    const mockFetch = vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('/api/cases') && init?.method === 'POST') {
        return Promise.resolve(
          new Response(JSON.stringify({ id: '1', identifyingTerms: testCaseName }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify([{ id: '1', identifyingTerms: testCaseName }]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );
    });

    vi.stubGlobal('fetch', mockFetch);

    render(<Page />);

    const input = screen.getByRole('textbox', {
      name: /identifying terms/i,
    }) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /create case/i });

    await user.type(input, testCaseName);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(testCaseName)).toBeInTheDocument();
    });
  });
});
