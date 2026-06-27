import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Page from '../../src/app/page'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

describe('D10-case-create-ui — home page case creation', () => {
  beforeEach(() => {
    mockPush.mockClear()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('renders a text input and a submit button labelled 생성 or create', () => {
    render(<Page />)
    expect(screen.getByRole('textbox')).toBeDefined()
    const btn = screen.queryByRole('button', { name: /생성|create/i })
    expect(btn).not.toBeNull()
  })

  it('POSTs identifying terms to /api/cases on valid submission', async () => {
    const mockFetch = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'abc123' }), { status: 200, headers: { 'content-type': 'application/json' } })
    )
    vi.stubGlobal('fetch', mockFetch)

    render(<Page />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '홍길동' } })
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledOnce()
    })

    const [url, init] = mockFetch.mock.calls[0]!
    expect(String(url)).toContain('/api/cases')
    expect(init?.method?.toUpperCase()).toBe('POST')
    const body = JSON.parse(init?.body as string) as Record<string, unknown>
    expect(body).toMatchObject({ terms: '홍길동' })
  })

  it('navigates to /cases/<newId> via useRouter().push on success', async () => {
    const mockFetch = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'newCase99' }), { status: 200, headers: { 'content-type': 'application/json' } })
    )
    vi.stubGlobal('fetch', mockFetch)

    render(<Page />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '테스트 식별어' } })
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/cases/newCase99')
    })
  })

  it('does not POST or navigate when input is empty', async () => {
    const mockFetch = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
    vi.stubGlobal('fetch', mockFetch)

    render(<Page />)
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }))

    await new Promise((r) => setTimeout(r, 50))
    expect(mockFetch).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('does not POST or navigate when input is whitespace-only', async () => {
    const mockFetch = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
    vi.stubGlobal('fetch', mockFetch)

    render(<Page />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }))

    await new Promise((r) => setTimeout(r, 50))
    expect(mockFetch).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })
})
