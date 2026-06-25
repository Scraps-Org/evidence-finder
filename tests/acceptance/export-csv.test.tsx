import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EvidenceList from '../../src/components/EvidenceList';

const MOCK_EVIDENCE = [
  {
    id: 'ev-1',
    url: 'https://example.com/page1',
    detectedAt: '2024-01-15T10:00:00.000Z',
    pageTitle: 'Example Page One',
    domain: 'example.com',
  },
  {
    id: 'ev-2',
    url: 'https://other.org/page2',
    detectedAt: '2024-01-16T11:00:00.000Z',
    pageTitle: 'Other Page Two',
    domain: 'other.org',
  },
];

describe('D5-export-csv: UI export control triggers file download', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('activating the export control triggers a file download, not inline render or redirect', () => {
    // Spy on URL.createObjectURL and anchor click — the canonical browser download pattern
    const createObjectURL = vi.fn<[Blob | MediaSource], string>(() => 'blob:mock-url');
    const revokeObjectURL = vi.fn<[string], void>();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL, ...URL });

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    render(<EvidenceList evidence={MOCK_EVIDENCE} caseId="case-abc" />);

    const exportButton = screen.getByRole('button', { name: /export.*csv/i });
    fireEvent.click(exportButton);

    // A blob URL must have been created (file download path)
    expect(createObjectURL).toHaveBeenCalledOnce();
    const blob = createObjectURL.mock.calls[0]![0] as Blob;
    expect(blob).toBeInstanceOf(Blob);

    // An anchor must have been clicked (triggers download) — not a navigation/redirect
    expect(clickSpy).toHaveBeenCalledOnce();

    // Cleanup: anchor must be removed from DOM after click
    expect(removeChildSpy).toHaveBeenCalledOnce();

    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    clickSpy.mockRestore();
  });

  it('the exported CSV contains url, detectedAt, pageTitle, domain columns for every evidence row', async () => {
    let capturedBlob: Blob | null = null;
    const createObjectURL = vi.fn<[Blob | MediaSource], string>((b) => {
      capturedBlob = b as Blob;
      return 'blob:mock-url';
    });
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn<[string], void>(), ...URL });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    render(<EvidenceList evidence={MOCK_EVIDENCE} caseId="case-abc" />);

    const exportButton = screen.getByRole('button', { name: /export.*csv/i });
    fireEvent.click(exportButton);

    expect(capturedBlob).not.toBeNull();
    const csvText = await (capturedBlob as unknown as Blob).text();
    const lines = csvText.trim().split('\n');

    // Header row must list all four required columns
    const header = lines[0]!.toLowerCase();
    expect(header).toContain('url');
    expect(header).toContain('detectedat');
    expect(header).toContain('pagetitle');
    expect(header).toContain('domain');

    // One data row per evidence item
    expect(lines.length).toBe(MOCK_EVIDENCE.length + 1);

    // Each data row must contain the evidence values
    const row1 = lines[1]!;
    expect(row1).toContain('https://example.com/page1');
    expect(row1).toContain('example.com');

    const row2 = lines[2]!;
    expect(row2).toContain('https://other.org/page2');
    expect(row2).toContain('other.org');
  });
});
