import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CaseList from '../../src/components/CaseList';

vi.stubGlobal('fetch', vi.fn<[string], Promise<Response>>());

describe('Case List: Display Newly Created Case', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display a newly saved case in the list', async () => {
    const mockCaseId = 'case-' + Date.now();
    const mockCaseName = 'New Test Case';

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(
        JSON.stringify({
          cases: [
            { id: mockCaseId, identifyingTerms: mockCaseName, createdAt: new Date().toISOString() },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );

    render(<CaseList />);

    await waitFor(() => {
      expect(screen.getByText(mockCaseName)).toBeInTheDocument();
    });
  });

  it('should fetch cases from /api/cases endpoint', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ cases: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    render(<CaseList />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/cases');
    });
  });
});
