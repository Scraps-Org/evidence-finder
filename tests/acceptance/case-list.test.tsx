import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import EvidenceFinder from '../../src/components/EvidenceFinder';

describe('Case List Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('displays newly saved case in the case list after successful submission', async () => {
    const mockFetch = vi.mocked(global.fetch);
    const newCase = { id: 'case-1', terms: 'Jane Smith' };

    mockFetch.mockImplementation((url) => {
      if ((url as string).includes('POST')) {
        return Promise.resolve(
          new Response(JSON.stringify(newCase), {
            status: 201,
            headers: { 'content-type': 'application/json' },
          })
        );
      }
      if ((url as string).includes('GET')) {
        return Promise.resolve(
          new Response(JSON.stringify([newCase]), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
        );
      }
      return Promise.reject(new Error('Unexpected request'));
    });

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /identifying terms|search terms|case name/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    await userEvent.type(input, 'Jane Smith');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });
})