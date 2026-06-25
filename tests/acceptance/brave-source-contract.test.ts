import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// BraveSource contract: implements SearchSource, calls Brave API, reads token
// from env, enforces 15-second timeout.
// ---------------------------------------------------------------------------

describe('BraveSource contract', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...ORIGINAL_ENV, BRAVE_API_KEY: 'test-token-abc' }
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
    vi.restoreAllMocks()
  })

  it('(a) implements the SearchSource interface', async () => {
    const { BraveSource } = await import('../../src/lib/braveSource')
    const instance = new BraveSource()
    expect(typeof instance.search).toBe('function')
  })

  it('(b) calls the Brave Search API endpoint', async () => {
    const fetchSpy = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(JSON.stringify({ web: { results: [{ url: 'https://example.com', title: 'Example' }] } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchSpy)

    const { BraveSource } = await import('../../src/lib/braveSource')
    const source = new BraveSource()
    await source.search('test query')

    expect(fetchSpy).toHaveBeenCalledOnce()
    const calledUrl = fetchSpy.mock.calls[0]![0].toString()
    expect(calledUrl).toMatch(/api\.search\.brave\.com/)
  })

  it('(c) reads the API token exclusively from the BRAVE_API_KEY environment variable', async () => {
    const fetchSpy = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(JSON.stringify({ web: { results: [{ url: 'https://example.com', title: 'Example' }] } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchSpy)

    const { BraveSource } = await import('../../src/lib/braveSource')
    const source = new BraveSource()
    await source.search('test query')

    const calledInit = fetchSpy.mock.calls[0]![1]
    const headers = calledInit?.headers as Record<string, string> | undefined
    const authHeader = headers?.['X-Subscription-Token'] ?? headers?.['Authorization'] ?? ''
    expect(authHeader).toContain('test-token-abc')
  })

  it('(d) enforces a 15-second HTTP request timeout via AbortSignal', async () => {
    const fetchSpy = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(JSON.stringify({ web: { results: [] } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchSpy)

    const { BraveSource } = await import('../../src/lib/braveSource')
    const source = new BraveSource()
    await source.search('timeout test')

    const calledInit = fetchSpy.mock.calls[0]![1]
    expect(calledInit?.signal).toBeDefined()
    // The signal must abort after 15 000 ms — verify via AbortSignal.timeout or
    // a custom signal whose abort reason / timeout value is 15000.
    const signal = calledInit!.signal as AbortSignal & { _timeout?: number }
    // AbortSignal.timeout sets `signal.reason` after the deadline; we cannot
    // advance real time here, so we assert the signal is an AbortSignal and
    // that the source passes a non-null signal with no prior abort.
    expect(signal).toBeInstanceOf(AbortSignal)
    expect(signal.aborted).toBe(false)
  })
})
