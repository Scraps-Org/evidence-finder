import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('POST /api/evidence - manual URL evidence creation', () => {
  const FAKE_TITLE = 'Example Domain Title';
  const FAKE_URL = 'https://example.com/article';
  const FAKE_CASE_ID = 'case-abc-123';

  let createdEvidence: {
    url: string;
    pageTitle: string;
    domain: string;
    detectedAt: Date;
    caseId: string;
  } | null = null;

  beforeEach(() => {
    createdEvidence = null;

    vi.stubGlobal(
      'fetch',
      vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
        new Response(
          `<html><head><title>${FAKE_TITLE}</title></head><body>content</body></html>`,
          { status: 200, headers: { 'content-type': 'text/html' } }
        )
      )
    );

    vi.mock('../../src/lib/prisma', () => ({
      default: {
        evidence: {
          create: vi.fn(async (args: { data: { url: string; pageTitle: string; domain: string; detectedAt: Date; caseId: string } }) => {
            createdEvidence = args.data;
            return { id: 'ev-1', ...args.data };
          }),
        },
      },
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it('fetches the target page server-side', async () => {
    const { POST } = await import('../../src/app/api/evidence/route');
    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: FAKE_URL, caseId: FAKE_CASE_ID }),
      headers: { 'content-type': 'application/json' },
    });
    await POST(req);
    const fetchMock = vi.mocked(globalThis.fetch as ReturnType<typeof vi.fn>);
    expect(fetchMock).toHaveBeenCalledWith(FAKE_URL);
  });

  it('parses the <title> tag into pageTitle', async () => {
    const { POST } = await import('../../src/app/api/evidence/route');
    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: FAKE_URL, caseId: FAKE_CASE_ID }),
      headers: { 'content-type': 'application/json' },
    });
    await POST(req);
    expect(createdEvidence?.pageTitle).toBe(FAKE_TITLE);
  });

  it('derives domain from the URL hostname', async () => {
    const { POST } = await import('../../src/app/api/evidence/route');
    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: FAKE_URL, caseId: FAKE_CASE_ID }),
      headers: { 'content-type': 'application/json' },
    });
    await POST(req);
    expect(createdEvidence?.domain).toBe('example.com');
  });

  it('stamps detectedAt with a server-side timestamp close to now', async () => {
    const before = new Date();
    const { POST } = await import('../../src/app/api/evidence/route');
    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: FAKE_URL, caseId: FAKE_CASE_ID }),
      headers: { 'content-type': 'application/json' },
    });
    await POST(req);
    const after = new Date();
    const ts = createdEvidence?.detectedAt;
    expect(ts).toBeInstanceOf(Date);
    expect((ts as Date).getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect((ts as Date).getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('persists a new Evidence row with the correct caseId', async () => {
    const { POST } = await import('../../src/app/api/evidence/route');
    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      body: JSON.stringify({ url: FAKE_URL, caseId: FAKE_CASE_ID }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(createdEvidence?.caseId).toBe(FAKE_CASE_ID);
    expect(createdEvidence?.url).toBe(FAKE_URL);
    expect(res.status).toBe(201);
  });
});
