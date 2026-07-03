import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('POST /api/evidence — URL add route', () => {
  const CASE_ID = 'case-abc-123';
  const TARGET_URL = 'https://example.com/exposed-page';
  const PAGE_TITLE = 'Exposed Page Title';

  let fetchSpy: ReturnType<typeof vi.fn>;
  let prismaCreateSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          `<html><head><title>${PAGE_TITLE}</title></head><body></body></html>`,
        ),
    });
    vi.stubGlobal('fetch', fetchSpy);

    prismaCreateSpy = vi.fn().mockResolvedValue({
      id: 'ev-1',
      url: TARGET_URL,
      detectedAt: new Date(),
      pageTitle: PAGE_TITLE,
      domain: 'example.com',
      caseId: CASE_ID,
    });

    vi.doMock('../../src/lib/prisma', () => ({
      default: {
        evidence: {
          create: prismaCreateSpy,
        },
      },
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('creates an Evidence row with all five fields non-null when a URL is submitted to a case', async () => {
    const { POST } = await import('../../src/app/api/evidence/route');

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: TARGET_URL, caseId: CASE_ID }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    expect(prismaCreateSpy).toHaveBeenCalledOnce();
    const createArgs = prismaCreateSpy.mock.calls[0]![0] as {
      data: {
        url: string;
        detectedAt: Date | string;
        pageTitle: string;
        domain: string;
        caseId: string;
      };
    };
    const data = createArgs.data;

    expect(data.url).toBeTruthy();
    expect(data.detectedAt).toBeTruthy();
    expect(data.pageTitle).toBeTruthy();
    expect(data.domain).toBeTruthy();
    expect(data.caseId).toBeTruthy();
  });

  it('fetches the target URL server-side and parses <title> into pageTitle', async () => {
    const { POST } = await import('../../src/app/api/evidence/route');

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: TARGET_URL, caseId: CASE_ID }),
    });

    await POST(req);

    // Server must have fetched the target URL
    expect(fetchSpy).toHaveBeenCalledOnce();
    const fetchedUrl = fetchSpy.mock.calls[0]![0] as string;
    expect(fetchedUrl).toBe(TARGET_URL);

    // pageTitle must be extracted from the <title> tag
    const createArgs = prismaCreateSpy.mock.calls[0]![0] as {
      data: { pageTitle: string };
    };
    expect(createArgs.data.pageTitle).toBe(PAGE_TITLE);
  });

  it('derives domain from the submitted URL and stamps detectedAt with a server timestamp', async () => {
    const before = new Date();
    const { POST } = await import('../../src/app/api/evidence/route');

    const req = new Request('http://localhost/api/evidence', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: TARGET_URL, caseId: CASE_ID }),
    });

    await POST(req);
    const after = new Date();

    const createArgs = prismaCreateSpy.mock.calls[0]![0] as {
      data: { domain: string; detectedAt: Date };
    };

    // domain must be parsed from URL hostname, not provided by client
    expect(createArgs.data.domain).toBe('example.com');

    // detectedAt must be a timestamp within the server-execution window
    const detectedAt = new Date(createArgs.data.detectedAt);
    expect(detectedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(detectedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
