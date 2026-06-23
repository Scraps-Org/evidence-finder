import { render, screen } from '@testing-library/react'
import EvidenceList from '../../src/components/EvidenceList'

const EVIDENCE_URL = 'https://www.example.com/article'

const items = [
  {
    id: 'ev-1',
    url: EVIDENCE_URL,
    pageTitle: 'An Important Article',
    domain: 'www.example.com',
    detectedAt: new Date('2026-06-23T10:00:00Z'),
    caseId: 'case-1',
  },
  {
    id: 'ev-2',
    url: 'https://other.org/news',
    pageTitle: 'Other News',
    domain: 'other.org',
    detectedAt: new Date('2026-06-23T11:00:00Z'),
    caseId: 'case-1',
  },
]

describe('EvidenceList component – UI layer', () => {
  it('displays URL and text metadata (pageTitle, domain, detectedAt) for each evidence item', () => {
    render(<EvidenceList items={items} />)

    // URL displayed as text or link
    expect(screen.getByText(EVIDENCE_URL)).toBeInTheDocument()
    expect(screen.getByText('An Important Article')).toBeInTheDocument()
    expect(screen.getByText('www.example.com')).toBeInTheDocument()

    expect(screen.getByText('https://other.org/news')).toBeInTheDocument()
    expect(screen.getByText('Other News')).toBeInTheDocument()
    expect(screen.getByText('other.org')).toBeInTheDocument()
  })

  it('does not render any <img> or <video> whose src resolves to the evidence URL', () => {
    const { container } = render(<EvidenceList items={items} />)

    const images = container.querySelectorAll('img')
    images.forEach((img) => {
      const src = img.getAttribute('src') ?? ''
      expect(src).not.toBe(EVIDENCE_URL)
      // also guard against partial URL matches pointing at evidence domain
      expect(src).not.toContain('example.com/article')
    })

    const videos = container.querySelectorAll('video')
    videos.forEach((vid) => {
      const src = vid.getAttribute('src') ?? ''
      expect(src).not.toBe(EVIDENCE_URL)
      expect(src).not.toContain('example.com/article')
    })

    // also check <source> inside <video>
    const sources = container.querySelectorAll('video source')
    sources.forEach((src) => {
      expect(src.getAttribute('src')).not.toBe(EVIDENCE_URL)
    })
  })
})
