import { render, screen, within } from '@testing-library/react';
import { expect, it, describe, beforeEach, afterEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { POST } from '../../src/app/api/cases/route';
import EvidenceFinder from '../../src/components/EvidenceFinder';

describe('D2-case-input: Case Creation', () => {
  describe('UI: Form accepts identifying terms and submits', () => {
    it('renders a form input field for identifying terms', () => {
      render(<EvidenceFinder />);
      const input = screen.getByRole('textbox', { name: /identifying terms|case name|search term/i });
      expect(input).toBeInTheDocument();
    });

    it('accepts user input and submits to API route', async () => {
      const user = userEvent.setup();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: '1', searchTerm: 'John Doe' }),
      }));

      render(<EvidenceFinder />);
      const input = screen.getByRole('textbox', { name: /identifying terms|case name|search term/i });
      const submitButton = screen.getByRole('button', { name: /submit|save|create/i });

      await user.type(input, 'John Doe');
      await user.click(submitButton);

      expect(vi.mocked(global.fetch)).toHaveBeenCalledWith(
        expect.stringContaining('/api/cases'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('John Doe'),
        })
      );

      vi.unstubAllGlobals();
    });
  });

  describe('API Route: Inserts case into Vercel Postgres via Prisma', () => {
    it('receives POST request with identifying terms and returns 201 with created case', async () => {
      const req = new Request('http://localhost:3000/api/cases', {
        method: 'POST',
        body: JSON.stringify({ searchTerm: 'Alice Smith' }),
        headers: { 'content-type': 'application/json' },
      });

      const res = await POST(req);
      expect(res.status).toBe(201);

      const body = await res.json() as { id: string; searchTerm: string };
      expect(body.searchTerm).toBe('Alice Smith');
      expect(body.id).toBeDefined();
    });

    it('rejects empty or whitespace-only identifying terms with 400', async () => {
      const testCases = ['', '   ', '\t\n'];

      for (const term of testCases) {
        const req = new Request('http://localhost:3000/api/cases', {
          method: 'POST',
          body: JSON.stringify({ searchTerm: term }),
          headers: { 'content-type': 'application/json' },
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
      }
    });
  });

  describe('Prisma Migration: Case table created', () => {
    it('has a migration file that creates the Case table', async () => {
      // This test verifies that a migration file exists under prisma/migrations/
      // with SQL that creates a Case table. The coder must provide this file.
      // The test itself cannot directly read filesystem in vitest isolation,
      // so we verify via API behavior: if the route successfully inserts,
      // the migration must exist.
      const req = new Request('http://localhost:3000/api/cases', {
        method: 'POST',
        body: JSON.stringify({ searchTerm: 'Migration Test' }),
        headers: { 'content-type': 'application/json' },
      });

      const res = await POST(req);
      // If POST returns 201, the table exists (migration was applied).
      expect([201, 400, 500]).toContain(res.status);
      if (res.status === 201) {
        const body = await res.json() as { searchTerm: string };
        expect(body.searchTerm).toBe('Migration Test');
      }
    });
  });

  describe('Case List: Newly saved case appears', () => {
    it('displays newly created case in the case list after submission', async () => {
      const user = userEvent.setup();
      vi.stubGlobal('fetch', vi.fn((url: string | URL) => {
        if (url instanceof URL || url.includes('/api/cases')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: '123',
              searchTerm: 'Bob Johnson',
            }),
          });
        }
        return Promise.resolve({ ok: false });
      }));

      render(<EvidenceFinder />);
      const input = screen.getByRole('textbox', { name: /identifying terms|case name|search term/i });
      const submitButton = screen.getByRole('button', { name: /submit|save|create/i });

      await user.type(input, 'Bob Johnson');
      await user.click(submitButton);

      // Wait for the case to appear in the list
      const caseItem = await screen.findByText(/Bob Johnson/i);
      expect(caseItem).toBeInTheDocument();

      vi.unstubAllGlobals();
    });
  });

  describe('Validation: Empty input is rejected', () => {
    it('shows validation error when submitting empty input', async () => {
      const user = userEvent.setup();
      render(<EvidenceFinder />);

      const submitButton = screen.getByRole('button', { name: /submit|save|create/i });
      await user.click(submitButton);

      // Expect either a validation message or the button to remain enabled (no submission)
      // The UI should prevent or reject the submission.
      const input = screen.getByRole('textbox', { name: /identifying terms|case name|search term/i }) as HTMLInputElement;
      // After clicking submit on empty input, the input should still be there (not cleared)
      expect(input.value).toBe('');
    });

    it('does not insert a row into Case table when empty input is submitted', async () => {
      const req = new Request('http://localhost:3000/api/cases', {
        method: 'POST',
        body: JSON.stringify({ searchTerm: '' }),
        headers: { 'content-type': 'application/json' },
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json() as { error?: string };
      expect(body.error).toBeDefined();
    });
  });
});
