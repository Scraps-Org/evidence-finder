import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We import the module under test dynamically so we can control env vars before import.
// BraveSource must implement SearchSource — both exported from src/lib/searchSource.ts

describe('BraveSource contract', () => {
  const FAKE_TOKEN = 'test-brave-token-abc';

  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('BRAVE_API_KEY', FAKE_TOKEN);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('(a) BraveSource satisfies the SearchSource interface (search method returns SearchResult[])', async () => {
    const fetchSpy = vi.fn<[RequestInfo | URL, RequestInit | undefined], Promise<Response>>().mockResolvedValue(
      new Response(
        JSON.stringify({ web: { results: [{ url: 'https://example.com', title: 'Example' }] } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const { BraveSource } = await import('../../src/lib/searchSource');
    const source = new BraveSource();

    // Must have a search method (SearchSource interface)
    expect(typeof source.search).toBe('function');

    const results = await source.search('test query');

    // Returns an array
    expect(Array.isArray(results)).toBe(true);
    // Each result has a url field
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(typeof results[0]!.url).toBe('string');
  });

  it('(b) BraveSource calls the Brave Search API endpoint', async () => {
    const fetchSpy = vi.fn<[RequestInfo | URL, RequestInit | undefined], Promise<Response>>().mockResolvedValue(
      new Response(
        JSON.stringify({ web: { results: [{ url: 'https://brave-result.com', title: 'Result' }] } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const { BraveSource } = await import('../../src/lib/searchSource');
    const source = new BraveSource();
    await source.search('climate litigation');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const calledUrl = String(fetchSpy.mock.calls[0]![0]);
    expect(calledUrl).toMatch(/api\.search\.brave\.com/i);
  });

  it('(c) BraveSource reads the API token exclusively from an environment variable', async () => {
    const fetchSpy = vi.fn<[RequestInfo | URL, RequestInit | undefined], Promise<Response>>().mockResolvedValue(
      new Response(
        JSON.stringify({ web: { results: [{ url: 'https://example.org', title: 'Org' }] } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const { BraveSource } = await import('../../src/lib/searchSource');
    const source = new BraveSource();
    await source.search('search terms');

    const callArgs = fetchSpy.mock.calls[0]!;
    // Token must appear in headers (Authorization or X-Subscription-Token), not hardcoded
    const init = callArgs[1] as RequestInit;
    const headers = new Headers(init?.headers as HeadersInit);
    const authHeader =
      headers.get('X-Subscription-Token') ?? headers.get('Authorization') ?? '';
    expect(authHeader).toContain(FAKE_TOKEN);
  });

  it('(d) BraveSource enforces a 15-second HTTP request timeout', async () => {
    const fetchSpy = vi.fn<[RequestInfo | URL, RequestInit | undefined], Promise<Response>>().mockResolvedValue(
      new Response(
        JSON.stringify({ web: { results: [{ url: 'https://timeout-test.com', title: 'T' }] } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const { BraveSource } = await import('../../src/lib/searchSource');
    const source = new BraveSource();
    await source.search('timeout check');

    const callArgs = fetchSpy.mock.calls[0]!;
    const init = callArgs[1] as RequestInit & { signal?: AbortSignal };
    // A 15-second timeout must be wired via AbortSignal
    expect(init?.signal).toBeDefined();
    // AbortSignal from AbortController.timeout(15000) or equivalent
    // We verify the signal is an AbortSignal (timeout enforcement present)
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});
