import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EvidenceList from '../../src/components/EvidenceList';

// ---------------------------------------------------------------------------
// Minimal Evidence shape the component must accept
// ---------------------------------------------------------------------------

interface EvidenceItem {
  id: string;
  url: string;
  pageTitle: string;
  domain: string;
  detectedAt: Date | string;
  caseId: string;
}

const ITEMS: EvidenceItem[] = [
  {
    id: 'ev-1',
    url: 'https://example.com/article',
    pageTitle: 'Example Domain',
    domain: 'example.com',
    detectedAt: new Date('2026-06-25T12:00:00.000Z'),
    caseId: 'case-abc',
  },
  {
    id: 'ev-2',
    url: 'https://another.org/page',
    pageTitle: 'Another Site',
    domain: 'another.org',
    detectedAt: new Date('2026-06-24T08:30:00.000Z'),
    caseId: 'case-abc',
  },
];

describe('EvidenceList component', () => {
  it('(a) renders URL and text metadata (pageTitle, domain, detectedAt) for each evidence item', () => {
    render(<EvidenceList items={ITEMS} />);

    // URL visible as text or link href text
    expect(screen.getByText('https://example.com/article')).toBeTruthy();
    expect(screen.getByText('https://another.org/page')).toBeTruthy();

    // pageTitle
    expect(screen.getByText('Example Domain')).toBeTruthy();
    expect(screen.getByText('Another Site')).toBeTruthy();

    // domain
    expect(screen.getByText('example.com')).toBeTruthy();
    expect(screen.getByText('another.org')).toBeTruthy();

    // detectedAt — at least one timestamp rendered somewhere in the output
    expect(screen.getByText(/2026/)).toBeTruthy();
  });

  it('(b) does NOT render <img> or <video> whose src points at an evidence URL', () => {
    const { container } = render(<EvidenceList items={ITEMS} />);

    const evidenceUrls = ITEMS.map((i) => i.url);

    const imgs = Array.from(container.querySelectorAll('img'));
    for (const img of imgs) {
      const src = img.getAttribute('src') ?? '';
      expect(evidenceUrls.some((u) => src.includes(u))).toBe(false);
    }

    const videos = Array.from(container.querySelectorAll('video'));
    for (const video of videos) {
      const src = video.getAttribute('src') ?? '';
      expect(evidenceUrls.some((u) => src.includes(u))).toBe(false);
    }

    // Also check <source> tags inside <video>
    const sources = Array.from(container.querySelectorAll('video source'));
    for (const source of sources) {
      const src = source.getAttribute('src') ?? '';
      expect(evidenceUrls.some((u) => src.includes(u))).toBe(false);
    }
  });
});
