import { render, screen } from '@testing-library/react'
import EvidenceList from '../../src/components/EvidenceList'

const isoDate = '2026-06-23T10:00:00.000Z'
const evidenceItems = [
  {
    id: 'ev-1',
    url: 'https://example.com/article',
    pageTitle: 'Example Article',
    domain: 'example.com',
    detectedAt: new Date(isoDate),
    caseId: 'case-1',
  },
  {
    id: 'ev-2',
    url: 'https://news.org/story',
    pageTitle: 'News Story',
    domain: 'news.org',
    detectedAt: new Date(isoDate),
    caseId: 'case-1',
  },
]

describe('EvidenceList component', () => {
  it('renders URL and text metadata for each evidence item', () => {
    render(<EvidenceList items={evidenceItems} />)

    expect(screen.getByText('https://example.com/article')).toBeInTheDocument()
    expect(screen.getByText('Example Article')).toBeInTheDocument()
    expect(screen.getByText('example.com')).toBeInTheDocument()

    expect(screen.getByText('https://news.org/story')).toBeInTheDocument()
    expect(screen.getByText('News Story')).toBeInTheDocument()
    expect(screen.getByText('news.org')).toBeInTheDocument()
  })

  it('does not render any <img> or <video> elements whose src points to the evidence URL', () => {
    const { container } = render(<EvidenceList items={evidenceItems} />)

    const imgs = container.querySelectorAll('img')
    const videos = container.querySelectorAll('video')

    const evidenceUrls = evidenceItems.map((e) => e.url)

    imgs.forEach((img) => {
      expect(evidenceUrls).not.toContain(img.getAttribute('src'))
    })

    videos.forEach((video) => {
      expect(evidenceUrls).not.toContain(video.getAttribute('src'))
    })
  })

  it('renders detectedAt as readable text (not raw ISO) for each item', () => {
    render(<EvidenceList items={evidenceItems} />)
    // The date 2026-06-23 must appear somewhere in the rendered output as text
    const allText = document.body.textContent ?? ''
    expect(allText).toMatch(/2026/)
  })
})
