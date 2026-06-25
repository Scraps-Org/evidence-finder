import { describe, it, expect } from 'vitest';
import { GET } from '../../src/app/api/cases/[id]/export/route';

describe('D5-export-csv: API route returns downloadable CSV with required columns', () => {
  it('returns Content-Disposition attachment header (download, not inline)', async () => {
    const req = new Request('http://localhost/api/cases/case-test/export', { method: 'GET' });
    const params = Promise.resolve({ id: 'case-test' });
    const res = await GET(req, { params });

    expect(res.status).not.toBe(404);
    const disposition = res.headers.get('Content-Disposition') ?? '';
    expect(disposition).toMatch(/attachment/i);
    expect(disposition).toMatch(/\.csv/i);
  });

  it('response body is CSV text with url, detectedAt, pageTitle, domain header columns', async () => {
    const req = new Request('http://localhost/api/cases/case-test/export', { method: 'GET' });
    const params = Promise.resolve({ id: 'case-test' });
    const res = await GET(req, { params });

    expect(res.status).toBe(200);
    const contentType = res.headers.get('Content-Type') ?? '';
    expect(contentType).toMatch(/text\/csv/i);

    const csvText = await res.text();
    const headerLine = csvText.trim().split('\n')[0]!.toLowerCase();
    expect(headerLine).toContain('url');
    expect(headerLine).toContain('detectedat');
    expect(headerLine).toContain('pagetitle');
    expect(headerLine).toContain('domain');
  });
});
