import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import EvidenceFinder from '../../src/components/EvidenceFinder';

describe('D2-case-input: Case list integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays newly created case in the case list', async () => {
    const testCaseName = `case-${Date.now()}`;

    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/cases')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: '1',
              identifyingTerms: testCaseName,
              createdAt: new Date().toISOString(),
            }),
            {
              status: 201,
              headers: { 'content-type': 'application/json' },
            }
          )
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );
    }));

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /identifying terms|search|case/i });
    await userEvent.type(input, testCaseName);

    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(testCaseName)).toBeInTheDocument();
    });
  });
});
