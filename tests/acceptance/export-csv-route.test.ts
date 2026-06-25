import { describe, it, expect } from 'vitest';
import { GET } from '../../src/app/api/cases/[id]/export/route';

describe('D5-export-csv – API route layer', () => {
  const evidenceRows = [
    {
      id: 'e1',
      url: 'https://example.com/page1',
      detectedAt: new Date('2026-06-25T10:00:00.000Z'),
      pageTitle: 'Example Page 1',
      domain: 'example.com',
      caseId: 'c1',
    },
    {
      id: 'e2',
      url: 'https://other.org/page2',
      detectedAt: new Date('2026-06-25T11:00:00.000Z'),
      pageTitle: 'Other Page 2',
      domain: 'other.org',
      caseId: 'c1',
    },
  ];

  it('Given evidence exists in a case, When GET /api/cases/[id]/export is called, Then it returns a CSV file download (not inline)', async () => {
    const { prisma } = await import('../../src/lib/prisma');

    vi.spyOn(prisma.evidence, 'findMany').mockResolvedValue(
      evidenceRows as Parameters<typeof prisma.evidence.findMany>[0] extends undefined
        ? never
        : Awaited<ReturnType<typeof prisma.evidence.findMany>>,
    );

    const req = new Request('http://localhost/api/cases/c1/export', { method: 'GET' });
    const res = await GET(req, { params: { id: 'c1' } });

    expect(res.status).toBe(200);

    const contentDisposition = res.headers.get('content-disposition') ?? '';
    expect(contentDisposition).toMatch(/attachment/i);
    expect(contentDisposition).toMatch(/\.csv/i);

    const contentType = res.headers.get('content-type') ?? '';
    expect(contentType).toMatch(/text\/csv/i);
  });

  it('Given evidence rows, When the CSV body is parsed, Then each row has url, detectedAt, pageTitle, domain columns', async () => {
    const { prisma } = await import('../../src/lib/prisma');

    vi.spyOn(prisma.evidence, 'findMany').mockResolvedValue(
      evidenceRows as Awaited<ReturnType<typeof prisma.evidence.findMany>>,
    );

    const req = new Request('http://localhost/api/cases/c1/export', { method: 'GET' });
    const res = await GET(req, { params: { id: 'c1' } });

    const csvText = await res.text();
    const lines = csvText.trim().split('\n').filter(Boolean);

    expect(lines.length).toBeGreaterThanOrEqual(2);

    const headerCols = lines[0]!.split(',').map((c) => c.trim().toLowerCase());
    expect(headerCols).toContain('url');
    expect(headerCols).toContain('detectedat');
    expect(headerCols).toContain('pagetitle');
    expect(headerCols).toContain('domain');

    const urlIdx = headerCols.indexOf('url');
    const detectedAtIdx = headerCols.indexOf('detectedat');
    const pageTitleIdx = headerCols.indexOf('pagetitle');
    const domainIdx = headerCols.indexOf('domain');

    const dataLines = lines.slice(1);
    expect(dataLines.length).toBe(evidenceRows.length);

    for (const line of dataLines) {
      const cols = line.split(',');
      expect(cols[urlIdx]!.trim()).toBeTruthy();
      expect(cols[detectedAtIdx]!.trim()).toBeTruthy();
      expect(cols[pageTitleIdx]!.trim()).toBeTruthy();
      expect(cols[domainIdx]!.trim()).toBeTruthy();
    }
  });
});
