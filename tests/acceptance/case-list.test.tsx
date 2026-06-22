import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import EvidenceFinder from '../../src/components/EvidenceFinder';

describe('Case List (newly saved case appears in list)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display newly saved case in the case list after successful creation', async () => {
    const user = userEvent.setup();
    const newCase = { id: 'case-123', term: 'Test Case Item' };

    const mockFetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify(newCase), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        })
      )
    );
    vi.stubGlobal('fetch', mockFetch);

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /identifying term|search term|case/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    await user.type(input, newCase.term);
    await user.click(submitButton);

    // Verify the new case appears in the list
    await waitFor(() => {
      expect(screen.getByText(newCase.term)).toBeInTheDocument();
    });
  });

  it('should display multiple cases in the list', async () => {
    const user = userEvent.setup();
    const case1 = { id: 'case-1', term: 'First Case' };
    const case2 = { id: 'case-2', term: 'Second Case' };

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(case1), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(case2), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        })
      );
    vi.stubGlobal('fetch', mockFetch);

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /identifying term|search term|case/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    // Create first case
    await user.type(input, case1.term);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(case1.term)).toBeInTheDocument();
    });

    // Create second case
    await user.clear(input);
    await user.type(input, case2.term);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(case1.term)).toBeInTheDocument();
      expect(screen.getByText(case2.term)).toBeInTheDocument();
    });
  });
});
