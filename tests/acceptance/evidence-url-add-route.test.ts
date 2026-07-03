import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.fn();
const mockPrisma = { evidence: { create: mockCreate } };

vi.mock('../../src/lib/prisma', () => ({ default: mockPrisma }));

describe('POST /api/evidence — server-side fetch, parse, and persist', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCreate.mockReset();
  });

  it('creates an Evidence row with all five fields non-null when a URL is submitted', async () => {
    const targetUrl = 'https://example.com/post/123';
    const fakeHtml = '<html><head><title>Evidence Page Title</title></head><body></body></html>';

    const fetchSpy = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(fakeHtml, { status: 200, headers: { 'content-type': 'text/html' } }),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const caseId = 'case-abc-123';
    mockCreate.mockResolvedValue({
      id: 'ev-1',
      url: targetUrl,
      detectedAt: new Date(),
      pageTitle: 'Evidence Page Title',
      domain: 'example.com',
      caseId,
    });

    const { POST } = await import('../../src/app/api/evidence/route');

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: targetUrl, caseId }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await res.json() as { url: string; detectedAt: string; pageTitle: string; domain: string; caseId: string };
    expect(body.url).toBe(targetUrl);
    expect(body.detectedAt).toBeTruthy();
    expect(body.pageTitle).toBeTruthy();
    expect(body.domain).toBeTruthy();
    expect(body.caseId).toBe(caseId);
  });

  it('fetches the target URL on the server (not the client) and extracts pageTitle from <title>', async () => {
    const targetUrl = 'https://news.example.org/article/456';
    const fakeHtml = '<html><head><title>Parsed From Server</title></head></html>';

    const fetchSpy = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(fakeHtml, { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const caseId = 'case-xyz-999';
    mockCreate.mockResolvedValue({
      id: 'ev-2',
      url: targetUrl,
      detectedAt: new Date(),
      pageTitle: 'Parsed From Server',
      domain: 'news.example.org',
      caseId,
    });

    const { POST } = await import('../../src/app/api/evidence/route');

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: targetUrl, caseId }),
      headers: { 'content-type': 'application/json' },
    });

    await POST(req);

    // The route must have fetched the target URL (server-side)
    expect(fetchSpy).toHaveBeenCalledWith(
      targetUrl,
      expect.objectContaining({}),
    );

    // Prisma create must have been called with pageTitle from <title> and domain derived from URL
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          url: targetUrl,
          pageTitle: 'Parsed From Server',
          domain: 'news.example.org',
          caseId,
          detectedAt: expect.any(Date),
        }),
      }),
    );
  });
});
