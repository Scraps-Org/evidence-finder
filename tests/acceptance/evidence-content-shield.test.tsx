import { render, screen, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EvidenceList from '../../src/components/EvidenceList'

const ITEMS = [
  {
    id: 'e1',
    url: 'https://example.com/article-one',
    title: '증거 제목 A',
    domain: 'example.com',
    date: '2026-06-01',
    content: '본문 전문 A — should be hidden until revealed',
    thumbnailUrl: 'https://example.com/thumb-a.jpg',
  },
  {
    id: 'e2',
    url: 'https://other.org/article-two',
    title: '증거 제목 B',
    domain: 'other.org',
    date: '2026-06-15',
    content: '본문 전문 B — should be hidden until revealed',
    thumbnailUrl: 'https://other.org/thumb-b.jpg',
  },
]

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn<[], Promise<Response>>())
})

describe('D4-content-shielded: evidence list default render', () => {
  it('renders no media elements (img/video/iframe/object) in the default state', () => {
    render(<EvidenceList items={ITEMS} />)

    expect(document.querySelectorAll('img').length).toBe(0)
    expect(document.querySelectorAll('video').length).toBe(0)
    expect(document.querySelectorAll('iframe').length).toBe(0)
    expect(document.querySelectorAll('object').length).toBe(0)
  })

  it('does not trigger any fetch for media resources on initial render', () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
    vi.stubGlobal('fetch', fetchMock)

    render(<EvidenceList items={ITEMS} />)

    const mediaCalls = fetchMock.mock.calls.filter(([input]) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url
      return /\.(jpg|jpeg|png|gif|webp|mp4|webm|svg)(\?|$)/i.test(url) ||
        url.includes('thumb') ||
        url.includes('media') ||
        url.includes('image')
    })
    expect(mediaCalls.length).toBe(0)
  })

  it('shows only URL and metadata per item; hides body/media/preview content', () => {
    render(<EvidenceList items={ITEMS} />)

    for (const item of ITEMS) {
      expect(screen.getByText(item.url)).toBeInTheDocument()
      expect(screen.getByText(item.title)).toBeInTheDocument()
      expect(screen.queryByText(item.content)).not.toBeInTheDocument()
      expect(document.querySelector(`img[src="${item.thumbnailUrl}"]`)).toBeNull()
    }
  })

  it('every evidence item has a 확인 reveal control', () => {
    render(<EvidenceList items={ITEMS} />)

    const listItems = screen.getAllByRole('listitem')
    expect(listItems.length).toBeGreaterThanOrEqual(ITEMS.length)

    for (const li of listItems) {
      const revealBtn = within(li).queryByRole('button', { name: /확인/ })
      const revealLink = within(li).queryByRole('link', { name: /확인/ })
      const revealCheck = within(li).queryByRole('checkbox', { name: /확인/ })
      const control = revealBtn ?? revealLink ?? revealCheck
      expect(control).not.toBeNull()
    }
  })

  it('activating 확인 on one item reveals its content without affecting others', async () => {
    const user = userEvent.setup()
    render(<EvidenceList items={ITEMS} />)

    const listItems = screen.getAllByRole('listitem')
    const firstItem = listItems[0]!
    const secondItem = listItems[1]!

    expect(screen.queryByText(ITEMS[0]!.content)).not.toBeInTheDocument()
    expect(screen.queryByText(ITEMS[1]!.content)).not.toBeInTheDocument()

    const firstReveal =
      within(firstItem).queryByRole('button', { name: /확인/ }) ??
      within(firstItem).queryByRole('link', { name: /확인/ }) ??
      within(firstItem).queryByRole('checkbox', { name: /확인/ })
    expect(firstReveal).not.toBeNull()

    await act(async () => {
      await user.click(firstReveal!)
    })

    expect(screen.getByText(ITEMS[0]!.content)).toBeInTheDocument()
    expect(screen.queryByText(ITEMS[1]!.content)).not.toBeInTheDocument()

    const secondReveal =
      within(secondItem).queryByRole('button', { name: /확인/ }) ??
      within(secondItem).queryByRole('link', { name: /확인/ }) ??
      within(secondItem).queryByRole('checkbox', { name: /확인/ })
    expect(secondReveal).not.toBeNull()
  })
})
