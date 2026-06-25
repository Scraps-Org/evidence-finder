import { describe, it, expect } from 'vitest';
import { GET } from '../../src/app/api/cases/[id]/export/route';

const EVIDENCE_ROWS = [
  {
    id: 'ev-1',
    url: 'https://example.com/page',
    detectedAt: new Date('2026-06-01T10:00:00.000Z'),
    pageTitle: 'Example Page',
    domain: 'example.com',
  },
  {
    id: 'ev-2',
    url: 'https://other.org/article',
    detectedAt: new Date('2026-06-02T12:00:00.000Z'),
    pageTitle: 'Other Article',
    domain: 'other.org',
  },
];

vi.mock('../../src/lib/prisma', () => ({
  default: {
    evidence: {
      findMany: vi.fn().mockResolvedValue(EVIDENCE_ROWS),
    },
  },
}));

describe('D5-export-csv — route: GET /api/cases/[id]/export returns CSV with required columns', () => {
  it('returns Content-Disposition attachment (file download, not inline)', async () => {
    const req = new Request('http://localhost/api/cases/case-1/export', { method: 'GET' });
    const res = await GET(req, { params: { id: 'case-1' } });

    const disposition = res.headers.get('Content-Disposition') ?? '';
    expect(disposition).toMatch(/attachment/i);
    expect(disposition).not.toMatch(/inline/i);
  });

  it('CSV body contains all four required columns for every evidence row', async () => {
    const req = new Request('http://localhost/api/cases/case-1/export', { method: 'GET' });
    const res = await GET(req, { params: { id: 'case-1' } });

    const text = await res.text();
    const lines = text.trim().split('\n');

    // Header row must declare all four columns
    const header = lines[0]!.toLowerCase();
    expect(header).toContain('url');
    expect(header).toContain('detectedat');
    expect(header).toContain('pagetitle');
    expect(header).toContain('domain');

    // Every data row must contain non-empty values for each evidence entry
    expect(lines.length).toBeGreaterThanOrEqual(EVIDENCE_ROWS.length + 1);

    const dataLines = lines.slice(1);
    for (const line of dataLines) {
      const cols = line.split(',');
      // At minimum 4 columns present and non-empty after trimming quotes
      expect(cols.length).toBeGreaterThanOrEqual(4);
      for (const col of cols) {
        expect(col.replace(/"/g, '').trim()).not.toBe('');
      }
    }
  });
});
