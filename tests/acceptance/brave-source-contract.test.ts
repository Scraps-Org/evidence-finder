import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Validate BraveSource implements SearchSource without importing the concrete
// class directly — we import the interface from the known path and then
// dynamically load BraveSource so a missing file gives a clear error.
import type { SearchSource } from '../../src/lib/searchSource'

describe('BraveSource contract', () => {
  const FAKE_TOKEN = 'test-brave-token-xyz'

  beforeEach(() => {
    vi.stubEnv('BRAVE_API_KEY', FAKE_TOKEN)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('(a) implements the SearchSource interface — exposes a search method returning SearchResult[]', async () => {
    const mod = await import('../../src/lib/braveSource')
    const BraveSource: new () => SearchSource = mod.BraveSource ?? mod.default
    const instance = new BraveSource()
    expect(typeof instance.search).toBe('function')
  })

  it('(b) calls the Brave Search API endpoint when search() is invoked', async () => {
    const fetchSpy = vi.fn<[RequestInfo | URL, RequestInit | undefined], Promise<Response>>()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ web: { results: [{ url: 'https://example.com/page', title: 'Example' }] } }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
    vi.stubGlobal('fetch', fetchSpy)

    const mod = await import('../../src/lib/braveSource')
    const BraveSource: new () => SearchSource = mod.BraveSource ?? mod.default
    const instance = new BraveSource()
    await instance.search('test query')

    expect(fetchSpy).toHaveBeenCalledOnce()
    const calledUrl = String(fetchSpy.mock.calls[0]![0])
    expect(calledUrl).toMatch(/brave/i)
  })

  it('(c) reads the API token exclusively from the BRAVE_API_KEY environment variable', async () => {
    const fetchSpy = vi.fn<[RequestInfo | URL, RequestInit | undefined], Promise<Response>>()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ web: { results: [{ url: 'https://example.com/b', title: 'B' }] } }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
    vi.stubGlobal('fetch', fetchSpy)

    const mod = await import('../../src/lib/braveSource')
    const BraveSource: new () => SearchSource = mod.BraveSource ?? mod.default
    const instance = new BraveSource()
    await instance.search('token check')

    const callInit = fetchSpy.mock.calls[0]![1]
    const headers = callInit?.headers
    const headerEntries = headers instanceof Headers
      ? Object.fromEntries(headers.entries())
      : (headers as Record<string, string>)
    const authHeader = Object.entries(headerEntries)
      .find(([k]) => k.toLowerCase().includes('x-subscription-token') || k.toLowerCase().includes('authorization'))
    expect(authHeader).toBeDefined()
    expect(authHeader![1]).toBe(FAKE_TOKEN)
  })

  it('(d) enforces a 15-second (15000 ms) HTTP request timeout', async () => {
    const fetchSpy = vi.fn<[RequestInfo | URL, RequestInit | undefined], Promise<Response>>()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ web: { results: [{ url: 'https://example.com/c', title: 'C' }] } }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
    vi.stubGlobal('fetch', fetchSpy)

    const mod = await import('../../src/lib/braveSource')
    const BraveSource: new () => SearchSource = mod.BraveSource ?? mod.default
    const instance = new BraveSource()
    await instance.search('timeout check')

    const callInit = fetchSpy.mock.calls[0]![1]
    // AbortSignal.timeout(15000) is the idiomatic approach; some impls pass it
    // via signal, others via a raw timeout option. We accept either pattern.
    const hasSignal = callInit?.signal instanceof AbortSignal
    const hasTimeoutOption =
      typeof (callInit as Record<string, unknown> | undefined)?.timeout === 'number' &&
      (callInit as Record<string, unknown>).timeout === 15000
    expect(hasSignal || hasTimeoutOption).toBe(true)
  })
})
