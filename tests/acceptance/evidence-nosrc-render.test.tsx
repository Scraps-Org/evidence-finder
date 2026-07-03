import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// EvidenceList receives a list of evidence items and renders metadata only.
// It must NEVER render <img> or <video> elements whose src points at detected URLs.

vi.mock('../../src/lib/prisma', () => ({
  default: {},
}))

describe('EvidenceList — no media elements pointing at detected URLs', () => {
  it('renders URL text, pageTitle, domain, and detectedAt without any <img> or <video> src referencing the evidence URL', async () => {
    const { EvidenceList } = await import('../../src/components/EvidenceList')

    const items = [
      {
        id: 'ev-1',
        url: 'https://harmful.example.com/post/99',
        pageTitle: 'Harmful Post',
        domain: 'harmful.example.com',
        detectedAt: new Date('2026-06-01T10:00:00Z'),
        caseId: 'case-1',
      },
      {
        id: 'ev-2',
        url: 'https://another.bad.site/img/42',
        pageTitle: 'Another Bad Site',
        domain: 'another.bad.site',
        detectedAt: new Date('2026-06-02T12:00:00Z'),
        caseId: 'case-1',
      },
    ]

    const { container } = render(<EvidenceList items={items} />)

    // Metadata must be visible
    expect(screen.getByText('https://harmful.example.com/post/99')).toBeTruthy()
    expect(screen.getByText('Harmful Post')).toBeTruthy()
    expect(screen.getByText('harmful.example.com')).toBeTruthy()

    expect(screen.getByText('https://another.bad.site/img/42')).toBeTruthy()
    expect(screen.getByText('Another Bad Site')).toBeTruthy()
    expect(screen.getByText('another.bad.site')).toBeTruthy()

    // No <img> element may have a src that matches any of the detected URLs
    const imgs = container.querySelectorAll('img')
    const videos = container.querySelectorAll('video')
    const sources = container.querySelectorAll('source')

    const detectedUrls = items.map((i) => i.url)

    imgs.forEach((img) => {
      expect(detectedUrls).not.toContain(img.getAttribute('src'))
    })

    videos.forEach((video) => {
      expect(detectedUrls).not.toContain(video.getAttribute('src'))
    })

    sources.forEach((source) => {
      expect(detectedUrls).not.toContain(source.getAttribute('src'))
    })
  })
})
