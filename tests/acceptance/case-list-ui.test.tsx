import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CaseList from '../../src/components/CaseList';

describe('CaseList component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render case list from API', async () => {
    const mockCases = [
      { id: '1', identifyingTerms: 'John Doe' },
      { id: '2', identifyingTerms: 'Jane Smith' },
    ];

    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ cases: mockCases }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      )
    );

    render(<CaseList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should display empty state when no cases exist', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ cases: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      )
    );

    render(<CaseList />);

    await waitFor(() => {
      expect(screen.getByText(/no cases/i)).toBeInTheDocument();
    });
  });
});
