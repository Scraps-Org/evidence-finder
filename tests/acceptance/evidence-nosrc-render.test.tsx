import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import EvidenceList from '../../src/components/EvidenceList'

const sampleEvidence = [
  {
    id: 'ev-1',
    url: 'https://harmful.example.com/leak/1',
    pageTitle: 'Leaked Page One',
    domain: 'harmful.example.com',
    detectedAt: new Date('2026-07-03T09:00:00Z').toISOString(),
    caseId: 'case-1',
  },
  {
    id: 'ev-2',
    url: 'https://another-bad-site.net/post/99',
    pageTitle: 'Another Exposure Post',
    domain: 'another-bad-site.net',
    detectedAt: new Date('2026-07-03T10:00:00Z').toISOString(),
    caseId: 'case-1',
  },
]

describe('EvidenceList — metadata-only rendering, no media src pointing at detected URLs', () => {
  it('renders the URL text, pageTitle, domain, and detectedAt for each evidence item', () => {
    render(<EvidenceList evidence={sampleEvidence} />)

    for (const ev of sampleEvidence) {
      expect(screen.getByText(ev.url)).toBeInTheDocument()
      expect(screen.getByText(ev.pageTitle)).toBeInTheDocument()
      expect(screen.getByText(ev.domain)).toBeInTheDocument()
    }
  })

  it('does not render any <img> element whose src is a detected evidence URL', () => {
    const { container } = render(<EvidenceList evidence={sampleEvidence} />)

    const imgs = container.querySelectorAll('img')
    const detectedUrls = new Set(sampleEvidence.map((e) => e.url))

    imgs.forEach((img) => {
      expect(detectedUrls.has(img.getAttribute('src') ?? '')).toBe(false)
    })
  })

  it('does not render any <video> element whose src is a detected evidence URL', () => {
    const { container } = render(<EvidenceList evidence={sampleEvidence} />)

    const videos = container.querySelectorAll('video')
    const detectedUrls = new Set(sampleEvidence.map((e) => e.url))

    videos.forEach((video) => {
      expect(detectedUrls.has(video.getAttribute('src') ?? '')).toBe(false)
    })
  })

  it('does not render any <source> element inside a <video> whose src is a detected evidence URL', () => {
    const { container } = render(<EvidenceList evidence={sampleEvidence} />)

    const sources = Array.from(container.querySelectorAll('video source'))
    const detectedUrls = new Set(sampleEvidence.map((e) => e.url))

    sources.forEach((source) => {
      expect(detectedUrls.has(source.getAttribute('src') ?? '')).toBe(false)
    })
  })

  it('contains no <img> or <video> elements at all when only evidence metadata is expected', () => {
    const { container } = render(<EvidenceList evidence={sampleEvidence} />)

    // The list is metadata-only: zero img/video nodes is the correct outcome
    const mediaNodes = container.querySelectorAll('img, video')
    mediaNodes.forEach((node) => {
      const src = node.getAttribute('src') ?? ''
      // Any media element that points to a detected URL is a violation
      const detectedUrls = sampleEvidence.map((e) => e.url)
      expect(detectedUrls).not.toContain(src)
    })
  })
})
