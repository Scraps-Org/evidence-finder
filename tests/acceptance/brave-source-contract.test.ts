import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// BraveSource contract tests
// Verifies structural and behavioural requirements WITHOUT hitting the network.
// We stub globalThis.fetch so no real HTTP occurs, but we do NOT mock the
// BraveSource class itself — the layer under test is BraveSource.
// ---------------------------------------------------------------------------

describe('BraveSource – SearchSource contract', () => {
  const FAKE_TOKEN = 'test-brave-token-abc'
  const FAKE_TERMS = 'personal injury negligence'

  const makeFakeResponse = () => ({
    web: {
      results: [
        { url: 'https://example.com/case1', title: 'Case Result 1' },
        { url: 'https://example.com/case2', title: 'Case Result 2' },
      ],
    },
  })

  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchSpy = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(JSON.stringify(makeFakeResponse()), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchSpy)
    process.env.BRAVE_API_KEY = FAKE_TOKEN
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.BRAVE_API_KEY
  })

  it('(a) implements the SearchSource interface – exposes a search(terms) method', async () => {
    const { BraveSource } = await import('../../src/lib/braveSource')
    const source = new BraveSource()
    expect(typeof source.search).toBe('function')
  })

  it('(b) calls the Brave Search API URL', async () => {
    const { BraveSource } = await import('../../src/lib/braveSource')
    const source = new BraveSource()
    await source.search(FAKE_TERMS)

    expect(fetchSpy).toHaveBeenCalledOnce()
    const [calledUrl] = fetchSpy.mock.calls[0]!
    const urlStr = typeof calledUrl === 'string' ? calledUrl : (calledUrl as URL).toString()
    expect(urlStr).toContain('api.search.brave.com')
  })

  it('(c) reads the API token exclusively from an environment variable (Authorization header)', async () => {
    const { BraveSource } = await import('../../src/lib/braveSource')
    const source = new BraveSource()
    await source.search(FAKE_TERMS)

    const [, calledInit] = fetchSpy.mock.calls[0]!
    const headers = new Headers((calledInit as RequestInit | undefined)?.headers)
    const authHeader = headers.get('X-Subscription-Token') ?? headers.get('Authorization') ?? ''
    expect(authHeader).toContain(FAKE_TOKEN)
  })

  it('(d) enforces a 15-second HTTP request timeout via AbortSignal', async () => {
    const { BraveSource } = await import('../../src/lib/braveSource')
    const source = new BraveSource()
    await source.search(FAKE_TERMS)

    const [, calledInit] = fetchSpy.mock.calls[0]!
    const signal = (calledInit as RequestInit | undefined)?.signal
    // The signal must exist (an AbortSignal, created from a 15 000 ms timeout)
    expect(signal).toBeDefined()
    expect(signal).not.toBeNull()
  })

  it('(d-timeout-value) AbortSignal timeout is configured to 15 000 ms', async () => {
    // We verify the timeout by checking that the signal is NOT already aborted
    // at call time (i.e. > 0 ms remain) and that a re-created signal with 1 ms
    // fires faster — the cleanest portable check without depending on internal
    // AbortSignal.timeout() identity is to inspect that fetch was called with
    // a non-aborted signal whose timeout was supplied via AbortSignal.timeout.
    // Since AbortSignal.timeout is the standard web API for exactly this, we
    // spy on it to assert the 15 000 argument.
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout')
    const { BraveSource } = await import('../../src/lib/braveSource')
    const source = new BraveSource()
    await source.search(FAKE_TERMS)
    expect(timeoutSpy).toHaveBeenCalledWith(15000)
    timeoutSpy.mockRestore()
  })
})
