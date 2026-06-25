import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Page from '../../src/app/page';

describe('D5-export-csv – UI layer', () => {
  const mockEvidence = [
    {
      id: '1',
      url: 'https://example.com/page1',
      detectedAt: '2026-06-25T10:00:00.000Z',
      pageTitle: 'Example Page 1',
      domain: 'example.com',
    },
    {
      id: '2',
      url: 'https://other.org/page2',
      detectedAt: '2026-06-25T11:00:00.000Z',
      pageTitle: 'Other Page 2',
      domain: 'other.org',
    },
  ];

  let createdObjectUrls: string[];
  let revokedObjectUrls: string[];
  let clickedAnchors: HTMLAnchorElement[];

  beforeEach(() => {
    createdObjectUrls = [];
    revokedObjectUrls = [];
    clickedAnchors = [];

    vi.stubGlobal(
      'fetch',
      vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
        new Response(JSON.stringify(mockEvidence), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    vi.stubGlobal(
      'URL',
      Object.assign(
        class MockURL {
          href: string;
          constructor(url: string) {
            this.href = url;
          }
          static createObjectURL(blob: Blob): string {
            void blob;
            const u = `blob:mock-${createdObjectUrls.length}`;
            createdObjectUrls.push(u);
            return u;
          }
          static revokeObjectURL(url: string): void {
            revokedObjectUrls.push(url);
          }
        },
        { canParse: (u: string) => !u.startsWith('invalid') },
      ),
    );

    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(
      (tag: string, options?: ElementCreationOptions) => {
        const el = origCreate(tag, options);
        if (tag === 'a') {
          const anchor = el as HTMLAnchorElement;
          vi.spyOn(anchor, 'click').mockImplementation(() => {
            clickedAnchors.push(anchor);
          });
        }
        return el;
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('Given evidence exists, When the export control is activated, Then a file download is triggered (not inline render or redirect)', async () => {
    render(<Page />);

    const exportButton = await screen.findByRole('button', { name: /export.*csv/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(clickedAnchors.length).toBeGreaterThanOrEqual(1);
    });

    const anchor = clickedAnchors[0]!;
    expect(anchor.download).toMatch(/\.csv$/i);
    expect(anchor.href).toMatch(/^blob:/);
  });

  it('Given the downloaded CSV is opened, When each row is inspected, Then all evidence rows have url, detectedAt, pageTitle, domain columns', async () => {
    let capturedBlob: Blob | null = null;

    const origCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = (blob: Blob) => {
      capturedBlob = blob;
      return origCreateObjectURL(blob);
    };

    render(<Page />);

    const exportButton = await screen.findByRole('button', { name: /export.*csv/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(capturedBlob).not.toBeNull();
    });

    const csvText = await (capturedBlob as Blob).text();
    const lines = csvText.trim().split('\n').filter(Boolean);

    expect(lines.length).toBeGreaterThanOrEqual(2);

    const header = lines[0]!.toLowerCase();
    expect(header).toContain('url');
    expect(header).toContain('detectedat');
    expect(header).toContain('pagetitle');
    expect(header).toContain('domain');

    const headerCols = lines[0]!.split(',').map((c) => c.trim().toLowerCase());
    const urlIdx = headerCols.indexOf('url');
    const detectedAtIdx = headerCols.findIndex((c) => c === 'detectedat');
    const pageTitleIdx = headerCols.findIndex((c) => c === 'pagetitle');
    const domainIdx = headerCols.indexOf('domain');

    expect(urlIdx).toBeGreaterThanOrEqual(0);
    expect(detectedAtIdx).toBeGreaterThanOrEqual(0);
    expect(pageTitleIdx).toBeGreaterThanOrEqual(0);
    expect(domainIdx).toBeGreaterThanOrEqual(0);

    const dataLines = lines.slice(1);
    expect(dataLines.length).toBe(mockEvidence.length);

    for (const line of dataLines) {
      const cols = line.split(',');
      expect(cols[urlIdx]!.trim()).toBeTruthy();
      expect(cols[detectedAtIdx]!.trim()).toBeTruthy();
      expect(cols[pageTitleIdx]!.trim()).toBeTruthy();
      expect(cols[domainIdx]!.trim()).toBeTruthy();
    }
  });
});
