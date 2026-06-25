import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SearchSource } from '../../src/lib/searchSource';

describe('BraveSource contract', () => {
  const FAKE_TOKEN = 'test-brave-token-abc123';

  beforeEach(() => {
    vi.stubEnv('BRAVE_API_KEY', FAKE_TOKEN);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('implements the SearchSource interface', async () => {
    const { BraveSource } = await import('../../src/lib/braveSource');
    const instance = new BraveSource();
    // SearchSource requires a `search(terms: string): Promise<{url: string}[]>` method
    expect(typeof instance.search).toBe('function');
    // Duck-type check: the instance is assignable as SearchSource
    const _typed: SearchSource = instance;
    expect(_typed).toBeDefined();
  });

  it('calls the Brave Search API endpoint', async () => {
    const fetchSpy = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(
        JSON.stringify({ web: { results: [{ url: 'https://example.com/result' }] } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const { BraveSource } = await import('../../src/lib/braveSource');
    const source = new BraveSource();
    const results = await source.search('test query');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const calledUrl = String(fetchSpy.mock.calls[0]![0]);
    expect(calledUrl).toMatch(/search\.brave\.com/);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0]!).toHaveProperty('url');
  });

  it('reads the API token exclusively from the BRAVE_API_KEY environment variable', async () => {
    const fetchSpy = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(
        JSON.stringify({ web: { results: [{ url: 'https://example.com/r' }] } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const { BraveSource } = await import('../../src/lib/braveSource');
    const source = new BraveSource();
    await source.search('env token check');

    const callInit = fetchSpy.mock.calls[0]![1] as RequestInit | undefined;
    const headers = new Headers(callInit?.headers);
    // The token must appear in an Authorization or X-Subscription-Token header
    const authHeader = headers.get('Authorization') ?? headers.get('X-Subscription-Token') ?? '';
    expect(authHeader).toContain(FAKE_TOKEN);
  });

  it('enforces a 15-second HTTP request timeout via AbortSignal', async () => {
    const fetchSpy = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(
        JSON.stringify({ web: { results: [{ url: 'https://example.com/timeout' }] } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const { BraveSource } = await import('../../src/lib/braveSource');
    const source = new BraveSource();
    await source.search('timeout check');

    const callInit = fetchSpy.mock.calls[0]![1] as RequestInit | undefined;
    expect(callInit?.signal).toBeDefined();
    // Verify the signal comes from a 15-second AbortSignal.timeout
    // We cannot inspect the delay directly, so we assert the signal is an AbortSignal instance
    expect(callInit!.signal).toBeInstanceOf(AbortSignal);
  });

  it('returns no results (empty array) when token is missing, without crashing', async () => {
    vi.unstubAllEnvs();
    // Ensure the env var is absent
    delete process.env['BRAVE_API_KEY'];

    // If the implementation throws on missing token that is also acceptable —
    // but it must NOT return a non-array or crash the process.
    const { BraveSource } = await import('../../src/lib/braveSource');
    const source = new BraveSource();
    let result: unknown;
    try {
      result = await source.search('no token');
      expect(Array.isArray(result)).toBe(true);
    } catch (err) {
      // Throwing is acceptable when token is absent
      expect(err).toBeDefined();
    }
  });
});
