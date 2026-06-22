import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import EvidenceFinder from '../../src/components/EvidenceFinder';

describe('D2-case-input: Case List Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('displays newly saved case in the case list after successful submission', async () => {
    const newCaseId = 'case-123';
    const newCaseTerms = 'Jane Smith';

    const mockFetch = vi.fn(async (url: string) => {
      if (url.includes('/api/cases')) {
        return {
          ok: true,
          json: async () => ({ id: newCaseId, terms: newCaseTerms }),
        };
      }
      return { ok: false };
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /identifying terms|search|case/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save|search/i });

    fireEvent.change(input, { target: { value: newCaseTerms } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(newCaseTerms)).toBeInTheDocument();
    });
  });
});
