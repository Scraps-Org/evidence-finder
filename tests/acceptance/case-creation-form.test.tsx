import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import CaseCreationForm from '../../src/components/CaseCreationForm';

describe('Case Creation Form - UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders form with input for identifying terms and submit button', () => {
    render(<CaseCreationForm onCaseCreated={() => {}} />);
    expect(screen.getByLabelText(/identifying terms/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit|create|save/i })).toBeInTheDocument();
  });

  it('accepts user input for identifying terms', async () => {
    const user = userEvent.setup();
    render(<CaseCreationForm onCaseCreated={() => {}} />);
    const input = screen.getByLabelText(/identifying terms/i);
    await user.type(input, 'John Doe');
    expect(input).toHaveValue('John Doe');
  });

  it('submits form with identifying terms to API and calls onCaseCreated on success', async () => {
    const user = userEvent.setup();
    const mockOnCaseCreated = vi.fn();
    const mockFetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ id: '1', identifyingTerms: 'Jane Smith' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseCreationForm onCaseCreated={mockOnCaseCreated} />);
    const input = screen.getByLabelText(/identifying terms/i);
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    await user.type(input, 'Jane Smith');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/cases',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ identifyingTerms: 'Jane Smith' }),
          headers: expect.objectContaining({ 'content-type': 'application/json' }),
        }),
      );
    });

    await waitFor(() => {
      expect(mockOnCaseCreated).toHaveBeenCalled();
    });
  });

  it('rejects empty identifying terms and does not submit', async () => {
    const user = userEvent.setup();
    const mockOnCaseCreated = vi.fn();
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseCreationForm onCaseCreated={mockOnCaseCreated} />);
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  it('rejects whitespace-only identifying terms and does not submit', async () => {
    const user = userEvent.setup();
    const mockOnCaseCreated = vi.fn();
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseCreationForm onCaseCreated={mockOnCaseCreated} />);
    const input = screen.getByLabelText(/identifying terms/i);
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    await user.type(input, '   ');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
