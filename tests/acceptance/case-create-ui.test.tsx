import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import React from 'react'

// Mock next/navigation before importing the page
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// We stub global fetch — typed precisely so no `any` leaks
const mockFetch = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('fetch', mockFetch)
})

// Dynamically import after mocks are in place
const getPage = () => import('../../src/app/page')

describe('D10-case-create-ui — home page case creation', () => {
  it('renders a text input and a submit button labeled 생성 or create', async () => {
    const { default: Page } = await getPage()
    render(<Page />)

    expect(screen.getByRole('textbox')).toBeTruthy()
    const button = screen.queryByRole('button', { name: /생성/i })
      ?? screen.getByRole('button', { name: /create/i })
    expect(button).toBeTruthy()
  })

  it('POSTs identifying terms to /api/cases on valid submission', async () => {
    const newId = 'case-abc-123'
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: newId }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      })
    )

    const { default: Page } = await getPage()
    render(<Page />)

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '홍길동' },
    })

    const button = screen.queryByRole('button', { name: /생성/i })
      ?? screen.getByRole('button', { name: /create/i })
    fireEvent.click(button)

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))

    const [url, init] = mockFetch.mock.calls[0]!
    expect(String(url)).toMatch('/api/cases')
    expect((init as RequestInit).method?.toUpperCase()).toBe('POST')

    const body = JSON.parse((init as RequestInit).body as string) as Record<string, unknown>
    expect(Object.values(body).some((v) => String(v).includes('홍길동'))).toBe(true)
  })

  it('navigates to /cases/<newId> via useRouter().push on success', async () => {
    const newId = 'case-xyz-789'
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: newId }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      })
    )

    const { default: Page } = await getPage()
    render(<Page />)

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '이순신' },
    })

    const button = screen.queryByRole('button', { name: /생성/i })
      ?? screen.getByRole('button', { name: /create/i })
    fireEvent.click(button)

    await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1))
    expect(mockPush).toHaveBeenCalledWith(`/cases/${newId}`)
  })

  it('does NOT fetch or navigate when input is empty', async () => {
    const { default: Page } = await getPage()
    render(<Page />)

    const button = screen.queryByRole('button', { name: /생성/i })
      ?? screen.getByRole('button', { name: /create/i })
    fireEvent.click(button)

    // Give a tick for any async code to run
    await new Promise((r) => setTimeout(r, 50))

    expect(mockFetch).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('does NOT fetch or navigate when input is whitespace-only', async () => {
    const { default: Page } = await getPage()
    render(<Page />)

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '   ' },
    })

    const button = screen.queryByRole('button', { name: /생성/i })
      ?? screen.getByRole('button', { name: /create/i })
    fireEvent.click(button)

    await new Promise((r) => setTimeout(r, 50))

    expect(mockFetch).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('the home page file declares "use client" at the top', async () => {
    // Verify the source file starts with 'use client' by fetching the raw module text
    // We read the compiled module's source via a Node fs import inside the test.
    const fs = await import('fs')
    const path = await import('path')
    const filePath = path.resolve('src/app/page.tsx')
    const source = fs.readFileSync(filePath, 'utf-8')
    // The directive must appear before any import/code (trimmed first non-empty line)
    const firstNonEmpty = source.split('\n').find((l) => l.trim().length > 0) ?? ''
    expect(firstNonEmpty.trim()).toBe("'use client'")
  })
})
