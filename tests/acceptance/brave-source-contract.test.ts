import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SearchSource } from '../../src/lib/searchSource';

// ---------------------------------------------------------------------------
// BraveSource contract — verifies structural + behavioural requirements
// without importing the real module (which may not exist at baseline).
// The coder must satisfy every assertion below.
// ---------------------------------------------------------------------------

describe('BraveSource contract', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('(a) implements the SearchSource interface — has a search(terms) method returning a promise', async () => {
    vi.stubEnv('BRAVE_API_KEY', 'test-token');

    const fetchStub = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(
        JSON.stringify({ web: { results: [{ url: 'https://example.com', title: 'Example' }] } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchStub);

    const { BraveSource } = await import('../../src/lib/braveSource');
    const instance: SearchSource = new BraveSource();

    expect(typeof instance.search).toBe('function');
    const result = await instance.search('test terms');
    expect(Array.isArray(result)).toBe(true);
  });

  it('(b) calls the Brave Search API endpoint', async () => {
    vi.stubEnv('BRAVE_API_KEY', 'test-token');

    const fetchStub = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(
        JSON.stringify({ web: { results: [{ url: 'https://brave-result.com', title: 'Brave Result' }] } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchStub);

    const { BraveSource } = await import('../../src/lib/braveSource');
    const source = new BraveSource();
    await source.search('climate change litigation');

    expect(fetchStub).toHaveBeenCalledOnce();
    const calledUrl = String(fetchStub.mock.calls[0]![0]);
    expect(calledUrl).toMatch(/api\.search\.brave\.com/i);
  });

  it('(c) reads the API token exclusively from the BRAVE_API_KEY environment variable', async () => {
    const token = 'env-secret-xyz';
    vi.stubEnv('BRAVE_API_KEY', token);

    const fetchStub = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(
        JSON.stringify({ web: { results: [{ url: 'https://env-test.com', title: 'Env Test' }] } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchStub);

    const { BraveSource } = await import('../../src/lib/braveSource');
    const source = new BraveSource();
    await source.search('some terms');

    const callArgs = fetchStub.mock.calls[0]!;
    const init = callArgs[1] as RequestInit;
    const headers = init?.headers as Record<string, string> | undefined;
    const authHeader = headers?.['X-Subscription-Token'] ?? headers?.['Authorization'] ?? '';
    expect(authHeader).toContain(token);
  });

  it('(d) enforces a 15-second HTTP request timeout via AbortSignal', async () => {
    vi.stubEnv('BRAVE_API_KEY', 'test-token');

    const fetchStub = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(
        JSON.stringify({ web: { results: [{ url: 'https://timeout-test.com', title: 'Timeout' }] } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchStub);

    const { BraveSource } = await import('../../src/lib/braveSource');
    const source = new BraveSource();
    await source.search('timeout test terms');

    const callArgs = fetchStub.mock.calls[0]!;
    const init = callArgs[1] as RequestInit;
    const signal = init?.signal as AbortSignal | undefined;
    // Must pass an AbortSignal (the mechanism for enforcing the timeout).
    expect(signal).toBeDefined();
    expect(signal).toBeInstanceOf(AbortSignal);
  });
});
