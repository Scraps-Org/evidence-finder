import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Page from '../../src/app/page';

describe('D5-export-csv — UI: export control triggers download', () => {
  const evidenceRows = [
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

  const csvContent = [
    'url,detectedAt,pageTitle,domain',
    `${evidenceRows[0]!.url},${evidenceRows[0]!.detectedAt},${evidenceRows[0]!.pageTitle},${evidenceRows[0]!.domain}`,
    `${evidenceRows[1]!.url},${evidenceRows[1]!.detectedAt},${evidenceRows[1]!.pageTitle},${evidenceRows[1]!.domain}`,
  ].join('\n');

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
        .mockResolvedValueOnce(
          new Response(JSON.stringify([{ id: 'case-1', name: 'Test Case' }]), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(evidenceRows), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        )
        .mockResolvedValueOnce(
          new Response(csvContent, {
            status: 200,
            headers: { 'content-type': 'text/csv' },
          }),
        ),
    );

    const createObjectURLMock = vi.fn<[Blob | MediaSource], string>().mockReturnValue('blob:mock-url');
    const revokeObjectURLMock = vi.fn<[string], void>();
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock,
    });
  });

  it('triggers a file download (not inline render or redirect) when the export control is activated', async () => {
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const clickSpy = vi.fn<[], void>();

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') {
        Object.defineProperty(el, 'click', { value: clickSpy, writable: true });
      }
      return el;
    });

    render(<Page />);

    const exportButton = await screen.findByRole('button', { name: /export.*csv/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    const anchorCalls = appendChildSpy.mock.calls.filter(
      (args) => (args[0] as HTMLElement).tagName === 'A',
    );
    expect(anchorCalls.length).toBeGreaterThanOrEqual(1);

    const anchor = anchorCalls[0]![0] as HTMLAnchorElement;
    expect(anchor.download).toBeTruthy();
    expect(anchor.href).toMatch(/blob:|mock-url/);
  });

  it('CSV content includes url, detectedAt, pageTitle, domain columns for every evidence row', async () => {
    render(<Page />);

    const exportButton = await screen.findByRole('button', { name: /export.*csv/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      const blobArg = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as Blob | undefined;
      expect(blobArg).toBeDefined();
    });

    const blobArg = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0]![0] as Blob;
    const text = await blobArg.text();
    const lines = text.trim().split('\n');
    const header = lines[0]!.toLowerCase();

    expect(header).toContain('url');
    expect(header).toContain('detectedat');
    expect(header).toContain('pagetitle');
    expect(header).toContain('domain');

    const dataLines = lines.slice(1);
    expect(dataLines.length).toBeGreaterThanOrEqual(evidenceRows.length);

    for (const row of dataLines) {
      const cols = row.split(',');
      expect(cols.length).toBeGreaterThanOrEqual(4);
    }

    expect(text).toContain(evidenceRows[0]!.url);
    expect(text).toContain(evidenceRows[0]!.pageTitle);
    expect(text).toContain(evidenceRows[0]!.domain);
    expect(text).toContain(evidenceRows[1]!.url);
    expect(text).toContain(evidenceRows[1]!.pageTitle);
    expect(text).toContain(evidenceRows[1]!.domain);
  });
});
