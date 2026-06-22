import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import EvidenceFinder from '../../src/components/EvidenceFinder';

interface FetchRequestInit extends RequestInit {
  method?: string;
}

describe('D2-case-input: Case list display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays newly saved case in the case list', async () => {
    const newCaseData = { id: 'case-123', searchTerms: 'Test Case' };
    const mockFetch = vi.fn<[string, FetchRequestInit], Promise<Response>>()
      .mockImplementation((url: string) => {
        if (url.includes('/api/cases')) {
          return Promise.resolve(
            new Response(JSON.stringify(newCaseData), {
              status: 201,
              headers: { 'content-type': 'application/json' },
            })
          );
        }
        return Promise.resolve(
          new Response(JSON.stringify({ cases: [newCaseData] }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
        );
      });
    vi.stubGlobal('fetch', mockFetch);

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /search terms|identifying|name|identifier/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    fireEvent.change(input, { target: { value: 'Test Case' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Test Case')).toBeInTheDocument();
    });
  });
});
