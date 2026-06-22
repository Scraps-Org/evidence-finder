import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CaseCreation from '../../src/components/CaseCreation';

vi.stubGlobal('fetch', vi.fn<[string, RequestInit?], Promise<Response>>());

describe('D2-case-input: Case Creation Form UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ success: true, caseId: '123' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
  });

  it('should accept identifying terms and submit to API', async () => {
    const user = userEvent.setup();
    render(<CaseCreation />);

    const input = screen.getByRole('textbox', { name: /identifying terms|search terms|case name/i });
    const submitBtn = screen.getByRole('button', { name: /submit|create|save/i });

    await user.type(input, 'John Doe');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/cases',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'content-type': 'application/json' }),
          body: expect.stringContaining('John Doe'),
        })
      );
    });
  });

  it('should reject empty input and show validation error', async () => {
    const user = userEvent.setup();
    render(<CaseCreation />);

    const input = screen.getByRole('textbox', { name: /identifying terms|search terms|case name/i });
    const submitBtn = screen.getByRole('button', { name: /submit|create|save/i });

    await user.clear(input);
    await user.click(submitBtn);

    const errorMsg = await screen.findByText(/required|cannot be empty|please enter/i);
    expect(errorMsg).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should reject whitespace-only input', async () => {
    const user = userEvent.setup();
    render(<CaseCreation />);

    const input = screen.getByRole('textbox', { name: /identifying terms|search terms|case name/i });
    const submitBtn = screen.getByRole('button', { name: /submit|create|save/i });

    await user.type(input, '   ');
    await user.click(submitBtn);

    const errorMsg = await screen.findByText(/required|cannot be empty|whitespace|please enter/i);
    expect(errorMsg).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should clear form after successful submission', async () => {
    const user = userEvent.setup();
    render(<CaseCreation />);

    const input = screen.getByRole('textbox', { name: /identifying terms|search terms|case name/i }) as HTMLInputElement;
    const submitBtn = screen.getByRole('button', { name: /submit|create|save/i });

    await user.type(input, 'Jane Smith');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });
});
