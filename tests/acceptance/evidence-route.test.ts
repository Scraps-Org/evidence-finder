import { describe, it, expect, vi, beforeEach } from 'vitest';

// Import the real route handler — do NOT mock the layer under test
import { POST } from '../../src/app/api/evidence/route';

const mockCreate = vi.fn();
const mockFindUnique = vi.fn();

vi.mock('../../src/lib/prisma', () => ({
  default: {
    evidence: {
      create: mockCreate,
    },
    case: {
      findUnique: mockFindUnique,
    },
  },
}));

// We DO mock global fetch because the SERVER-SIDE fetch of the target URL
// is the behaviour under test — the route must call it, extract title+domain,
// stamp detectedAt. We capture the call and verify it happened server-side.
const SAMPLE_URL = 'https://example.com/page';
const SAMPLE_TITLE = 'Example Page Title';
const SAMPLE_CASE_ID = 'case-abc-123';

function makeHtmlResponse(title: string): Response {
  return new Response(`<html><head><title>${title}</title></head><body></body></html>`, {
    status: 200,
    headers: { 'content-type': 'text/html' },
  });
}

describe('POST /api/evidence — server-side fetch + metadata extraction', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Stub global.fetch so the route's server-side fetch is intercepted
    vi.stubGlobal('fetch', vi.fn<[RequestInfo | URL, RequestInit | undefined], Promise<Response>>(
      async (input) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
        if (url === SAMPLE_URL) return makeHtmlResponse(SAMPLE_TITLE);
        return new Response('not found', { status: 404 });
      }
    ));

    mockFindUnique.mockResolvedValue({ id: SAMPLE_CASE_ID });
    mockCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'ev-001',
      ...data,
    }));
  });

  it('creates an Evidence row with all five non-null fields: url, detectedAt, pageTitle, domain, caseId', async () => {
    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: SAMPLE_URL, caseId: SAMPLE_CASE_ID }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req);

    // Route must return 2xx
    expect(res.status, 'route should return 2xx on valid input').toBeGreaterThanOrEqual(200);
    expect(res.status, 'route should return 2xx on valid input').toBeLessThan(300);

    // Prisma create MUST have been called with all five fields non-null
    expect(mockCreate).toHaveBeenCalledOnce();
    const callArg = mockCreate.mock.calls[0]?.[0] as { data: Record<string, unknown> } | undefined;
    expect(callArg, 'prisma.evidence.create must be called with a data object').toBeDefined();
    const data = callArg!.data;

    expect(data['url'], 'url must be non-null in persisted row').toBe(SAMPLE_URL);
    expect(data['caseId'], 'caseId must be non-null in persisted row').toBe(SAMPLE_CASE_ID);
    expect(data['pageTitle'], 'pageTitle must be non-null — extracted from <title> tag').toBeTruthy();
    expect(data['domain'], 'domain must be non-null — derived from URL parsing').toBeTruthy();
    expect(data['detectedAt'], 'detectedAt must be non-null — server timestamp').toBeTruthy();
  });

  it('extracts pageTitle from the HTML <title> tag of the fetched page', async () => {
    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: SAMPLE_URL, caseId: SAMPLE_CASE_ID }),
      headers: { 'content-type': 'application/json' },
    });

    await POST(req);

    const callArg = mockCreate.mock.calls[0]?.[0] as { data: Record<string, unknown> } | undefined;
    expect(callArg).toBeDefined();
    expect(callArg!.data['pageTitle']).toBe(SAMPLE_TITLE);
  });

  it('derives domain via URL parsing (hostname of the submitted URL)', async () => {
    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: SAMPLE_URL, caseId: SAMPLE_CASE_ID }),
      headers: { 'content-type': 'application/json' },
    });

    await POST(req);

    const callArg = mockCreate.mock.calls[0]?.[0] as { data: Record<string, unknown> } | undefined;
    expect(callArg).toBeDefined();
    // hostname of https://example.com/page is 'example.com'
    expect(callArg!.data['domain']).toBe('example.com');
  });

  it('stamps detectedAt as a server-side Date at the time of the request', async () => {
    const before = new Date();

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: SAMPLE_URL, caseId: SAMPLE_CASE_ID }),
      headers: { 'content-type': 'application/json' },
    });

    await POST(req);

    const after = new Date();
    const callArg = mockCreate.mock.calls[0]?.[0] as { data: Record<string, unknown> } | undefined;
    expect(callArg).toBeDefined();
    const detectedAt = callArg!.data['detectedAt'];
    expect(detectedAt, 'detectedAt must be a Date instance').toBeInstanceOf(Date);
    const ts = (detectedAt as Date).getTime();
    expect(ts).toBeGreaterThanOrEqual(before.getTime());
    expect(ts).toBeLessThanOrEqual(after.getTime());
  });

  it('performs a server-side fetch of the submitted URL (not a client-side fetch)', async () => {
    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: SAMPLE_URL, caseId: SAMPLE_CASE_ID }),
      headers: { 'content-type': 'application/json' },
    });

    await POST(req);

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalled();
    const fetchedUrls = fetchMock.mock.calls.map((c) => {
      const arg = c[0];
      if (typeof arg === 'string') return arg;
      if (arg instanceof URL) return arg.href;
      return (arg as Request).url;
    });
    expect(fetchedUrls).toContain(SAMPLE_URL);
  });
});
