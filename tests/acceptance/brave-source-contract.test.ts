import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SearchSource } from '../../src/lib/searchSource';

describe('BraveSource contract', () => {
  const FAKE_TOKEN = 'test-brave-token-xyz';
  const FAKE_RESULTS = [
    { url: 'https://example.com/a', title: 'Result A', snippet: 'Snippet A' },
    { url: 'https://example.com/b', title: 'Result B', snippet: 'Snippet B' },
  ];

  beforeEach(() => {
    vi.stubEnv('BRAVE_API_KEY', FAKE_TOKEN);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('implements the SearchSource interface (has a search method returning SearchResult[])', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<[RequestInfo | URL, RequestInit | undefined], Promise<Response>>().mockResolvedValue(
        new Response(
          JSON.stringify({ web: { results: FAKE_RESULTS } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    const { BraveSource } = await import('../../src/lib/braveSource');
    const source: SearchSource = new BraveSource();
    expect(typeof source.search).toBe('function');
    const results = await source.search('test query');
    expect(Array.isArray(results)).toBe(true);
  });

  it('calls the Brave Search API endpoint', async () => {
    const mockFetch = vi.fn<[RequestInfo | URL, RequestInit | undefined], Promise<Response>>().mockResolvedValue(
      new Response(
        JSON.stringify({ web: { results: FAKE_RESULTS } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', mockFetch);

    const { BraveSource } = await import('../../src/lib/braveSource');
    const source = new BraveSource();
    await source.search('climate change litigation');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [calledUrl] = mockFetch.mock.calls[0]!;
    const urlStr = calledUrl instanceof URL ? calledUrl.toString() : String(calledUrl);
    expect(urlStr).toMatch(/api\.search\.brave\.com/);
  });

  it('reads the API token exclusively from the BRAVE_API_KEY environment variable', async () => {
    const customToken = 'env-driven-token-abc';
    vi.stubEnv('BRAVE_API_KEY', customToken);

    const mockFetch = vi.fn<[RequestInfo | URL, RequestInit | undefined], Promise<Response>>().mockResolvedValue(
      new Response(
        JSON.stringify({ web: { results: FAKE_RESULTS } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', mockFetch);

    const { BraveSource } = await import('../../src/lib/braveSource');
    const source = new BraveSource();
    await source.search('some query');

    const [, calledInit] = mockFetch.mock.calls[0]!;
    const headers = calledInit?.headers;
    const headersObj = headers instanceof Headers ? headers : new Headers(headers as HeadersInit);
    const authHeader =
      headersObj.get('X-Subscription-Token') ??
      headersObj.get('Authorization') ??
      headersObj.get('x-subscription-token') ?? '';
    expect(authHeader).toContain(customToken);
  });

  it('enforces a 15-second (15000ms) HTTP request timeout via AbortSignal', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<[RequestInfo | URL, RequestInit | undefined], Promise<Response>>().mockResolvedValue(
        new Response(
          JSON.stringify({ web: { results: FAKE_RESULTS } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');

    const { BraveSource } = await import('../../src/lib/braveSource');
    const source = new BraveSource();
    await source.search('timeout test query');

    const usedTimeout = timeoutSpy.mock.calls.some(([ms]) => ms === 15000);
    expect(usedTimeout, 'AbortSignal.timeout(15000) must be called for the HTTP request').toBe(true);
  });
});
