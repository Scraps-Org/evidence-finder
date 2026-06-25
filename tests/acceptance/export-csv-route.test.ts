import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../../src/app/api/cases/[caseId]/export/route';

const MOCK_EVIDENCE = [
  {
    id: 'e1',
    url: 'https://example.com/page1',
    detectedAt: new Date('2026-06-25T10:00:00.000Z'),
    pageTitle: 'Page One',
    domain: 'example.com',
    caseId: 'case-abc',
    content: null,
  },
  {
    id: 'e2',
    url: 'https://example.com/page2',
    detectedAt: new Date('2026-06-25T11:00:00.000Z'),
    pageTitle: 'Page Two',
    domain: 'example.com',
    caseId: 'case-abc',
    content: null,
  },
];

vi.mock('../../src/lib/prisma', () => ({
  default: {
    evidence: {
      findMany: vi.fn(),
    },
  },
}));

describe('D5-export-csv API route: GET /api/cases/[caseId]/export', () => {
  beforeEach(async () => {
    const { default: prisma } = await import('../../src/lib/prisma');
    vi.mocked(prisma.evidence.findMany).mockResolvedValue(MOCK_EVIDENCE as never);
  });

  it('returns a file attachment response (not inline, not redirect)', async () => {
    const req = new Request('http://localhost/api/cases/case-abc/export', { method: 'GET' });
    const res = await GET(req, { params: Promise.resolve({ caseId: 'case-abc' }) });

    expect(res.status).toBe(200);
    const disposition = res.headers.get('content-disposition') ?? '';
    expect(disposition).toMatch(/attachment/i);
    expect(disposition).not.toMatch(/inline/i);
  });

  it('CSV body contains url, detectedAt, pageTitle, domain columns for every evidence row', async () => {
    const req = new Request('http://localhost/api/cases/case-abc/export', { method: 'GET' });
    const res = await GET(req, { params: Promise.resolve({ caseId: 'case-abc' }) });

    const text = await res.text();
    const lines = text.trim().split('\n').filter(Boolean);

    expect(lines.length).toBeGreaterThanOrEqual(3);

    const header = lines[0]!.toLowerCase();
    expect(header).toContain('url');
    expect(header).toContain('detectedat');
    expect(header).toContain('pagetitle');
    expect(header).toContain('domain');

    for (const evidence of MOCK_EVIDENCE) {
      const matchingLine = lines.slice(1).find((line) => line.includes(evidence.url));
      expect(matchingLine).toBeDefined();
      expect(matchingLine).toContain(evidence.detectedAt.toISOString());
      expect(matchingLine).toContain(evidence.pageTitle);
      expect(matchingLine).toContain(evidence.domain);
    }
  });
});
