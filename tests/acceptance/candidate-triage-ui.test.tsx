import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CaseView from '../../src/app/cases/[caseId]/page';

const CASE_ID = 'case-triage-ui-001';

const mockCandidates = [
  {
    id: 'cand-1',
    url: 'https://example.com/a',
    title: 'Candidate Alpha',
    status: 'pending',
    caseId: CASE_ID,
  },
  {
    id: 'cand-2',
    url: 'https://example.com/b',
    title: 'Candidate Beta',
    status: 'pending',
    caseId: CASE_ID,
  },
];

describe('CaseView candidate triage UI', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>((url) => {
        const u = String(url);
        if (u.includes('/api/cases/') && u.includes('/candidates')) {
          return Promise.resolve(
            new Response(JSON.stringify(mockCandidates), {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }),
          );
        }
        if (u.includes('/api/candidates/')) {
          return Promise.resolve(
            new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }),
          );
        }
        return Promise.resolve(new Response('{}', { status: 200 }));
      }),
    );
  });

  it('renders detected candidates as a list when the case view loads', async () => {
    render(<CaseView params={Promise.resolve({ caseId: CASE_ID })} />);
    await waitFor(() => {
      expect(screen.getByText('Candidate Alpha')).toBeDefined();
    });
    expect(screen.getByText('Candidate Beta')).toBeDefined();
  });

  it('provides a confirm action for each candidate', async () => {
    render(<CaseView params={Promise.resolve({ caseId: CASE_ID })} />);
    await waitFor(() => {
      expect(screen.getByText('Candidate Alpha')).toBeDefined();
    });
    const confirmButtons = screen.getAllByRole('button', { name: /confirm/i });
    expect(confirmButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('provides a dismiss action for each candidate', async () => {
    render(<CaseView params={Promise.resolve({ caseId: CASE_ID })} />);
    await waitFor(() => {
      expect(screen.getByText('Candidate Alpha')).toBeDefined();
    });
    const dismissButtons = screen.getAllByRole('button', { name: /dismiss/i });
    expect(dismissButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('calls the triage action with status=evidence when confirm is clicked', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>((url) => {
      const u = String(url);
      if (u.includes('/api/cases/') && u.includes('/candidates')) {
        return Promise.resolve(
          new Response(JSON.stringify(mockCandidates), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<CaseView params={Promise.resolve({ caseId: CASE_ID })} />);
    await waitFor(() => {
      expect(screen.getByText('Candidate Alpha')).toBeDefined();
    });

    const confirmButtons = screen.getAllByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButtons[0]!);

    await waitFor(() => {
      const triageCalls = fetchMock.mock.calls.filter(([url, init]) => {
        const u = String(url);
        const body = typeof init?.body === 'string' ? init.body : '';
        return u.includes('/api/candidates/') && body.includes('evidence');
      });
      expect(triageCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('calls the triage action with status=dismissed when dismiss is clicked', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>((url) => {
      const u = String(url);
      if (u.includes('/api/cases/') && u.includes('/candidates')) {
        return Promise.resolve(
          new Response(JSON.stringify(mockCandidates), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<CaseView params={Promise.resolve({ caseId: CASE_ID })} />);
    await waitFor(() => {
      expect(screen.getByText('Candidate Alpha')).toBeDefined();
    });

    const dismissButtons = screen.getAllByRole('button', { name: /dismiss/i });
    fireEvent.click(dismissButtons[0]!);

    await waitFor(() => {
      const triageCalls = fetchMock.mock.calls.filter(([url, init]) => {
        const u = String(url);
        const body = typeof init?.body === 'string' ? init.body : '';
        return u.includes('/api/candidates/') && body.includes('dismissed');
      });
      expect(triageCalls.length).toBeGreaterThanOrEqual(1);
    });
  });
});
