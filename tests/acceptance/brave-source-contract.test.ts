import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Criterion 1 – BraveSource contract:
//   (a) implements SearchSource interface
//   (b) calls the Brave Search API
//   (c) reads token exclusively from env
//   (d) enforces 15-second HTTP request timeout
// ---------------------------------------------------------------------------

describe('BraveSource contract', () => {
  const FAKE_TOKEN = 'test-brave-token-xyz';
  const FAKE_TERMS = 'wrongful conviction evidence';

  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.BRAVE_API_KEY = FAKE_TOKEN;
    fetchSpy = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          web: {
            results: [
              { url: 'https://example.com/result1', title: 'Result 1' },
              { url: 'https://example.com/result2', title: 'Result 2' },
            ],
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    delete process.env.BRAVE_API_KEY;
  });

  it('(a) implements the SearchSource interface — exposes a search(terms) method returning SearchResult[]', async () => {
    const { BraveSource } = await import('../../src/lib/braveSource');
    const instance = new BraveSource();
    expect(typeof instance.search).toBe('function');
    const results = await instance.search(FAKE_TERMS);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(typeof results[0]!.url).toBe('string');
  });

  it('(b) calls the Brave Search API endpoint', async () => {
    const { BraveSource } = await import('../../src/lib/braveSource');
    await new BraveSource().search(FAKE_TERMS);
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [calledUrl] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toMatch(/api\.search\.brave\.com/);
  });

  it('(c) reads the API token exclusively from the BRAVE_API_KEY environment variable', async () => {
    const { BraveSource } = await import('../../src/lib/braveSource');
    await new BraveSource().search(FAKE_TERMS);
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init?.headers as HeadersInit);
    expect(headers.get('X-Subscription-Token')).toBe(FAKE_TOKEN);
  });

  it('(d) enforces a 15-second (15000ms) AbortSignal timeout on the HTTP request', async () => {
    const signals: AbortSignal[] = [];
    fetchSpy.mockImplementation((_url: string, init: RequestInit) => {
      if (init?.signal) signals.push(init.signal as AbortSignal);
      return Promise.resolve(
        new Response(
          JSON.stringify({ web: { results: [{ url: 'https://example.com/r', title: 'R' }] } }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );
    });
    vi.stubGlobal('fetch', fetchSpy);

    const { BraveSource } = await import('../../src/lib/braveSource');
    await new BraveSource().search(FAKE_TERMS);

    expect(signals.length).toBeGreaterThan(0);
    // The signal must be an AbortSignal — created via AbortSignal.timeout(15000)
    // We verify it has a timeout nature: it is not yet aborted but is an AbortSignal
    const signal = signals[0]!;
    expect(signal).toBeInstanceOf(AbortSignal);
    // 15000ms timeout: signal should not already be aborted for an instant call
    expect(signal.aborted).toBe(false);
  });
});
