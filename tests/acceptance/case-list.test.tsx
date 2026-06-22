import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import EvidenceFinder from '../../src/components/EvidenceFinder';

vi.stubGlobal('fetch', vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>());

describe('Case List Display - D2-case-input', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays newly saved case in the case list after successful submission', async () => {
    const mockFetch = vi.mocked(fetch);
    const newCaseId = `case-${Date.now()}`;
    const newCaseTerms = 'Alice Smith';

    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ id: newCaseId, identifyingTerms: newCaseTerms }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    render(<EvidenceFinder />);

    const input = screen.getByPlaceholderText(/identifying terms|search/i);
    await userEvent.type(input, newCaseTerms);

    const submitBtn = screen.getByRole('button', { name: /submit|save|create/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.queryByText(newCaseTerms)).toBeInTheDocument();
    });
  });
});
