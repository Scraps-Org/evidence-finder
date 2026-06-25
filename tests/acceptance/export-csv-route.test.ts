import { describe, it, expect } from 'vitest';
import { GET } from '../../src/app/api/cases/[caseId]/export/route';

const EVIDENCE_ROWS = [
  {
    id: 'ev-1',
    url: 'https://example.com/alpha',
    detectedAt: new Date('2026-06-25T10:00:00.000Z'),
    pageTitle: 'Alpha Page',
    domain: 'example.com',
  },
  {
    id: 'ev-2',
    url: 'https://example.com/beta',
    detectedAt: new Date('2026-06-25T11:00:00.000Z'),
    pageTitle: 'Beta Page',
    domain: 'example.com',
  },
];

vi.mock('../../src/lib/prisma', () => ({
  default: {
    evidence: {
      findMany: vi.fn(() => Promise.resolve(EVIDENCE_ROWS)),
    },
  },
}));

describe('D5-export-csv route: CSV contains required columns per evidence row', () => {
  it('Given evidence rows exist, When GET /api/cases/[caseId]/export is called, Then response is a file download (Content-Disposition attachment)', async () => {
    const req = new Request('http://localhost/api/cases/case-123/export', { method: 'GET' });
    const res = await GET(req, { params: { caseId: 'case-123' } });

    expect(res.status).toBe(200);
    const disposition = res.headers.get('Content-Disposition') ?? '';
    expect(disposition).toMatch(/attachment/i);
    expect(disposition).toMatch(/\.csv/i);
  });

  it('Given evidence rows exist, When each CSV row is checked, Then all rows contain url, detectedAt, pageTitle, domain columns', async () => {
    const req = new Request('http://localhost/api/cases/case-123/export', { method: 'GET' });
    const res = await GET(req, { params: { caseId: 'case-123' } });

    const text = await res.text();
    const lines = text.trim().split('\n').filter(Boolean);

    expect(lines.length).toBeGreaterThanOrEqual(3);

    const header = lines[0]!.toLowerCase();
    expect(header).toContain('url');
    expect(header).toContain('detectedat');
    expect(header).toContain('pagetitle');
    expect(header).toContain('domain');

    const dataLines = lines.slice(1);
    for (const line of dataLines) {
      const cols = line.split(',');
      expect(cols.length).toBeGreaterThanOrEqual(4);
      expect(cols.some(c => c.includes('example.com'))).toBe(true);
    }
  });
});
