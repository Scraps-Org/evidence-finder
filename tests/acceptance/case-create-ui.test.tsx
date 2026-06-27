import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import React from 'react'
import fs from 'fs'
import path from 'path'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  mockPush.mockReset()
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

async function renderPage() {
  const { default: Home } = await import('../../src/app/page')
  return render(<Home />)
}

describe('D10-case-create-ui: home page case creation', () => {
  it('renders a client component with identifying-terms input and submit button', async () => {
    const pageSource = fs.readFileSync(
      path.resolve(__dirname, '../../src/app/page.tsx'),
      'utf-8',
    )
    expect(pageSource.trimStart()).toMatch(/^['"']use client['"']/)

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'cid-1' }),
    } as unknown as Response)

    await renderPage()

    expect(screen.getByRole('textbox')).toBeDefined()
    const btn = screen.getByRole('button', { name: /생성|create/i })
    expect(btn).toBeDefined()
  })

  it('POSTs identifying terms to /api/cases on valid submit', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'cid-2' }),
    } as unknown as Response)

    await renderPage()

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '홍길동' } })
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/cases')
    expect(options.method?.toUpperCase()).toBe('POST')
    const body = JSON.parse(options.body as string) as Record<string, unknown>
    expect(body).toMatchObject({ terms: '홍길동' })
  })

  it('navigates to /cases/<newId> via useRouter().push on success', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'cid-3' }),
    } as unknown as Response)

    await renderPage()

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '이순신' } })
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/cases/cid-3')
    })
  })

  it('does not POST or navigate when input is empty', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'cid-4' }),
    } as unknown as Response)

    await renderPage()

    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }))

    await new Promise((r) => setTimeout(r, 50))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('does not POST or navigate when input is whitespace only', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'cid-5' }),
    } as unknown as Response)

    await renderPage()

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }))

    await new Promise((r) => setTimeout(r, 50))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })
})
