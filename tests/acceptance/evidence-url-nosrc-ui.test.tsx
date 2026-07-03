import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import EvidenceList from '../../src/components/EvidenceList'

const DETECTED_URL = 'https://bad-site.example.com/leak-post'

const MOCK_EVIDENCE = [
  {
    id: 'ev-1',
    url: DETECTED_URL,
    pageTitle: 'Leaked Post Title',
    domain: 'bad-site.example.com',
    detectedAt: new Date('2026-07-03T09:00:00Z'),
    caseId: 'case-001',
  },
  {
    id: 'ev-2',
    url: 'https://another-site.example.org/post/99',
    pageTitle: 'Another Exposure',
    domain: 'another-site.example.org',
    detectedAt: new Date('2026-07-03T10:00:00Z'),
    caseId: 'case-001',
  },
]

aftEach(() => {
  vi.restoreAllMocks()
})

describe('EvidenceList UI — metadata only, no media elements pointing at detected URLs', () => {
  it('renders URL text, pageTitle, domain, and detectedAt for each evidence item', () => {
    render(<EvidenceList evidence={MOCK_EVIDENCE} />)

    expect(screen.getByText(DETECTED_URL)).toBeInTheDocument()
    expect(screen.getByText('Leaked Post Title')).toBeInTheDocument()
    expect(screen.getByText('bad-site.example.com')).toBeInTheDocument()

    expect(screen.getByText('https://another-site.example.org/post/99')).toBeInTheDocument()
    expect(screen.getByText('Another Exposure')).toBeInTheDocument()
    expect(screen.getByText('another-site.example.org')).toBeInTheDocument()
  })

  it('does not render any <img> element whose src references a detected URL', () => {
    const { container } = render(<EvidenceList evidence={MOCK_EVIDENCE} />)

    const imgs = container.querySelectorAll('img')
    imgs.forEach((img) => {
      const src = img.getAttribute('src') ?? ''
      expect(src).not.toBe(MOCK_EVIDENCE[0]!.url)
      expect(src).not.toBe(MOCK_EVIDENCE[1]!.url)
    })
  })

  it('does not render any <video> element whose src references a detected URL', () => {
    const { container } = render(<EvidenceList evidence={MOCK_EVIDENCE} />)

    const videos = container.querySelectorAll('video')
    videos.forEach((video) => {
      const src = video.getAttribute('src') ?? ''
      expect(src).not.toBe(MOCK_EVIDENCE[0]!.url)
      expect(src).not.toBe(MOCK_EVIDENCE[1]!.url)
      const sources = video.querySelectorAll('source')
      sources.forEach((s) => {
        const ssrc = s.getAttribute('src') ?? ''
        expect(ssrc).not.toBe(MOCK_EVIDENCE[0]!.url)
        expect(ssrc).not.toBe(MOCK_EVIDENCE[1]!.url)
      })
    })
  })
})
