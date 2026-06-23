import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

describe('Case list UI — reads back and displays persisted cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('displays an existing case identifyingTerms after submission returns the saved row', async () => {
    const savedCase = { id: 'abc-123', identifyingTerms: 'Jane Doe 1987' };

    vi.stubGlobal(
      'fetch',
      vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
        .mockResolvedValueOnce(
          new Response(JSON.stringify(savedCase), {
            status: 201,
            headers: { 'content-type': 'application/json' },
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify([savedCase]), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
        )
    );

    const { default: EvidenceFinder } = await import('../../src/components/EvidenceFinder');
    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'Jane Doe 1987');

    const submitButton = screen.getByRole('button', { name: /search|submit|add|create|save/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Jane Doe 1987')).toBeInTheDocument();
    });
  });
});
