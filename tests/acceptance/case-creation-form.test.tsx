import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { describe, it, expect, beforeEach } from 'vitest';
import CaseCreationForm from '../../src/components/CaseCreationForm';

describe('CaseCreationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits identifying terms to the API and displays the saved case in the list', async () => {
    const testTerm = `test-case-${Date.now()}`;
    const mockCases = [
      { id: '1', identifyingTerms: testTerm, createdAt: new Date().toISOString() }
    ];

    vi.stubGlobal('fetch', vi.fn(async (input: string | Request) => {
      const url = typeof input === 'string' ? input : input.url;
      
      if (url.includes('/api/cases') && typeof input !== 'string' && input.method === 'POST') {
        return new Response(JSON.stringify({ id: '1', identifyingTerms: testTerm }), {
          status: 201,
          headers: { 'content-type': 'application/json' }
        });
      }
      
      if (url.includes('/api/cases') && (typeof input === 'string' || input.method === 'GET' || !input.method)) {
        return new Response(JSON.stringify(mockCases), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      
      return new Response(null, { status: 404 });
    }) as ReturnType<typeof vi.fn>);

    render(<CaseCreationForm />);
    
    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    const submitBtn = screen.getByRole('button', { name: /submit|create|save/i });
    
    fireEvent.change(input, { target: { value: testTerm } });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText(testTerm)).toBeInTheDocument();
    });
  });

  it('rejects empty or whitespace-only input', async () => {
    render(<CaseCreationForm />);
    
    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    const submitBtn = screen.getByRole('button', { name: /submit|create|save/i });
    
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/empty|required|cannot be blank/i)).toBeInTheDocument();
    });
  });
});
