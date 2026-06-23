import { render, screen } from '@testing-library/react'
import EvidenceList from '../../src/components/EvidenceList'

const baseEvidence = [
  {
    id: '1',
    url: 'https://caught.example.com/page',
    pageTitle: 'Caught Page Title',
    domain: 'caught.example.com',
    detectedAt: new Date('2026-06-20T12:00:00Z'),
    caseId: 'case-1',
  },
]

describe('EvidenceList component', () => {
  it('renders URL and text metadata (pageTitle, domain, detectedAt) for each evidence item', () => {
    render(<EvidenceList items={baseEvidence} />)

    expect(screen.getByText('https://caught.example.com/page')).toBeInTheDocument()
    expect(screen.getByText('Caught Page Title')).toBeInTheDocument()
    expect(screen.getByText('caught.example.com')).toBeInTheDocument()
    // detectedAt rendered in some human-readable form
    expect(screen.getByText(/2026|Jun/i)).toBeInTheDocument()
  })

  it('does not render any <img> or <video> whose src points to the evidence URL', () => {
    const { container } = render(<EvidenceList items={baseEvidence} />)

    const imgs = Array.from(container.querySelectorAll('img'))
    const videos = Array.from(container.querySelectorAll('video'))
    const sources = Array.from(container.querySelectorAll('source'))

    const evidenceUrls = baseEvidence.map((e) => e.url)

    for (const img of imgs) {
      expect(evidenceUrls).not.toContain(img.getAttribute('src'))
    }
    for (const video of videos) {
      expect(evidenceUrls).not.toContain(video.getAttribute('src'))
    }
    for (const source of sources) {
      expect(evidenceUrls).not.toContain(source.getAttribute('src'))
    }
  })
})
