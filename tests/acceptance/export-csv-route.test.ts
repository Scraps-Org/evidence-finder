import { describe, it, expect } from 'vitest';
import { GET } from '../../src/app/api/cases/[caseId]/export/route';

const EVIDENCE = [
  {
    id: 'e1',
    url: 'https://example.com/page1',
    detectedAt: new Date('2026-06-01T10:00:00.000Z'),
    pageTitle: 'Example Page One',
    domain: 'example.com',
    caseId: 'case-abc',
  },
  {
    id: 'e2',
    url: 'https://example.com/page2',
    detectedAt: new Date('2026-06-02T11:00:00.000Z'),
    pageTitle: 'Example Page Two',
    domain: 'example.com',
    caseId: 'case-abc',
  },
];

vi.mock('../../src/lib/prisma', () => ({
  default: {
    evidence: {
      findMany: vi.fn().mockResolvedValue(EVIDENCE),
    },
  },
}));

describe('D5-export-csv: GET /api/cases/[caseId]/export', () => {
  it('returns a CSV file download response (Content-Disposition: attachment) for a case with evidence', async () => {
    const req = new Request('http://localhost/api/cases/case-abc/export', { method: 'GET' });
    const res = await GET(req, { params: { caseId: 'case-abc' } });

    expect(res.status).toBe(200);

    const contentType = res.headers.get('content-type') ?? '';
    expect(contentType.toLowerCase()).toContain('text/csv');

    const disposition = res.headers.get('content-disposition') ?? '';
    expect(disposition.toLowerCase()).toContain('attachment');
    expect(disposition.toLowerCase()).toMatch(/\.csv/);
  });

  it('the CSV body contains url, detectedAt, pageTitle, domain for every evidence row', async () => {
    const req = new Request('http://localhost/api/cases/case-abc/export', { method: 'GET' });
    const res = await GET(req, { params: { caseId: 'case-abc' } });

    const csvText = await res.text();
    const lines = csvText.trim().split('\n');

    expect(lines.length).toBeGreaterThanOrEqual(3);

    const header = lines[0]!.toLowerCase();
    expect(header).toContain('url');
    expect(header).toContain('detectedat');
    expect(header).toContain('pagetitle');
    expect(header).toContain('domain');

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i]!.split(',');
      expect(cols.length).toBeGreaterThanOrEqual(4);
    }

    expect(csvText).toContain(EVIDENCE[0]!.url);
    expect(csvText).toContain(EVIDENCE[0]!.pageTitle);
    expect(csvText).toContain(EVIDENCE[0]!.domain);
    expect(csvText).toContain(EVIDENCE[1]!.url);
    expect(csvText).toContain(EVIDENCE[1]!.pageTitle);
    expect(csvText).toContain(EVIDENCE[1]!.domain);
  });
});
