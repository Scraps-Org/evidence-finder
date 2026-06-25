import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import EvidenceList from '../../src/components/EvidenceList';

const EVIDENCE_ROWS = [
  {
    id: '1',
    url: 'https://example.com/page1',
    detectedAt: '2026-06-25T10:00:00.000Z',
    pageTitle: 'Page One',
    domain: 'example.com',
  },
  {
    id: '2',
    url: 'https://example.com/page2',
    detectedAt: '2026-06-25T11:00:00.000Z',
    pageTitle: 'Page Two',
    domain: 'example.com',
  },
];

describe('D5-export-csv UI: export control triggers file download', () => {
  let createdUrl: string;
  let revokedUrl: string;
  let clickedHref: string;
  let clickedDownload: string;
  let anchorClickCalled: boolean;

  beforeEach(() => {
    createdUrl = '';
    revokedUrl = '';
    clickedHref = '';
    clickedDownload = '';
    anchorClickCalled = false;

    vi.stubGlobal('URL', {
      createObjectURL: (blob: Blob) => {
        void blob;
        createdUrl = 'blob:mock-url';
        return createdUrl;
      },
      revokeObjectURL: (url: string) => {
        revokedUrl = url;
      },
    });

    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === 'a') {
        const origClick = el.click.bind(el);
        Object.defineProperty(el, 'click', {
          value: () => {
            clickedHref = (el as HTMLAnchorElement).href;
            clickedDownload = (el as HTMLAnchorElement).download;
            anchorClickCalled = true;
            origClick();
          },
          writable: true,
        });
      }
      return el;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('activating the export control triggers a file download, not inline render or redirect', async () => {
    render(<EvidenceList evidence={EVIDENCE_ROWS} caseId="case-1" />);

    const exportBtn = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(anchorClickCalled).toBe(true);
    });

    expect(createdUrl).toBe('blob:mock-url');
    expect(clickedDownload).not.toBe('');
    expect(clickedHref).not.toContain('data:text/html');
    expect(window.location.href).not.toContain('/api/cases/case-1/export');
  });
});
