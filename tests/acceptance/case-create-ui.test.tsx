/**
 * Acceptance: D10-case-create-ui
 * Home page (/) renders a client component with an identifying-terms input and
 * a submit button; submitting POSTs to /api/cases and navigates on success;
 * empty/whitespace input is a no-op.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

// ---------------------------------------------------------------------------
// next/navigation mock — must be declared before the component import so that
// the module registry resolves our mock when the page module is first loaded.
// ---------------------------------------------------------------------------
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Import the home page AFTER the mock is established.
import HomePage from '../../src/app/page'

// ---------------------------------------------------------------------------
// Criterion 1 helper: verify 'use client' is declared at the top of the file.
// ---------------------------------------------------------------------------
function readPageSource(): string {
  const filePath = path.resolve(__dirname, '../../src/app/page.tsx')
  return fs.readFileSync(filePath, 'utf8')
}

describe('D10-case-create-ui: Home page case creation', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Stub global fetch; individual tests override the resolved value.
    vi.stubGlobal(
      'fetch',
      vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>(),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // -------------------------------------------------------------------------
  // Criterion 1: 'use client' directive + input + button rendered
  // -------------------------------------------------------------------------
  it("declares 'use client' at the top of src/app/page.tsx", () => {
    const source = readPageSource()
    // The directive must appear before any import/code — check it's in the
    // first non-empty line(s) of the file.
    const firstMeaningfulLine = source
      .split('\n')
      .find((line) => line.trim().length > 0)
    expect(firstMeaningfulLine?.trim()).toBe("'use client'")
  })

  it('renders an identifying-terms text input', () => {
    render(<HomePage />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDefined()
  })

  it("renders a submit button labelled '생성' or 'create' (case-insensitive)", () => {
    render(<HomePage />)
    const button = screen.getByRole('button', { name: /생성|create/i })
    expect(button).toBeDefined()
  })

  // -------------------------------------------------------------------------
  // Criterion 2: valid input → POST /api/cases with identifier payload
  // -------------------------------------------------------------------------
  it('POSTs identifying terms to /api/cases on valid submit', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'case-abc' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<HomePage />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '피의자 홍길동' } })
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledOnce()
    })

    const [url, init] = fetchMock.mock.calls[0]!
    expect(String(url)).toContain('/api/cases')
    expect((init as RequestInit).method?.toUpperCase()).toBe('POST')

    const body = JSON.parse((init as RequestInit).body as string) as Record<string, unknown>
    // The payload must contain the entered terms under some identifying key.
    const values = Object.values(body)
    expect(values.some((v) => typeof v === 'string' && v.includes('피의자 홍길동'))).toBe(true)
  })

  // -------------------------------------------------------------------------
  // Criterion 3: on success → useRouter().push('/cases/<newId>')
  // -------------------------------------------------------------------------
  it('navigates to /cases/<newId> via useRouter().push on successful POST', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'case-xyz' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<HomePage />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '식별어' } })
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledOnce()
    })

    expect(mockPush).toHaveBeenCalledWith('/cases/case-xyz')
  })

  it('does NOT use window.location for navigation', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'case-loc' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const locationAssignSpy = vi.fn()
    const locationHrefSpy = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        assign: locationAssignSpy,
        replace: locationAssignSpy,
        get href() { return '' },
        set href(_v: string) { locationHrefSpy(_v) },
      },
    })

    render(<HomePage />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '식별어' } })
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledOnce()
    })

    expect(locationAssignSpy).not.toHaveBeenCalled()
    expect(locationHrefSpy).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // Criterion 4: empty / whitespace-only input → no POST, no navigation
  // -------------------------------------------------------------------------
  it('does NOT POST or navigate when input is empty', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
    vi.stubGlobal('fetch', fetchMock)

    render(<HomePage />)
    // Input left empty
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }))

    // Allow a tick for any async side-effects.
    await new Promise((r) => setTimeout(r, 50))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('does NOT POST or navigate when input contains only whitespace', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
    vi.stubGlobal('fetch', fetchMock)

    render(<HomePage />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   \t  ' } })
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }))

    await new Promise((r) => setTimeout(r, 50))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })
})
