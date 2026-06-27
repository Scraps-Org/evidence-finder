import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Page from '../../src/app/page'
import * as fs from 'node:fs'
import * as path from 'node:path'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('D10 case-create-ui', () => {
  beforeEach(() => {
    pushMock.mockReset()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('page.tsx declares "use client" at the top of the file', () => {
    const filePath = path.resolve('src/app/page.tsx')
    const source = fs.readFileSync(filePath, 'utf8')
    const firstMeaningfulLine = source
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.length > 0)
    expect(firstMeaningfulLine).toBe("'use client'")
  })

  it('renders a text input and a submit button labeled 생성 or create', () => {
    render(<Page />)
    expect(screen.getByRole('textbox')).toBeDefined()
    const button = screen.getByRole('button', { name: /생성|create/i })
    expect(button).toBeDefined()
  })

  it('submitting a valid term POSTs to /api/cases with the identifying terms payload', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'case-abc' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<Page />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '홍길동' } })
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledOnce()
    })

    const [url, init] = fetchMock.mock.calls[0]!
    expect(String(url)).toBe('/api/cases')
    expect((init as RequestInit).method?.toUpperCase()).toBe('POST')
    const body = JSON.parse((init as RequestInit).body as string) as Record<string, unknown>
    expect(Object.values(body).some((v) => v === '홍길동')).toBe(true)
  })

  it('navigates to /cases/<newId> via router.push on successful POST', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'case-xyz' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<Page />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '테스트' } })
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }))

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/cases/case-xyz')
    })
  })

  it('does not POST or navigate when input is empty', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
    vi.stubGlobal('fetch', fetchMock)

    render(<Page />)
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }))

    await new Promise((r) => setTimeout(r, 50))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('does not POST or navigate when input is whitespace only', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
    vi.stubGlobal('fetch', fetchMock)

    render(<Page />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }))

    await new Promise((r) => setTimeout(r, 50))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(pushMock).not.toHaveBeenCalled()
  })
})
