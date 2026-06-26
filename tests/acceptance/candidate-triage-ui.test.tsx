import { render, screen, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

// ---------- types used in stubs ----------
type TriageAction = (candidateId: string, status: 'evidence' | 'dismissed') => Promise<void>;

// ---------- mocked module shape ----------
type CaseViewModule = {
  CaseView: React.ComponentType<{ caseId: string; triageCandidate: TriageAction }>;
};

vi.mock('../../src/components/EvidenceList', () => ({
  EvidenceList: () => <div data-testid="evidence-list" />,
}));

import React from 'react';

describe('D8 candidate triage – UI', () => {
  const candidates = [
    { id: 'cand-1', url: 'https://example.com/a', title: 'Result A', status: 'candidate' },
    { id: 'cand-2', url: 'https://example.com/b', title: 'Result B', status: 'candidate' },
  ];

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
        new Response(JSON.stringify(candidates), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );
  });

  it('lists detected candidates when the case view is opened', async () => {
    // Dynamic import so fetch stub is in place before module initialises
    const mod = await import('../../src/app/page') as { default: React.ComponentType };
    const Page = mod.default;
    render(<Page />);

    // The case view must surface candidate titles fetched from the Candidate table
    expect(await screen.findByText('Result A')).toBeTruthy();
    expect(screen.getByText('Result B')).toBeTruthy();
  });

  it('calls confirm action and candidate moves toward evidence status', async () => {
    const triageAction = vi.fn<[string, 'evidence' | 'dismissed'], Promise<void>>().mockResolvedValue(undefined);

    // Render a minimal CaseView-like component; if the real component is not yet
    // implemented this test will fail (red-first contract).
    const { CaseView } = await import('../../src/components/EvidenceList') as unknown as CaseViewModule;
    // If CaseView doesn't exist yet the destructure fails — that is the expected red state.
    render(
      <CaseView caseId="case-1" triageCandidate={triageAction} />
    );

    const confirmBtn = await screen.findByRole('button', { name: /confirm/i });
    await userEvent.click(confirmBtn);

    expect(triageAction).toHaveBeenCalledWith(
      expect.any(String),
      'evidence',
    );
  });

  it('calls dismiss action when user dismisses a candidate', async () => {
    const triageAction = vi.fn<[string, 'evidence' | 'dismissed'], Promise<void>>().mockResolvedValue(undefined);

    const { CaseView } = await import('../../src/components/EvidenceList') as unknown as CaseViewModule;
    render(
      <CaseView caseId="case-1" triageCandidate={triageAction} />
    );

    const dismissBtn = await screen.findByRole('button', { name: /dismiss/i });
    await userEvent.click(dismissBtn);

    expect(triageAction).toHaveBeenCalledWith(
      expect.any(String),
      'dismissed',
    );
  });
});
