import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../../src/app/api/cases/[caseId]/export/route';

vi.mock('../../src/lib/prisma', () => ({
  default: {
    evidence: {
      findMany: vi.fn(),
    },
  },
}));

import prisma from '../../src/lib/prisma';

const EVIDENCE_ROWS = [
  {
    id: 'e1',
    url: 'https://example.com/page1',
    detectedAt: new Date('2026-06-01T10:00:00.000Z'),
    pageTitle: 'Page One',
    domain: 'example.com',
  },
  {
    id: 'e2',
    url: 'https://other.org/page2',
    detectedAt: new Date('2026-06-02T12:00:00.000Z'),
    pageTitle: 'Page Two',
    domain: 'other.org',
  },
];

describe('D5-export-csv route — GET /api/cases/[caseId]/export', () => {
  beforeEach(() => {
    vi.mocked(prisma.evidence.findMany).mockResolvedValue(
      EVIDENCE_ROWS as Awaited<ReturnType<typeof prisma.evidence.findMany>>
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns a CSV download response (not inline or redirect)', async () => {
    const req = new Request('http://localhost/api/cases/case-1/export', { method: 'GET' });
    const res = await GET(req, { params: Promise.resolve({ caseId: 'case-1' }) });

    expect(res.status).toBe(200);

    const contentDisposition = res.headers.get('content-disposition') ?? '';
    expect(contentDisposition).toMatch(/attachment/);

    const contentType = res.headers.get('content-type') ?? '';
    expect(contentType).toMatch(/text\/csv/);
  });

  it('CSV body contains url, detectedAt, pageTitle, domain columns for every evidence row', async () => {
    const req = new Request('http://localhost/api/cases/case-1/export', { method: 'GET' });
    const res = await GET(req, { params: Promise.resolve({ caseId: 'case-1' }) });

    const body = await res.text();
    const lines = body.trim().split('\n');

    const header = lines[0]!.toLowerCase();
    expect(header).toContain('url');
    expect(header).toContain('detectedat');
    expect(header).toContain('pagetitle');
    expect(header).toContain('domain');

    expect(lines.length).toBeGreaterThanOrEqual(EVIDENCE_ROWS.length + 1);

    for (let i = 0; i < EVIDENCE_ROWS.length; i++) {
      const row = lines[i + 1]!;
      expect(row).toContain(EVIDENCE_ROWS[i]!.url);
      expect(row).toContain(EVIDENCE_ROWS[i]!.domain);
      expect(row).toContain(EVIDENCE_ROWS[i]!.pageTitle);
    }
  });
});
