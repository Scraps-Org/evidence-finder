import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import EvidenceFinder from '../../src/components/EvidenceFinder';

describe('D2-case-input: Case list display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays newly created case in the case list after successful save', async () => {
    const user = userEvent.setup();
    const testTerms = `New Case ${Date.now()}`;

    const mockFetch = vi.fn<[RequestInfo, RequestInit | undefined], Promise<Response>>();
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: '1', terms: testTerms }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      })
    );
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: '1', terms: testTerms }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', mockFetch);

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /identifying terms|search/i });
    const submitButton = screen.getByRole('button', { name: /submit|create case|save/i });

    await user.type(input, testTerms);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(testTerms)).toBeInTheDocument();
    });
  });
});
