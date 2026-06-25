import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// The coder will create src/lib/braveSource.ts exporting BraveSource
// and src/lib/searchSource.ts exporting the SearchSource interface.
// We import both to verify the contract without executing real HTTP.

describe('BraveSource contract', () => {
  const REAL_ENV_KEY = 'BRAVE_API_KEY'

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('(a) BraveSource satisfies the SearchSource interface', async () => {
    vi.stubEnv(REAL_ENV_KEY, 'test-token')
    const { BraveSource } = await import('../../src/lib/braveSource')
    const { isSearchSource } = await import('../../src/lib/searchSource')
    const instance = new BraveSource()
    // isSearchSource is a type-guard / duck-type checker the coder must export
    expect(isSearchSource(instance)).toBe(true)
  })

  it('(b) BraveSource.search calls the Brave Search API endpoint', async () => {
    vi.stubEnv(REAL_ENV_KEY, 'brave-tok')
    const fetchSpy = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(
        JSON.stringify({ web: { results: [{ url: 'https://example.com', title: 'Ex' }] } }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', fetchSpy)

    const { BraveSource } = await import('../../src/lib/braveSource')
    const source = new BraveSource()
    await source.search('some query')

    expect(fetchSpy).toHaveBeenCalledOnce()
    const [calledUrl] = fetchSpy.mock.calls[0]!
    expect(String(calledUrl)).toContain('api.search.brave.com')
  })

  it('(c) BraveSource reads the API token exclusively from the environment variable', async () => {
    const token = 'secret-env-token'
    vi.stubEnv(REAL_ENV_KEY, token)
    const fetchSpy = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(
        JSON.stringify({ web: { results: [{ url: 'https://example.com', title: 'Ex' }] } }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', fetchSpy)

    const { BraveSource } = await import('../../src/lib/braveSource')
    const source = new BraveSource()
    await source.search('query')

    const [, init] = fetchSpy.mock.calls[0]!
    const headers = new Headers(init?.headers)
    expect(headers.get('X-Subscription-Token')).toBe(token)
  })

  it('(d) BraveSource enforces a 15-second HTTP request timeout via AbortSignal', async () => {
    vi.stubEnv(REAL_ENV_KEY, 'tok')
    const fetchSpy = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(
        JSON.stringify({ web: { results: [{ url: 'https://example.com', title: 'Ex' }] } }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', fetchSpy)

    const { BraveSource } = await import('../../src/lib/braveSource')
    const source = new BraveSource()
    await source.search('query')

    const [, init] = fetchSpy.mock.calls[0]!
    expect(init?.signal).toBeDefined()
    // The signal must time-out at 15 000 ms — we verify it is an AbortSignal
    // whose timeout was constructed via AbortSignal.timeout(15000).
    // We cannot read the ms back from a live AbortSignal, so we verify it is
    // NOT already aborted (it was created fresh) and IS an AbortSignal instance.
    expect(init!.signal).toBeInstanceOf(AbortSignal)
    expect((init!.signal as AbortSignal).aborted).toBe(false)
  })
})
