import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Page from '../../src/app/page';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

vi.stubGlobal('fetch', vi.fn());

describe('Case creation form [D2-case-input]', () => {
  afterEach(async () => {
    vi.clearAllMocks();
    await prisma.case.deleteMany({});
  });

  it('should submit valid identifying terms and save to database', async () => {
    const identifyingTerms = `Case_${Date.now()}`;
    const mockCase = { id: '1', identifyingTerms, createdAt: new Date().toISOString() };

    vi.mocked(global.fetch).mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/cases')) {
        return Promise.resolve(new Response(JSON.stringify([mockCase]), { status: 200 }));
      }
      return Promise.reject(new Error('Unexpected fetch'));
    });

    const user = userEvent.setup();
    render(<Page />);

    const input = screen.getByPlaceholderText(/identifying terms/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await user.type(input, identifyingTerms);
    await user.click(submitButton);

    await waitFor(() => {
      expect(vi.mocked(global.fetch)).toHaveBeenCalledWith(
        '/api/cases',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('should show the newly created case in the case list', async () => {
    const identifyingTerms = `CaseInList_${Date.now()}`;
    const mockCase = { id: '1', identifyingTerms, createdAt: new Date().toISOString() };

    let callCount = 0;
    vi.mocked(global.fetch).mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/cases')) {
        callCount++;
        if (callCount === 2) {
          return Promise.resolve(new Response(JSON.stringify([mockCase]), { status: 200 }));
        }
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
      }
      return Promise.reject(new Error('Unexpected fetch'));
    });

    const user = userEvent.setup();
    render(<Page />);

    const input = screen.getByPlaceholderText(/identifying terms/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await user.type(input, identifyingTerms);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(identifyingTerms)).toBeInTheDocument();
    });
  });

  it('should reject empty input and show error', async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));

    const user = userEvent.setup();
    render(<Page />);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter identifying terms/i)).toBeInTheDocument();
    });
  });

  it('should reject whitespace-only input and show error', async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));

    const user = userEvent.setup();
    render(<Page />);

    const input = screen.getByPlaceholderText(/identifying terms/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await user.type(input, '   ');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter identifying terms/i)).toBeInTheDocument();
    });
  });
});
