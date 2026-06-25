import { describe, it, expect } from 'vitest';
import { GET } from '../../src/app/api/cases/[id]/export/route';

const MOCK_EVIDENCE = [
  {
    id: 'ev-1',
    url: 'https://example.com/page1',
    detectedAt: new Date('2026-06-25T10:00:00.000Z'),
    pageTitle: 'Example Page 1',
    domain: 'example.com',
    caseId: 'case-abc',
    createdAt: new Date('2026-06-25T10:00:00.000Z'),
  },
  {
    id: 'ev-2',
    url: 'https://example.com/page2',
    detectedAt: new Date('2026-06-25T11:00:00.000Z'),
    pageTitle: 'Example Page 2',
    domain: 'example.com',
    caseId: 'case-abc',
    createdAt: new Date('2026-06-25T11:00:00.000Z'),
  },
];

// Mock Prisma so the route test does not need a real DB connection
vi.mock('../../src/lib/prisma', () => ({
  default: {
    evidence: {
      findMany: vi.fn(() => Promise.resolve(MOCK_EVIDENCE)),
    },
  },
}));

import { vi } from 'vitest';

describe('D5-export-csv — API route layer', () => {
  it('returns 200 with content-type text/csv', async () => {
    const req = new Request('http://localhost/api/cases/case-abc/export', {
      method: 'GET',
    });
    const res = await GET(req, { params: { id: 'case-abc' } });
    expect(res.status).toBe(200);
    const ct = res.headers.get('content-type') ?? '';
    expect(ct.toLowerCase()).toContain('text/csv');
  });

  it('sets content-disposition to attachment so the browser downloads the file', async () => {
    const req = new Request('http://localhost/api/cases/case-abc/export', {
      method: 'GET',
    });
    const res = await GET(req, { params: { id: 'case-abc' } });
    const cd = res.headers.get('content-disposition') ?? '';
    // Must be attachment (download), not inline (render) or a redirect
    expect(cd.toLowerCase()).toContain('attachment');
    expect(cd.toLowerCase()).toContain('.csv');
  });

  it('CSV body contains header row with url, detectedAt, pageTitle, domain columns', async () => {
    const req = new Request('http://localhost/api/cases/case-abc/export', {
      method: 'GET',
    });
    const res = await GET(req, { params: { id: 'case-abc' } });
    const text = await res.text();
    const lines = text.trim().split('\n');
    const header = lines[0]!.toLowerCase();
    expect(header).toContain('url');
    expect(header).toContain('detectedat');
    expect(header).toContain('pagetitle');
    expect(header).toContain('domain');
  });

  it('CSV body contains one data row per evidence item with all four field values', async () => {
    const req = new Request('http://localhost/api/cases/case-abc/export', {
      method: 'GET',
    });
    const res = await GET(req, { params: { id: 'case-abc' } });
    const text = await res.text();
    const lines = text.trim().split('\n');

    // header + 2 data rows
    expect(lines.length).toBeGreaterThanOrEqual(3);

    const headers = lines[0]!.split(',').map((h) => h.trim().toLowerCase());
    const urlIdx = headers.indexOf('url');
    const detectedAtIdx = headers.findIndex((h) => h.includes('detectedat'));
    const pageTitleIdx = headers.findIndex((h) => h.includes('pagetitle'));
    const domainIdx = headers.indexOf('domain');

    expect(urlIdx).toBeGreaterThanOrEqual(0);
    expect(detectedAtIdx).toBeGreaterThanOrEqual(0);
    expect(pageTitleIdx).toBeGreaterThanOrEqual(0);
    expect(domainIdx).toBeGreaterThanOrEqual(0);

    for (const line of lines.slice(1)) {
      const cells = line.split(',');
      expect(cells[urlIdx]!.trim()).toBeTruthy();
      expect(cells[detectedAtIdx]!.trim()).toBeTruthy();
      expect(cells[pageTitleIdx]!.trim()).toBeTruthy();
      expect(cells[domainIdx]!.trim()).toBeTruthy();
    }
  });
});
