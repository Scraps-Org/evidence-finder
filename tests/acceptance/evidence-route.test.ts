import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Helpers / stubs
// ---------------------------------------------------------------------------

const mockCreate = vi.fn();
const mockPrismaEvidence = { create: mockCreate };

vi.mock('../../src/lib/prisma', () => ({
  default: { evidence: mockPrismaEvidence },
}));

// ---------------------------------------------------------------------------
// fetch stub — simulates a remote page with a <title> tag
// ---------------------------------------------------------------------------

const FAKE_HTML = '<html><head><title>Example Domain</title></head><body></body></html>';

const makeFetchStub = (html: string = FAKE_HTML) =>
  vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
    new Response(html, { status: 200, headers: { 'content-type': 'text/html' } }),
  );

describe('POST /api/evidence — server route handler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-25T12:00:00.000Z'));
    mockCreate.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('fetches the target page, extracts title + domain, stamps detectedAt, and persists via Prisma', async () => {
    const fetchStub = makeFetchStub();
    vi.stubGlobal('fetch', fetchStub);

    mockCreate.mockResolvedValue({
      id: 'ev-1',
      url: 'https://example.com/article',
      pageTitle: 'Example Domain',
      domain: 'example.com',
      detectedAt: new Date('2026-06-25T12:00:00.000Z'),
      caseId: 'case-abc',
    });

    const { POST } = await import('../../src/app/api/evidence/route');

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com/article', caseId: 'case-abc' }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    // (a) fetched the target URL server-side
    expect(fetchStub).toHaveBeenCalledWith('https://example.com/article');

    // (b) pageTitle parsed from <title>
    // (c) domain derived from hostname
    // (d) detectedAt stamped with server-side timestamp
    // (e) Evidence row persisted via Prisma
    expect(mockCreate).toHaveBeenCalledOnce();
    const createArg = mockCreate.mock.calls[0]![0] as {
      data: { url: string; pageTitle: string; domain: string; detectedAt: Date; caseId: string };
    };
    expect(createArg.data.url).toBe('https://example.com/article');
    expect(createArg.data.pageTitle).toBe('Example Domain');
    expect(createArg.data.domain).toBe('example.com');
    expect(createArg.data.detectedAt).toEqual(new Date('2026-06-25T12:00:00.000Z'));
    expect(createArg.data.caseId).toBe('case-abc');

    const body = await res.json() as { pageTitle?: string; domain?: string };
    expect(body.pageTitle).toBe('Example Domain');
    expect(body.domain).toBe('example.com');
  });

  it('handles a page with no <title> tag gracefully (pageTitle falls back to empty string or null)', async () => {
    const fetchStub = makeFetchStub('<html><head></head><body>no title here</body></html>');
    vi.stubGlobal('fetch', fetchStub);

    mockCreate.mockResolvedValue({
      id: 'ev-2',
      url: 'https://notitle.io/',
      pageTitle: '',
      domain: 'notitle.io',
      detectedAt: new Date('2026-06-25T12:00:00.000Z'),
      caseId: 'case-xyz',
    });

    const { POST } = await import('../../src/app/api/evidence/route');

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://notitle.io/', caseId: 'case-xyz' }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledOnce();
    const createArg = mockCreate.mock.calls[0]![0] as {
      data: { domain: string };
    };
    expect(createArg.data.domain).toBe('notitle.io');
  });
});
