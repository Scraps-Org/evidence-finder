import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import EvidenceFinder from '../../src/components/EvidenceFinder';

describe('D2-case-input: Case List Display', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should display newly saved case in case list after submission', async () => {
    const user = userEvent.setup();
    const caseId = 'case-123';
    const identifyingTerms = 'New Case For List Display';

    const mockFetch = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: caseId, identifyingTerms }), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        })
      );

    global.fetch = mockFetch;

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    const submitButton = screen.getByRole('button', { name: /create case/i });

    await user.type(input, identifyingTerms);
    await user.click(submitButton);

    await waitFor(() => {
      const caseItem = screen.getByText(identifyingTerms);
      expect(caseItem).toBeInTheDocument();
    });
  });

  it('should not display case in list when creation fails validation', async () => {
    const user = userEvent.setup();
    const invalidTerms = '   ';

    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    const submitButton = screen.getByRole('button', { name: /create case/i });

    await user.type(input, invalidTerms);
    await user.click(submitButton);

    const errorMessage = screen.getByText(/required and cannot be empty/i);
    expect(errorMessage).toBeInTheDocument();
  });
});
