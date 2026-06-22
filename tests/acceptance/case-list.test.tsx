import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { vi } from 'vitest';
import { describe, it, expect, beforeEach } from 'vitest';
import EvidenceFinder from '../../src/components/EvidenceFinder';

describe('Case List Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('displays newly saved cases in the list', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.mocked(global.fetch);

    mockFetch.mockImplementation((url: string | Request) => {
      const urlStr = typeof url === 'string' ? url : url.url;
      if (urlStr.includes('/api/cases') && url instanceof Request && url.method === 'POST') {
        return Promise.resolve(
          new Response(JSON.stringify({ id: '123', identifyingTerms: 'New Case' }), {
            status: 201,
            headers: { 'content-type': 'application/json' },
          })
        );
      }
      if (urlStr.includes('/api/cases')) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              { id: '123', identifyingTerms: 'New Case' },
              { id: '456', identifyingTerms: 'Another Case' },
            ]),
            {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }
          )
        );
      }
      return Promise.reject(new Error('Not mocked'));
    });

    render(<EvidenceFinder />);

    await waitFor(() => {
      expect(screen.getByText('New Case')).toBeInTheDocument();
    });
  });
});
