import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CaseCreationForm from '../../src/components/CaseCreationForm';

describe('Case Creation Form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('D2-case-input: Form accepts identifying terms and submits', () => {
    it('accepts identifying terms input and submits to API route', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', searchTerm: 'John Doe' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const user = userEvent.setup();
      render(<CaseCreationForm />);

      const input = screen.getByRole('textbox', { name: /identifying terms/i });
      await user.type(input, 'John Doe');

      const submitButton = screen.getByRole('button', { name: /create case/i });
      await user.click(submitButton);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/cases',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('John Doe'),
        })
      );
    });

    it('displays error for empty input submission', async () => {
      const user = userEvent.setup();
      render(<CaseCreationForm />);

      const submitButton = screen.getByRole('button', { name: /create case/i });
      await user.click(submitButton);

      expect(screen.getByText(/cannot be empty or whitespace/i)).toBeInTheDocument();
    });

    it('displays error for whitespace-only input submission', async () => {
      const user = userEvent.setup();
      render(<CaseCreationForm />);

      const input = screen.getByRole('textbox', { name: /identifying terms/i });
      await user.type(input, '   ');

      const submitButton = screen.getByRole('button', { name: /create case/i });
      await user.click(submitButton);

      expect(screen.getByText(/cannot be empty or whitespace/i)).toBeInTheDocument();
    });
  });
});
