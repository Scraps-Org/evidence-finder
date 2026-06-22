import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import EvidenceFinder from '../../src/components/EvidenceFinder';

vi.stubGlobal('fetch', vi.fn<[string, RequestInit?], Promise<Response>>());

describe('D2-case-input: Case List Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays newly saved case in the list after creation', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.mocked(fetch);

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'case-abc-123', searchTerms: 'Sarah Johnson' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      })
    );

    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { id: 'case-abc-123', searchTerms: 'Sarah Johnson' },
        ]),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      )
    );

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /search terms|case name|identifying/i });
    await user.type(input, 'Sarah Johnson');

    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    });
  });
});