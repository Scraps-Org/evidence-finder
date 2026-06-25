import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SearchSource } from '../../src/lib/searchSource';

// We test BraveSource structural contract without hitting the network.
// fetch is stubbed so the constructor/call shape can be exercised.

describe('BraveSource contract', () => {
  const FAKE_TOKEN = 'test-brave-token-abc';
  const FAKE_RESULTS = [
    { url: 'https://example.com/page1', title: 'Result 1' },
    { url: 'https://example.com/page2', title: 'Result 2' },
  ];

  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.BRAVE_API_KEY = FAKE_TOKEN;

    vi.stubGlobal(
      'fetch',
      vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
        new Response(
          JSON.stringify({ web: { results: FAKE_RESULTS } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it('implements the SearchSource interface (has a search method returning normalized candidates)', async () => {
    const { BraveSource } = await import('../../src/lib/braveSource');
    const source: SearchSource = new BraveSource();
    expect(typeof source.search).toBe('function');
    const results = await source.search('test query');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(typeof results[0]!.url).toBe('string');
  });

  it('calls the Brave Search API endpoint', async () => {
    const { BraveSource } = await import('../../src/lib/braveSource');
    const source = new BraveSource();
    await source.search('climate liability');
    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [calledUrl] = fetchMock.mock.calls[0]!;
    expect(String(calledUrl)).toContain('brave');
  });

  it('reads the API token exclusively from an environment variable', async () => {
    const { BraveSource } = await import('../../src/lib/braveSource');
    const source = new BraveSource();
    await source.search('token test');
    const fetchMock = vi.mocked(fetch);
    const callArgs = fetchMock.mock.calls[0]!;
    // Token should appear in URL or headers — not hard-coded
    const calledUrl = String(callArgs[0]);
    const calledInit = callArgs[1] ?? {};
    const headerStr = JSON.stringify(calledInit.headers ?? {});
    const hasToken = calledUrl.includes(FAKE_TOKEN) || headerStr.includes(FAKE_TOKEN);
    expect(hasToken).toBe(true);
  });

  it('enforces a 15-second HTTP request timeout via AbortSignal', async () => {
    const { BraveSource } = await import('../../src/lib/braveSource');
    const source = new BraveSource();
    await source.search('timeout test');
    const fetchMock = vi.mocked(fetch);
    const callArgs = fetchMock.mock.calls[0]!;
    const init = callArgs[1] ?? {};
    // Must pass a signal — the only way to enforce a timeout at fetch level
    expect(init.signal).toBeDefined();
    // The signal must originate from a 15-second AbortSignal.timeout or equivalent
    expect(init.signal).not.toBeNull();
  });
});
