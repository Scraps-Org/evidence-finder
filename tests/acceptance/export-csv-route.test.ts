import { describe, it, expect } from 'vitest';
import { GET } from '../../src/app/api/export/route';

describe('D5-export-csv — route: GET /api/export returns downloadable CSV with required columns', () => {
  it('returns 200 with content-disposition attachment and text/csv content-type', async () => {
    const url = new URL('http://localhost/api/export?caseId=case-1');
    const req = new Request(url.toString(), { method: 'GET' });

    const res = await GET(req);

    expect(res.status).toBe(200);

    const contentType = res.headers.get('content-type') ?? '';
    expect(contentType.toLowerCase()).toContain('text/csv');

    const disposition = res.headers.get('content-disposition') ?? '';
    expect(disposition.toLowerCase()).toContain('attachment');
    expect(disposition.toLowerCase()).toContain('.csv');
  });

  it('CSV body contains header row with url, detectedAt, pageTitle, domain columns', async () => {
    const url = new URL('http://localhost/api/export?caseId=case-1');
    const req = new Request(url.toString(), { method: 'GET' });

    const res = await GET(req);
    const text = await res.text();
    const headerLine = text.trim().split('\n')[0]!.toLowerCase();

    expect(headerLine).toContain('url');
    expect(headerLine).toContain('detectedat');
    expect(headerLine).toContain('pagetitle');
    expect(headerLine).toContain('domain');
  });

  it('each data row contains all 4 required fields when evidence exists', async () => {
    const url = new URL('http://localhost/api/export?caseId=case-1');
    const req = new Request(url.toString(), { method: 'GET' });

    const res = await GET(req);
    const text = await res.text();
    const lines = text.trim().split('\n');

    if (lines.length > 1) {
      const dataLines = lines.slice(1);
      for (const row of dataLines) {
        const cols = row.split(',');
        expect(cols.length).toBeGreaterThanOrEqual(4);
      }
    }
  });
});
