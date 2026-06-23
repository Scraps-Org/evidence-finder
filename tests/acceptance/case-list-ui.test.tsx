import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EvidenceFinder from '../../src/components/EvidenceFinder';

const mockCase = { id: 'abc-123', identifyingTerms: 'Jane Doe 1980' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Case list UI — read-back of persisted cases', () => {
  it('displays the identifyingTerms of existing cases fetched from the API', async () => {
    const fetchImpl = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>();

    // First call: GET /api/cases — returns the existing case list
    fetchImpl.mockResolvedValueOnce(
      new Response(JSON.stringify([mockCase]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    vi.stubGlobal('fetch', fetchImpl);

    render(<EvidenceFinder />);

    // The component should load and show the existing case's identifyingTerms
    const item = await screen.findByText(mockCase.identifyingTerms);
    expect(item).toBeTruthy();
  });

  it('shows newly submitted case in the list after form submission', async () => {
    const newTerms = `New Person ${Date.now()}`;
    const createdCase = { id: 'new-id-1', identifyingTerms: newTerms };

    const fetchImpl = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>();

    // First call: GET /api/cases (initial load — empty list)
    fetchImpl.mockResolvedValueOnce(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    // Second call: POST /api/cases (form submit)
    fetchImpl.mockResolvedValueOnce(
      new Response(JSON.stringify(createdCase), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      })
    );

    // Third call: GET /api/cases (refresh after submit)
    fetchImpl.mockResolvedValueOnce(
      new Response(JSON.stringify([createdCase]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    vi.stubGlobal('fetch', fetchImpl);

    const user = userEvent.setup();
    render(<EvidenceFinder />);

    const input = await screen.findByRole('textbox');
    await user.type(input, newTerms);
    await user.click(screen.getByRole('button', { name: /submit|search|add|create|save/i }));

    const item = await screen.findByText(newTerms);
    expect(item).toBeTruthy();
  });
});
