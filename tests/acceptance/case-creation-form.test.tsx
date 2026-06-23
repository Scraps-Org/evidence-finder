import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, beforeEach } from 'vitest';
import CaseCreationForm from '../../src/components/CaseCreationForm';

describe('Case Creation Form — D2-case-input', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits identifying terms via POST to /api/cases', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: '1', identifyingTerms: 'John Doe' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseCreationForm onCaseCreated={vi.fn()} />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    await user.type(input, 'John Doe');

    const submitButton = screen.getByRole('button', { name: /submit|create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/cases',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'content-type': 'application/json' }),
          body: expect.stringContaining('John Doe'),
        })
      );
    });
  });

  it('clears input after successful submission', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: '1', identifyingTerms: 'Test Case' }),
    }));

    render(<CaseCreationForm onCaseCreated={vi.fn()} />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i }) as HTMLInputElement;
    await user.type(input, 'Test Case');
    await user.click(screen.getByRole('button', { name: /submit|create/i }));

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });
});
