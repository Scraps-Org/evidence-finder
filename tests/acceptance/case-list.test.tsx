import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import CaseListWithForm from '../../src/components/CaseListWithForm';

describe('D2-case-input: Case list displays newly created cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('displays newly created case in the list after form submission', async () => {
    const testCaseName = `Test Case ${Date.now()}`;
    const mockFetch = vi.fn((url: string) => {
      if (url.includes('/api/cases')) {
        return Promise.resolve({
          ok: true,
          json: async () => ([
            { id: '1', identifyingTerms: testCaseName, createdAt: new Date().toISOString() },
          ]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ id: '1', identifyingTerms: testCaseName }),
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseListWithForm />);

    const input = screen.getByRole('textbox', { name: /identifying terms|name/i });
    const submitButton = screen.getByRole('button', { name: /submit|create/i });

    await userEvent.type(input, testCaseName);
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(testCaseName)).toBeInTheDocument();
    });
  });

  it('preserves existing cases when adding new ones', async () => {
    const mockFetch = vi.fn((url: string) => {
      if (url.includes('/api/cases')) {
        return Promise.resolve({
          ok: true,
          json: async () => ([
            { id: '1', identifyingTerms: 'Existing Case', createdAt: new Date().toISOString() },
            { id: '2', identifyingTerms: 'Another Case', createdAt: new Date().toISOString() },
          ]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ id: '3', identifyingTerms: 'New Case' }),
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<CaseListWithForm />);

    await waitFor(() => {
      expect(screen.getByText('Existing Case')).toBeInTheDocument();
      expect(screen.getByText('Another Case')).toBeInTheDocument();
    });

    const input = screen.getByRole('textbox', { name: /identifying terms|name/i });
    const submitButton = screen.getByRole('button', { name: /submit|create/i });

    await userEvent.type(input, 'New Case');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Existing Case')).toBeInTheDocument();
      expect(screen.getByText('Another Case')).toBeInTheDocument();
      expect(screen.getByText('New Case')).toBeInTheDocument();
    });
  });
});
