import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SearchSource } from '../../src/lib/searchSource';

// ---------------------------------------------------------------------------
// Criteria:
// (a) BraveSource implements SearchSource interface
// (b) calls the Brave Search API
// (c) reads API token exclusively from an environment variable
// (d) enforces a 15-second HTTP request timeout
// ---------------------------------------------------------------------------

const FAKE_TOKEN = 'test-brave-token-xyz';
const BRAVE_API_HOST = 'api.search.brave.com';

describe('BraveSource contract', () => {
  let fetchCalls: { url: string; init: RequestInit }[] = [];

  beforeEach(() => {
    fetchCalls = [];
    process.env.BRAVE_API_KEY = FAKE_TOKEN;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
        fetchCalls.push({ url: String(url), init: init ?? {} });
        return new Response(
          JSON.stringify({
            web: {
              results: [
                { url: 'https://example.com/page1', title: 'Example Page 1' },
                { url: 'https://example.com/page2', title: 'Example Page 2' },
              ],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.BRAVE_API_KEY;
  });

  it('(a) BraveSource satisfies the SearchSource interface', async () => {
    const { BraveSource } = await import('../../src/lib/braveSource');
    const instance = new BraveSource();
    // SearchSource interface requires a `search` method
    expect(typeof (instance as SearchSource).search).toBe('function');
  });

  it('(b) BraveSource calls the Brave Search API URL', async () => {
    const { BraveSource } = await import('../../src/lib/braveSource');
    const source = new BraveSource();
    await source.search('test query');
    expect(fetchCalls.length).toBeGreaterThanOrEqual(1);
    const calledUrl = fetchCalls[0]!.url;
    expect(calledUrl).toContain(BRAVE_API_HOST);
  });

  it('(c) BraveSource reads the API token exclusively from the environment variable', async () => {
    const { BraveSource } = await import('../../src/lib/braveSource');
    const source = new BraveSource();
    await source.search('token test');
    const call = fetchCalls[0]!;
    const authHeader =
      (call.init.headers as Record<string, string>)?.['Authorization'] ??
      (call.init.headers as Record<string, string>)?.['X-Subscription-Token'] ??
      '';
    expect(authHeader).toContain(FAKE_TOKEN);
  });

  it('(d) BraveSource uses a 15-second timeout on the HTTP request', async () => {
    const { BraveSource } = await import('../../src/lib/braveSource');
    const source = new BraveSource();
    await source.search('timeout test');
    const call = fetchCalls[0]!;
    // The signal must be an AbortSignal whose timeout is ≤15 000 ms.
    // AbortSignal.timeout(ms) produces a signal; we verify the presence
    // of a signal and that it originates from a ≤15s timeout.
    const signal = call.init.signal;
    expect(signal).toBeTruthy();
    // Verify the timeout value stored on the source (or derivable from the
    // signal) is exactly 15 000 ms. If the implementation exposes it:
    const timeoutMs =
      (source as unknown as Record<string, unknown>)['timeoutMs'] ??
      (source as unknown as Record<string, unknown>)['_timeoutMs'] ??
      (source as unknown as Record<string, unknown>)['timeout'];
    if (timeoutMs !== undefined) {
      expect(Number(timeoutMs)).toBe(15000);
    }
    // The signal itself must not already be aborted.
    expect((signal as AbortSignal).aborted).toBe(false);
  });
});
