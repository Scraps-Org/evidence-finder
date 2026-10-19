import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EvidenceList from '../../src/components/EvidenceList'

describe('EvidenceList — no media elements pointing at detected URLs', () => {
  const DETECTED_URL = 'https://exposure-site.example.com/leaked/post'

  const sampleEvidence = [
    {
      id: 'ev-1',
      url: DETECTED_URL,
      pageTitle: 'Leaked Content - ExposureSite',
      domain: 'exposure-site.example.com',
      detectedAt: new Date('2026-07-03T10:00:00Z').toISOString(),
      caseId: 'case-abc',
    },
    {
      id: 'ev-2',
      url: 'https://another-site.example.net/post/456',
      pageTitle: 'Another Exposure Post',
      domain: 'another-site.example.net',
      detectedAt: new Date('2026-07-03T11:00:00Z').toISOString(),
      caseId: 'case-abc',
    },
  ]

  it('renders URL text, pageTitle, domain, and detectedAt for each evidence item', () => {
    render(<EvidenceList evidence={sampleEvidence} />)

    expect(screen.getByText(DETECTED_URL)).toBeInTheDocument()
    expect(screen.getByText('Leaked Content - ExposureSite')).toBeInTheDocument()
    expect(screen.getByText('exposure-site.example.com')).toBeInTheDocument()

    expect(screen.getByText('https://another-site.example.net/post/456')).toBeInTheDocument()
    expect(screen.getByText('Another Exposure Post')).toBeInTheDocument()
    expect(screen.getByText('another-site.example.net')).toBeInTheDocument()
  })

  it('does not render any <img> element whose src is a detected URL', () => {
    const { container } = render(<EvidenceList evidence={sampleEvidence} />)

    const imgs = container.querySelectorAll('img')
    const detectedUrls = sampleEvidence.map((e) => e.url)

    imgs.forEach((img) => {
      const src = img.getAttribute('src') ?? ''
      expect(
        detectedUrls.includes(src),
        `<img src="${src}"> must not point at a detected evidence URL`
      ).toBe(false)
    })
  })

  it('does not render any <video> element whose src is a detected URL', () => {
    const { container } = render(<EvidenceList evidence={sampleEvidence} />)

    const videos = container.querySelectorAll('video')
    const detectedUrls = sampleEvidence.map((e) => e.url)

    videos.forEach((video) => {
      const src = video.getAttribute('src') ?? ''
      expect(
        detectedUrls.includes(src),
        `<video src="${src}"> must not point at a detected evidence URL`
      ).toBe(false)
    })
  })

  it('does not render any <source> element inside <video> pointing at a detected URL', () => {
    const { container } = render(<EvidenceList evidence={sampleEvidence} />)

    const sources = container.querySelectorAll('video source')
    const detectedUrls = sampleEvidence.map((e) => e.url)

    sources.forEach((source) => {
      const src = source.getAttribute('src') ?? ''
      expect(
        detectedUrls.includes(src),
        `<source src="${src}"> inside <video> must not point at a detected evidence URL`
      ).toBe(false)
    })
  })
})
