import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import CreateCaseForm from '../../src/components/CreateCaseForm';

describe('CreateCaseForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with input and submit button', () => {
    render(<CreateCaseForm onCaseCreated={() => {}} />);
    expect(screen.getByLabelText(/identifying terms/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit|create|save/i })).toBeInTheDocument();
  });

  it('submits identifying terms to API on form submission', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', identifyingTerms: 'John Doe' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const onCaseCreated = vi.fn();
    const user = userEvent.setup();

    render(<CreateCaseForm onCaseCreated={onCaseCreated} />);

    const input = screen.getByLabelText(/identifying terms/i) as HTMLInputElement;
    await user.type(input, 'John Doe');
    await user.click(screen.getByRole('button', { name: /submit|create|save/i }));

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/cases',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'content-type': 'application/json' }),
        body: JSON.stringify({ identifyingTerms: 'John Doe' }),
      })
    );
    expect(onCaseCreated).toHaveBeenCalled();
  });

  it('rejects empty or whitespace-only identifying terms', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const user = userEvent.setup();
    render(<CreateCaseForm onCaseCreated={() => {}} />);

    const input = screen.getByLabelText(/identifying terms/i) as HTMLInputElement;
    const button = screen.getByRole('button', { name: /submit|create|save/i });

    await user.click(button);
    expect(mockFetch).not.toHaveBeenCalled();

    await user.type(input, '   ');
    await user.click(button);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
