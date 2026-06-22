import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Page from '../../src/app/page';

describe('D2-case-input: Case List Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should display newly saved case in the list', async () => {
    const newCaseName = `Test Case ${Date.now()}`;

    const mockFetch = vi.fn<[string, RequestInit?], Promise<Response>>();
    mockFetch.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.includes('/api/cases') && init?.method === 'POST') {
        return new Response(JSON.stringify({ id: '1', terms: newCaseName }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(JSON.stringify([{ id: '1', terms: newCaseName }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    vi.stubGlobal('fetch', mockFetch);

    render(<Page />);

    const input = screen.getByRole('textbox', { name: /identifying terms|search terms|case/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    await userEvent.type(input, newCaseName);
    await userEvent.click(submitButton);

    await waitFor(() => {
      const listItem = screen.queryByText(newCaseName);
      expect(listItem).toBeInTheDocument();
    });
  });
});
