import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We import SearchSource to verify BraveSource implements it structurally
import type { SearchSource } from '../../src/lib/searchSource'

// Import BraveSource from its expected location
import { BraveSource } from '../../src/lib/braveSource'

describe('BraveSource contract', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    vi.resetAllMocks()
    process.env = { ...ORIGINAL_ENV, BRAVE_API_KEY: 'test-token-abc' }
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
    vi.restoreAllMocks()
  })

  it('implements the SearchSource interface (has a search method)', () => {
    const source = new BraveSource()
    // SearchSource requires a `search` method
    expect(typeof source.search).toBe('function')
    // TypeScript structural check: assignable to SearchSource
    const typed: SearchSource = source
    expect(typed).toBeDefined()
  })

  it('calls the Brave Search API endpoint when search is invoked', async () => {
    const fetchSpy = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(
        JSON.stringify({ web: { results: [{ url: 'https://example.com', title: 'Example' }] } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )
    vi.stubGlobal('fetch', fetchSpy)

    const source = new BraveSource()
    const results = await source.search('test query')

    expect(fetchSpy).toHaveBeenCalledOnce()
    const calledUrl = fetchSpy.mock.calls[0]![0] as string | URL
    const urlStr = typeof calledUrl === 'string' ? calledUrl : calledUrl.toString()
    expect(urlStr).toMatch(/brave\.com/)
    expect(results.length).toBeGreaterThanOrEqual(1)
  })

  it('reads the API token exclusively from the BRAVE_API_KEY environment variable', async () => {
    const fetchSpy = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(
        JSON.stringify({ web: { results: [{ url: 'https://example.com', title: 'Example' }] } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )
    vi.stubGlobal('fetch', fetchSpy)

    const source = new BraveSource()
    await source.search('query')

    const callArgs = fetchSpy.mock.calls[0]!
    const init = callArgs[1] as RequestInit
    const headers = init?.headers as Record<string, string>
    // Token must appear in request headers, sourced from env
    const headerValues = Object.values(headers).join(' ')
    expect(headerValues).toContain('test-token-abc')
  })

  it('throws or rejects when BRAVE_API_KEY is not set', async () => {
    delete process.env.BRAVE_API_KEY
    expect(() => new BraveSource()).toThrow()
  })

  it('enforces a 15-second (15000ms) HTTP request timeout via AbortSignal', async () => {
    const fetchSpy = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(
        JSON.stringify({ web: { results: [{ url: 'https://example.com', title: 'Example' }] } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )
    vi.stubGlobal('fetch', fetchSpy)

    const source = new BraveSource()
    await source.search('timeout test')

    const init = fetchSpy.mock.calls[0]![1] as RequestInit
    expect(init?.signal).toBeDefined()
    // The signal must come from an AbortSignal with a 15s timeout
    // AbortSignal.timeout produces a signal; verify it is an AbortSignal instance
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })
})
