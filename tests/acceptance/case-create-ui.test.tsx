import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import React from 'react'

// Mock next/navigation useRouter
const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

// We read the page source to verify 'use client' directive
import fs from 'fs'
import path from 'path'

import Page from '../../src/app/page'

describe('D10-case-create-ui: Home page case creation', () => {
  beforeEach(() => {
    pushMock.mockReset()
    vi.stubGlobal('fetch', vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>())
  })

  it('page.tsx declares "use client" at the top of the file', () => {
    const filePath = path.resolve(__dirname, '../../src/app/page.tsx')
    const source = fs.readFileSync(filePath, 'utf-8')
    const firstMeaningfulLine = source
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.length > 0)
    expect(firstMeaningfulLine).toBe("'use client'")
  })

  it('renders a text input and a submit button labeled 생성 or create', () => {
    render(<Page />)
    expect(screen.getByRole('textbox')).toBeDefined()
    const button = screen.queryByRole('button', { name: /생성|create/i })
    expect(button).not.toBeNull()
  })

  it('POSTs identifying terms to /api/cases on valid submission', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'case-123' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<Page />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '식별어 테스트' } })

    const button = screen.getByRole('button', { name: /생성|create/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    const [url, opts] = fetchMock.mock.calls[0]!
    expect(String(url)).toBe('/api/cases')
    expect((opts as RequestInit).method?.toUpperCase()).toBe('POST')

    const body = JSON.parse((opts as RequestInit).body as string) as Record<string, unknown>
    expect(body).toMatchObject({ terms: '식별어 테스트' })
  })

  it('navigates to /cases/<newId> via useRouter().push on success', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'case-abc' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<Page />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '유효한 식별어' } })
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }))

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/cases/case-abc')
    })
  })

  it('does not POST or navigate when input is empty', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
    vi.stubGlobal('fetch', fetchMock)

    render(<Page />)

    const button = screen.getByRole('button', { name: /생성|create/i })
    fireEvent.click(button)

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
