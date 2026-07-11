import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import EvidenceList from '../../src/components/EvidenceList'

vi.mock('../../src/lib/prisma', () => ({
  default: {
    evidence: {
      findMany: vi.fn(),
    },
  },
}))

describe('EvidenceList — metadata-only rendering, no media elements', () => {
  const sampleEvidence = [
    {
      id: 'ev-1',
      url: 'https://harmful.example.com/post/123',
      pageTitle: 'Leaked Content Page',
      domain: 'harmful.example.com',
      detectedAt: new Date('2026-07-01T12:00:00.000Z').toISOString(),
      caseId: 'case-001',
    },
    {
      id: 'ev-2',
      url: 'https://another-bad-site.kr/page/456',
      pageTitle: '다른 노출 페이지',
      domain: 'another-bad-site.kr',
      detectedAt: new Date('2026-07-02T09:30:00.000Z').toISOString(),
      caseId: 'case-001',
    },
  ]

  it('renders the URL text for each evidence item', () => {
    render(<EvidenceList evidence={sampleEvidence} />)
    expect(screen.getByText('https://harmful.example.com/post/123')).toBeTruthy()
    expect(screen.getByText('https://another-bad-site.kr/page/456')).toBeTruthy()
  })

  it('renders pageTitle for each evidence item', () => {
    render(<EvidenceList evidence={sampleEvidence} />)
    expect(screen.getByText('Leaked Content Page')).toBeTruthy()
    expect(screen.getByText('다른 노출 페이지')).toBeTruthy()
  })

  it('renders domain for each evidence item', () => {
    render(<EvidenceList evidence={sampleEvidence} />)
    expect(screen.getAllByText('harmful.example.com').length).toBeGreaterThan(0)
    expect(screen.getAllByText('another-bad-site.kr').length).toBeGreaterThan(0)
  })

  it('renders detectedAt timestamp for each evidence item', () => {
    const { container } = render(<EvidenceList evidence={sampleEvidence} />)
    // At least one timestamp-like string must appear in the rendered output
    expect(container.textContent).toMatch(/2026/)
  })

  it('does NOT render any <img> element whose src references a detected URL', () => {
    const { container } = render(<EvidenceList evidence={sampleEvidence} />)
    const imgs = container.querySelectorAll('img')
    imgs.forEach((img) => {
      expect(img.getAttribute('src')).not.toBe('https://harmful.example.com/post/123')
      expect(img.getAttribute('src')).not.toBe('https://another-bad-site.kr/page/456')
    })
  })

  it('does NOT render any <video> element whose src references a detected URL', () => {
    const { container } = render(<EvidenceList evidence={sampleEvidence} />)
    const videos = container.querySelectorAll('video')
    videos.forEach((video) => {
      expect(video.getAttribute('src')).not.toBe('https://harmful.example.com/post/123')
      expect(video.getAttribute('src')).not.toBe('https://another-bad-site.kr/page/456')
    })
  })

  it('does NOT render any <source> element whose src references a detected URL (within video)', () => {
    const { container } = render(<EvidenceList evidence={sampleEvidence} />)
    const sources = container.querySelectorAll('video source')
    sources.forEach((source) => {
      expect(source.getAttribute('src')).not.toBe('https://harmful.example.com/post/123')
      expect(source.getAttribute('src')).not.toBe('https://another-bad-site.kr/page/456')
    })
  })
})
