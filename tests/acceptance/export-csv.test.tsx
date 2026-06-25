import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import EvidenceList from '../../src/components/EvidenceList';

const EVIDENCE_ROWS = [
  {
    id: '1',
    url: 'https://example.com/page1',
    detectedAt: '2026-06-01T10:00:00.000Z',
    pageTitle: 'Example Page One',
    domain: 'example.com',
  },
  {
    id: '2',
    url: 'https://example.com/page2',
    detectedAt: '2026-06-02T11:00:00.000Z',
    pageTitle: 'Example Page Two',
    domain: 'example.com',
  },
];

describe('D5-export-csv: UI export control', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn<[Blob], string>(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn<[string], void>(),
    });
  });

  it('triggers a file download (not inline render or redirect) when the export control is activated', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const clickSpy = vi.fn<[], void>();

    createElementSpy.mockImplementation((tag: string) => {
      const el = document.createElement.__proto__ === Function.prototype
        ? Object.create(HTMLAnchorElement.prototype)
        : document.createElement(tag);
      if (tag === 'a') {
        const anchor = document.createElement('a') as HTMLAnchorElement;
        anchor.click = clickSpy;
        createElementSpy.mockRestore();
        return anchor;
      }
      return document.createElement(tag);
    });

    render(<EvidenceList evidence={EVIDENCE_ROWS} caseId="case-1" />);

    const exportButton = screen.getByRole('button', { name: /export.*csv|download.*csv|csv/i });
    fireEvent.click(exportButton);

    expect(appendChildSpy).toHaveBeenCalled();
    const anchorCalls = appendChildSpy.mock.calls.filter(
      (call) => (call[0] as HTMLElement).tagName === 'A',
    );
    expect(anchorCalls.length).toBeGreaterThan(0);
    const anchor = anchorCalls[0]![0] as HTMLAnchorElement;
    expect(anchor.download).toMatch(/\.csv$/i);
    expect(anchor.href).toBeTruthy();

    appendChildSpy.mockRestore();
  });

  it('the downloaded CSV contains url, detectedAt, pageTitle, domain columns for every evidence row', () => {
    let capturedBlob: Blob | undefined;
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn<[Blob], string>((blob: Blob) => {
        capturedBlob = blob;
        return 'blob:mock-url';
      }),
      revokeObjectURL: vi.fn<[string], void>(),
    });

    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);

    render(<EvidenceList evidence={EVIDENCE_ROWS} caseId="case-1" />);

    const exportButton = screen.getByRole('button', { name: /export.*csv|download.*csv|csv/i });
    fireEvent.click(exportButton);

    expect(capturedBlob).toBeDefined();

    return capturedBlob!.text().then((csvText: string) => {
      const lines = csvText.trim().split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(3);

      const header = lines[0]!.toLowerCase();
      expect(header).toContain('url');
      expect(header).toContain('detectedat');
      expect(header).toContain('pagetitle');
      expect(header).toContain('domain');

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i]!;
        expect(row.length).toBeGreaterThan(0);
        const cols = row.split(',');
        expect(cols.length).toBeGreaterThanOrEqual(4);
      }

      expect(csvText).toContain(EVIDENCE_ROWS[0]!.url);
      expect(csvText).toContain(EVIDENCE_ROWS[0]!.pageTitle);
      expect(csvText).toContain(EVIDENCE_ROWS[0]!.domain);
      expect(csvText).toContain(EVIDENCE_ROWS[1]!.url);
      expect(csvText).toContain(EVIDENCE_ROWS[1]!.pageTitle);
      expect(csvText).toContain(EVIDENCE_ROWS[1]!.domain);

      appendChildSpy.mockRestore();
    });
  });
});
