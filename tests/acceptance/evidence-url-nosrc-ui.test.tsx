import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import EvidenceList from '../../src/components/EvidenceList'

describe('EvidenceList — metadata-only rendering, no media src pointing at evidence URLs', () => {
  const evidenceItems = [
    {
      id: 'ev-1',
      url: 'https://bad-site.example/leaked-image',
      pageTitle: 'Leaked Content Page',
      domain: 'bad-site.example',
      detectedAt: new Date('2026-07-01T10:00:00Z'),
      caseId: 'case-001',
    },
    {
      id: 'ev-2',
      url: 'https://another.example/exposed-video',
      pageTitle: 'Another Exposure',
      domain: 'another.example',
      detectedAt: new Date('2026-07-02T12:00:00Z'),
      caseId: 'case-001',
    },
  ]

  it('renders URL text for each evidence item', () => {
    render(<EvidenceList evidence={evidenceItems} />)
    expect(screen.getByText('https://bad-site.example/leaked-image')).toBeTruthy()
    expect(screen.getByText('https://another.example/exposed-video')).toBeTruthy()
  })

  it('renders pageTitle for each evidence item', () => {
    render(<EvidenceList evidence={evidenceItems} />)
    expect(screen.getByText('Leaked Content Page')).toBeTruthy()
    expect(screen.getByText('Another Exposure')).toBeTruthy()
  })

  it('renders domain for each evidence item', () => {
    render(<EvidenceList evidence={evidenceItems} />)
    expect(screen.getByText('bad-site.example')).toBeTruthy()
    expect(screen.getByText('another.example')).toBeTruthy()
  })

  it('renders detectedAt timestamp for each evidence item', () => {
    render(<EvidenceList evidence={evidenceItems} />)
    // At least one timestamp must appear in the rendered output
    const container = document.body
    const text = container.textContent ?? ''
    // Either ISO string or localised form will contain the year
    expect(text).toMatch(/2026/)
  })

  it('does not render any <img> element whose src points at a detected evidence URL', () => {
    const { container } = render(<EvidenceList evidence={evidenceItems} />)
    const imgs = Array.from(container.querySelectorAll('img'))
    const evidenceUrls = evidenceItems.map((e) => e.url)
    for (const img of imgs) {
      const src = img.getAttribute('src') ?? ''
      expect(evidenceUrls).not.toContain(src)
    }
  })

  it('does not render any <video> element whose src points at a detected evidence URL', () => {
    const { container } = render(<EvidenceList evidence={evidenceItems} />)
    const videos = Array.from(container.querySelectorAll('video'))
    const evidenceUrls = evidenceItems.map((e) => e.url)
    for (const video of videos) {
      const src = video.getAttribute('src') ?? ''
      expect(evidenceUrls).not.toContain(src)
    }
  })

  it('does not render <source> elements inside <video> that reference detected URLs', () => {
    const { container } = render(<EvidenceList evidence={evidenceItems} />)
    const sources = Array.from(container.querySelectorAll('video source'))
    const evidenceUrls = evidenceItems.map((e) => e.url)
    for (const source of sources) {
      const src = source.getAttribute('src') ?? ''
      expect(evidenceUrls).not.toContain(src)
    }
  })
})
