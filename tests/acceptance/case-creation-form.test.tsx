import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CaseForm from '../../src/components/CaseForm';

describe('Case Creation Form - UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with input field and submit button', () => {
    render(<CaseForm />);
    expect(screen.getByLabelText(/identifying terms/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit|create|save/i })).toBeInTheDocument();
  });

  it('accepts identifying terms input', async () => {
    render(<CaseForm />);
    const input = screen.getByLabelText(/identifying terms/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'John Doe' } });
    expect(input.value).toBe('John Doe');
  });

  it('calls submit handler when form is submitted', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify({ id: '1' }), { status: 201 }))));
    render(<CaseForm />);
    const input = screen.getByLabelText(/identifying terms/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });
    
    fireEvent.change(input, { target: { value: 'Jane Smith' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(input.value).toBe('');
    });
    vi.unstubAllGlobals();
  });

  it('rejects empty input and shows error message', async () => {
    render(<CaseForm />);
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/cannot be empty/i)).toBeInTheDocument();
    });
  });

  it('rejects whitespace-only input and shows error', async () => {
    render(<CaseForm />);
    const input = screen.getByLabelText(/identifying terms/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });
    
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/cannot be empty/i)).toBeInTheDocument();
    });
  });
}
