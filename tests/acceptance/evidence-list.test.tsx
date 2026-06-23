import React from 'react'
import { render, screen } from '@testing-library/react'
import EvidenceList from '../../src/components/EvidenceList'

const EVIDENCE_ITEMS = [
  {
    id: '1',
    url: 'https://example.com/article/one',
    pageTitle: 'Article One',
    domain: 'example.com',
    detectedAt: new Date('2026-06-23T10:00:00Z'),
    caseId: 'case-1',
  },
  {
    id: '2',
    url: 'https://other.org/news/two',
    pageTitle: 'News Two',
    domain: 'other.org',
    detectedAt: new Date('2026-06-23T11:00:00Z'),
    caseId: 'case-1',
  },
]

describe('EvidenceList component — rendering', () => {
  it('(a) displays URL and text metadata for each evidence item', () => {
    render(<EvidenceList items={EVIDENCE_ITEMS} />)

    for (const item of EVIDENCE_ITEMS) {
      // URL visible as text or link
      expect(screen.getByText(item.url)).toBeInTheDocument()
      // pageTitle visible
      expect(screen.getByText(item.pageTitle)).toBeInTheDocument()
      // domain visible
      expect(screen.getByText(item.domain)).toBeInTheDocument()
      // detectedAt visible (some formatted representation of the date)
      // The component must render *something* from detectedAt — we check the
      // year as a minimal invariant that works regardless of locale formatting.
      expect(screen.getByText(/2026/)).toBeInTheDocument()
    }
  })

  it('(b) does not render any <img> or <video> element whose src resolves to an evidence URL', () => {
    const { container } = render(<EvidenceList items={EVIDENCE_ITEMS} />)

    const imgs = Array.from(container.querySelectorAll('img'))
    const videos = Array.from(container.querySelectorAll('video'))

    const evidenceUrls = new Set(EVIDENCE_ITEMS.map((e) => e.url))

    for (const img of imgs) {
      expect(evidenceUrls.has(img.getAttribute('src') ?? '')).toBe(false)
    }
    for (const video of videos) {
      expect(evidenceUrls.has(video.getAttribute('src') ?? '')).toBe(false)
    }
  })
})
