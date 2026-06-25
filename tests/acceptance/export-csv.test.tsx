import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EvidenceList from '../../src/components/EvidenceList';

const EVIDENCE_ROWS = [
  {
    id: 'ev-1',
    url: 'https://example.com/page1',
    detectedAt: '2026-06-01T10:00:00.000Z',
    pageTitle: 'Example Page One',
    domain: 'example.com',
  },
  {
    id: 'ev-2',
    url: 'https://example.com/page2',
    detectedAt: '2026-06-02T11:00:00.000Z',
    pageTitle: 'Example Page Two',
    domain: 'example.com',
  },
];

describe('D5-export-csv – UI: export control triggers download', () => {
  let createdUrl: string;
  let anchorClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createdUrl = '';
    anchorClick = vi.fn();

    const anchor = document.createElement('a');
    vi.spyOn(anchor, 'click').mockImplementation(anchorClick);

    vi.spyOn(document, 'createElement').mockImplementation(
      (tag: string): HTMLElement => {
        if (tag === 'a') return anchor;
        return document.createElement.call(document, tag) as HTMLElement;
      },
    );

    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob: Blob | MediaSource) => {
      createdUrl = `blob:mock-${(blob as Blob).size}`;
      return createdUrl;
    });

    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  });

  it('activating the export control triggers a file download, not an inline render or redirect', () => {
    render(<EvidenceList evidence={EVIDENCE_ROWS} />);

    const exportButton = screen.getByRole('button', { name: /export.*csv|download.*csv|csv/i });
    fireEvent.click(exportButton);

    expect(anchorClick).toHaveBeenCalledTimes(1);
  });

  it('the downloaded CSV contains url, detectedAt, pageTitle, domain columns for every evidence row', () => {
    let capturedBlob: Blob | null = null;

    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob: Blob | MediaSource) => {
      capturedBlob = blob as Blob;
      return 'blob:mock';
    });

    render(<EvidenceList evidence={EVIDENCE_ROWS} />);

    const exportButton = screen.getByRole('button', { name: /export.*csv|download.*csv|csv/i });
    fireEvent.click(exportButton);

    expect(capturedBlob).not.toBeNull();

    return (capturedBlob as unknown as Blob).text().then((csvText: string) => {
      const lines = csvText.trim().split('\n');
      // header + 2 data rows
      expect(lines.length).toBeGreaterThanOrEqual(3);

      const header = lines[0]!.toLowerCase();
      expect(header).toContain('url');
      expect(header).toContain('detectedat');
      expect(header).toContain('pagetitle');
      expect(header).toContain('domain');

      for (const row of EVIDENCE_ROWS) {
        const rowLine = lines.find((l) => l.includes(row.url));
        expect(rowLine, `CSV row for ${row.url} should exist`).toBeTruthy();
        expect(rowLine).toContain(row.detectedAt);
        expect(rowLine).toContain(row.pageTitle);
        expect(rowLine).toContain(row.domain);
      }
    });
  });
});
