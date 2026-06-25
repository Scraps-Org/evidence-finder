import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EvidenceList from '../../src/components/EvidenceList'

const EVIDENCE_URL = 'https://example.com/article'

const sampleItems = [
  {
    id: 'ev-1',
    url: EVIDENCE_URL,
    pageTitle: 'Example Article Title',
    domain: 'example.com',
    detectedAt: new Date('2026-06-25T10:00:00Z'),
    caseId: 'case-1',
  },
]

describe('EvidenceList component', () => {
  it('displays URL and text metadata for each evidence item', () => {
    render(<EvidenceList items={sampleItems} />)

    // URL visible as text
    expect(screen.getByText(EVIDENCE_URL)).toBeInTheDocument()

    // pageTitle visible
    expect(screen.getByText('Example Article Title')).toBeInTheDocument()

    // domain visible
    expect(screen.getByText('example.com')).toBeInTheDocument()

    // detectedAt visible (some representation of the date)
    expect(screen.getByText(/2026/)).toBeInTheDocument()
  })

  it('does not render an <img> or <video> element pointing at the evidence URL', () => {
    const { container } = render(<EvidenceList items={sampleItems} />)

    const imgs = Array.from(container.querySelectorAll('img'))
    for (const img of imgs) {
      const src = img.getAttribute('src') ?? ''
      expect(src).not.toContain(EVIDENCE_URL)
    }

    const videos = Array.from(container.querySelectorAll('video'))
    for (const video of videos) {
      const src = video.getAttribute('src') ?? ''
      expect(src).not.toContain(EVIDENCE_URL)

      // also check <source> children
      const sources = Array.from(video.querySelectorAll('source'))
      for (const source of sources) {
        expect(source.getAttribute('src') ?? '').not.toContain(EVIDENCE_URL)
      }
    }
  })
})
