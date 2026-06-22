import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import EvidenceFinder from '../../src/components/EvidenceFinder';

vi.stubGlobal('fetch', vi.fn<[string, RequestInit?], Promise<Response>>());

describe('D2-case-input: Case Creation Form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts identifying terms input and submits to API route', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.mocked(fetch);

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: '1', searchTerms: 'John Doe' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /search terms|case name|identifying/i });
    await user.type(input, 'John Doe');

    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/case'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'content-type': 'application/json' }),
          body: expect.stringContaining('John Doe'),
        })
      );
    });
  });

  it('rejects empty input without submitting to API', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockClear();

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /search terms|case name|identifying/i });
    await user.type(input, '   ');

    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });
    await user.click(submitButton);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('displays validation error for whitespace-only input', async () => {
    const user = userEvent.setup();
    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /search terms|case name|identifying/i });
    await user.type(input, '   ');

    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.queryByText(/required|cannot be empty|must contain/i)
      ).toBeInTheDocument();
    });
  });
});