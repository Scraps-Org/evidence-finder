import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import React from 'react'

// ---------------------------------------------------------------------------
// The EvidenceList component (or the component that renders evidence items)
// is expected to live at src/components/EvidenceList.tsx.
// We import it from the real entry point.
// ---------------------------------------------------------------------------
import EvidenceList from '../../src/components/EvidenceList'

const sampleItems = [
  {
    id: 'ev-1',
    url: 'https://example.com/article',
    pageTitle: 'Example Article',
    domain: 'example.com',
    detectedAt: new Date('2026-06-25T10:00:00Z'),
    caseId: 'case-1',
  },
  {
    id: 'ev-2',
    url: 'https://other.org/page',
    pageTitle: 'Other Page',
    domain: 'other.org',
    detectedAt: new Date('2026-06-25T11:00:00Z'),
    caseId: 'case-1',
  },
]

describe('EvidenceList component', () => {
  it('renders URL and text metadata for each evidence item', () => {
    render(<EvidenceList items={sampleItems} />)

    // (a) Each item must show its URL and metadata as text
    for (const item of sampleItems) {
      expect(screen.getByText(item.url)).toBeTruthy()
      expect(screen.getByText(item.pageTitle)).toBeTruthy()
      expect(screen.getByText(item.domain)).toBeTruthy()
    }
  })

  it('does not render any <img> or <video> whose src resolves to the evidence URL', () => {
    const { container } = render(<EvidenceList items={sampleItems} />)

    // (b) No <img> element must point at the evidence URL
    const imgs = container.querySelectorAll('img')
    for (const img of Array.from(imgs)) {
      for (const item of sampleItems) {
        expect(img.getAttribute('src')).not.toBe(item.url)
      }
    }

    // (b) No <video> element must point at the evidence URL
    const videos = container.querySelectorAll('video')
    for (const video of Array.from(videos)) {
      for (const item of sampleItems) {
        expect(video.getAttribute('src')).not.toBe(item.url)
      }
    }

    // Also check <source> elements nested inside video
    const sources = container.querySelectorAll('video source')
    for (const source of Array.from(sources)) {
      for (const item of sampleItems) {
        expect(source.getAttribute('src')).not.toBe(item.url)
      }
    }
  })
})
