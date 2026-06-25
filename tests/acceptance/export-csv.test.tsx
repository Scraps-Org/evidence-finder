import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import EvidenceList from '../../src/components/EvidenceList';

const EVIDENCE = [
  {
    id: 'ev-1',
    url: 'https://example.com/page1',
    detectedAt: '2026-06-25T10:00:00.000Z',
    pageTitle: 'Example Page 1',
    domain: 'example.com',
  },
  {
    id: 'ev-2',
    url: 'https://example.com/page2',
    detectedAt: '2026-06-25T11:00:00.000Z',
    pageTitle: 'Example Page 2',
    domain: 'example.com',
  },
];

describe('D5-export-csv — UI layer', () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    createObjectURLSpy = vi.fn(() => 'blob:mock-url');
    revokeObjectURLSpy = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders an export control when evidence items exist', () => {
    render(<EvidenceList caseId="case-1" evidence={EVIDENCE} />);
    // There must be a visible export control (button or link with export/csv semantics)
    const exportControl =
      screen.queryByRole('button', { name: /export/i }) ??
      screen.queryByRole('link', { name: /export/i }) ??
      screen.queryByRole('button', { name: /csv/i }) ??
      screen.queryByRole('link', { name: /csv/i });
    expect(exportControl).not.toBeNull();
  });

  it('triggers a file download (not inline render or redirect) when the export control is activated', async () => {
    // Spy on anchor click to capture download behaviour
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    render(<EvidenceList caseId="case-1" evidence={EVIDENCE} />);

    const exportControl =
      screen.queryByRole('button', { name: /export/i }) ??
      screen.queryByRole('link', { name: /export/i }) ??
      screen.queryByRole('button', { name: /csv/i }) ??
      screen.queryByRole('link', { name: /csv/i });

    expect(exportControl).not.toBeNull();
    fireEvent.click(exportControl!);

    await waitFor(() => {
      // A Blob URL must have been created — this is the file-download path
      expect(createObjectURLSpy).toHaveBeenCalledOnce();
      // The Blob passed to createObjectURL must contain CSV data
      const blob: Blob = createObjectURLSpy.mock.calls[0]![0] as Blob;
      expect(blob).toBeInstanceOf(Blob);
      // A temporary anchor must have been injected to trigger the download
      expect(appendChildSpy).toHaveBeenCalled();
      const anchor = appendChildSpy.mock.calls[0]![0] as HTMLAnchorElement;
      expect(anchor.tagName).toBe('A');
      expect(anchor.download).toMatch(/\.csv$/i);
      // Cleanup: the anchor must be removed after the click
      expect(removeChildSpy).toHaveBeenCalled();
    });
  });

  it('CSV blob contains all four required columns for every evidence row', async () => {
    render(<EvidenceList caseId="case-1" evidence={EVIDENCE} />);

    const exportControl =
      screen.queryByRole('button', { name: /export/i }) ??
      screen.queryByRole('link', { name: /export/i }) ??
      screen.queryByRole('button', { name: /csv/i }) ??
      screen.queryByRole('link', { name: /csv/i });

    expect(exportControl).not.toBeNull();
    fireEvent.click(exportControl!);

    await waitFor(() => {
      expect(createObjectURLSpy).toHaveBeenCalledOnce();
    });

    const blob: Blob = createObjectURLSpy.mock.calls[0]![0] as Blob;
    const text = await blob.text();
    const lines = text.trim().split('\n');

    // Header row must include all four columns
    const header = lines[0]!.toLowerCase();
    expect(header).toContain('url');
    expect(header).toContain('detectedat');
    expect(header).toContain('pagetitle');
    expect(header).toContain('domain');

    // Each evidence row must be present (one data line per evidence item)
    expect(lines.length).toBeGreaterThanOrEqual(EVIDENCE.length + 1);

    // Spot-check first data row has non-empty values for each column
    const headers = lines[0]!.split(',').map((h) => h.trim().toLowerCase());
    const urlIdx = headers.indexOf('url');
    const detectedAtIdx = headers.findIndex((h) => h.includes('detectedat'));
    const pageTitleIdx = headers.findIndex((h) => h.includes('pagetitle'));
    const domainIdx = headers.indexOf('domain');

    expect(urlIdx).toBeGreaterThanOrEqual(0);
    expect(detectedAtIdx).toBeGreaterThanOrEqual(0);
    expect(pageTitleIdx).toBeGreaterThanOrEqual(0);
    expect(domainIdx).toBeGreaterThanOrEqual(0);

    const firstDataRow = lines[1]!.split(',');
    expect(firstDataRow[urlIdx]!.trim()).toBeTruthy();
    expect(firstDataRow[detectedAtIdx]!.trim()).toBeTruthy();
    expect(firstDataRow[domainIdx]!.trim()).toBeTruthy();
  });
});
