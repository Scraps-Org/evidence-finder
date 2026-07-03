import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import EvidenceList from '../../src/components/EvidenceList';

// Minimal Evidence shape the component needs
const sampleEvidence = [
  {
    id: 'ev-1',
    url: 'https://evil.example.com/leak/photo.jpg',
    pageTitle: 'Leaked Photo — Evil Site',
    domain: 'evil.example.com',
    detectedAt: new Date('2026-07-01T10:00:00Z'),
    caseId: 'case-1',
  },
  {
    id: 'ev-2',
    url: 'https://bad.example.org/vid.mp4',
    pageTitle: 'Video Post',
    domain: 'bad.example.org',
    detectedAt: new Date('2026-07-02T12:00:00Z'),
    caseId: 'case-1',
  },
];

describe('EvidenceList UI — metadata-only rendering, no media src leak', () => {
  it('renders url text, pageTitle, domain, and detectedAt for each evidence item', () => {
    render(<EvidenceList evidence={sampleEvidence} />);

    // Both items must surface their metadata as visible text
    expect(screen.getByText(/evil\.example\.com\/leak\/photo\.jpg/)).toBeDefined();
    expect(screen.getByText(/Leaked Photo/)).toBeDefined();
    expect(screen.getByText(/evil\.example\.com/)).toBeDefined();

    expect(screen.getByText(/bad\.example\.org\/vid\.mp4/)).toBeDefined();
    expect(screen.getByText(/Video Post/)).toBeDefined();
    expect(screen.getByText(/bad\.example\.org/)).toBeDefined();
  });

  it('does NOT render any <img> element whose src references a detected URL', () => {
    const { container } = render(<EvidenceList evidence={sampleEvidence} />);

    const imgs = container.querySelectorAll('img');
    const leakingImg = Array.from(imgs).find(
      (img) => sampleEvidence.some((ev) => img.getAttribute('src') === ev.url)
    );
    expect(
      leakingImg,
      '<img> with src pointing at a detected evidence URL must not exist'
    ).toBeUndefined();
  });

  it('does NOT render any <video> element whose src references a detected URL', () => {
    const { container } = render(<EvidenceList evidence={sampleEvidence} />);

    const videos = container.querySelectorAll('video');
    const leakingVideo = Array.from(videos).find(
      (vid) => sampleEvidence.some((ev) => vid.getAttribute('src') === ev.url)
    );
    expect(
      leakingVideo,
      '<video> with src pointing at a detected evidence URL must not exist'
    ).toBeUndefined();

    // Also check <source> children inside <video>
    const sources = container.querySelectorAll('video source');
    const leakingSource = Array.from(sources).find(
      (src) => sampleEvidence.some((ev) => src.getAttribute('src') === ev.url)
    );
    expect(
      leakingSource,
      '<source> inside <video> pointing at a detected evidence URL must not exist'
    ).toBeUndefined();
  });
});
