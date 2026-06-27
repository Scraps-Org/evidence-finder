import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import React from 'react'

// Mock next/navigation useRouter
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock fs to verify 'use client' directive by reading the source file
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('D10-case-create-ui: home page case creation', () => {
  const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    mockPush.mockReset()
    fetchMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("home page source file declares 'use client' at the top", () => {
    const src = readFileSync(resolve(__dirname, '../../src/app/page.tsx'), 'utf-8')
    // The directive must appear before any other non-comment code
    const lines = src.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
    const firstMeaningfulLine = lines[0] ?? ''
    expect(firstMeaningfulLine).toBe("'use client'")
  })

  it('renders a text input and a submit button labeled 생성 or create', async () => {
    const Page = (await import('../../src/app/page')).default
    render(<Page />)

    const input = screen.getByRole('textbox')
    expect(input).toBeDefined()

    // Button must be labeled '생성' or 'create' (case-insensitive)
    const button =
      screen.queryByRole('button', { name: /생성/i }) ??
      screen.queryByRole('button', { name: /create/i })
    expect(button).not.toBeNull()
  })

  it('POSTs identifying terms to /api/cases when a valid term is submitted', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'case-42' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const Page = (await import('../../src/app/page')).default
    render(<Page />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '홍길동' } })

    const button =
      (screen.queryByRole('button', { name: /생성/i }) ??
        screen.queryByRole('button', { name: /create/i }))!
    fireEvent.click(button)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/cases')
    expect((init.method ?? '').toUpperCase()).toBe('POST')
    const body = JSON.parse(init.body as string) as Record<string, unknown>
    expect(Object.values(body)).toContain('홍길동')
  })

  it('navigates to /cases/<newId> via useRouter().push on successful POST', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'case-99' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const Page = (await import('../../src/app/page')).default
    render(<Page />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '테스트 식별어' } })

    const button =
      (screen.queryByRole('button', { name: /생성/i }) ??
        screen.queryByRole('button', { name: /create/i }))!
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/cases/case-99')
    })
  })

  it('does not POST or navigate when input is empty', async () => {
    const Page = (await import('../../src/app/page')).default
    render(<Page />)

    const button =
      (screen.queryByRole('button', { name: /생성/i }) ??
        screen.queryByRole('button', { name: /create/i }))!
    fireEvent.click(button)

    // Give any async handlers a chance to run
    await new Promise((r) => setTimeout(r, 50))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('does not POST or navigate when input is whitespace only', async () => {
    const Page = (await import('../../src/app/page')).default
    render(<Page />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '   ' } })

    const button =
      (screen.queryByRole('button', { name: /생성/i }) ??
        screen.queryByRole('button', { name: /create/i }))!
    fireEvent.click(button)

    await new Promise((r) => setTimeout(r, 50))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })
})
