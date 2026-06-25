import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import EvidenceList from '../../src/components/EvidenceList';

const EVIDENCE = [
  {
    id: 'e1',
    url: 'https://example.com/page1',
    detectedAt: '2026-06-01T10:00:00.000Z',
    pageTitle: 'Page One',
    domain: 'example.com',
  },
  {
    id: 'e2',
    url: 'https://other.org/page2',
    detectedAt: '2026-06-02T12:00:00.000Z',
    pageTitle: 'Page Two',
    domain: 'other.org',
  },
];

describe('D5-export-csv UI — export control triggers download', () => {
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let createObjectURL: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.fn>;
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    revokeObjectURL = vi.fn();
    createObjectURL = vi.fn(() => 'blob:fake-url');
    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    });

    clickSpy = vi.fn();
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === 'a') {
        vi.spyOn(el, 'click').mockImplementation(clickSpy);
      }
      return el;
    });

    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    vi.stubGlobal('fetch', vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(
          'url,detectedAt,pageTitle,domain\n' +
          EVIDENCE.map(e => `${e.url},${e.detectedAt},${e.pageTitle},${e.domain}`).join('\n')
        ),
        blob: () => Promise.resolve(new Blob(['csv'], { type: 'text/csv' })),
      } as unknown as Response)
    ));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('triggers a file download (not inline render or redirect) when the export control is activated', async () => {
    render(<EvidenceList caseId="case-1" evidence={EVIDENCE} />);

    const exportControl =
      screen.getByRole('button', { name: /export/i }) ??
      screen.getByRole('link', { name: /export/i });

    fireEvent.click(exportControl);

    await waitFor(() => {
      expect(createObjectURL).toHaveBeenCalled();
    });

    expect(clickSpy).toHaveBeenCalled();

    const anchorCalls = appendChildSpy.mock.calls
      .map((args) => args[0])
      .filter((node): node is HTMLAnchorElement => node instanceof HTMLAnchorElement);
    expect(anchorCalls.length).toBeGreaterThan(0);
    const anchor = anchorCalls[0]!;
    expect(anchor.download).toBeTruthy();

    expect(removeChildSpy).toHaveBeenCalled();
  });
});
