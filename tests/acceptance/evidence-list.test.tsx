import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EvidenceList from '../../src/components/EvidenceList';

const EVIDENCE_URL = 'https://example.com/article';

const items = [
  {
    id: 'ev-1',
    url: EVIDENCE_URL,
    pageTitle: 'Example Article',
    domain: 'example.com',
    detectedAt: new Date('2026-06-25T10:00:00Z'),
    caseId: 'case-1',
  },
];

describe('EvidenceList component', () => {
  it('displays the URL for each evidence item', () => {
    render(<EvidenceList items={items} />);
    expect(screen.getByText(EVIDENCE_URL)).toBeInTheDocument();
  });

  it('displays pageTitle metadata for each evidence item', () => {
    render(<EvidenceList items={items} />);
    expect(screen.getByText('Example Article')).toBeInTheDocument();
  });

  it('displays domain metadata for each evidence item', () => {
    render(<EvidenceList items={items} />);
    expect(screen.getByText('example.com')).toBeInTheDocument();
  });

  it('displays detectedAt metadata for each evidence item', () => {
    render(<EvidenceList items={items} />);
    const container = document.body;
    expect(container.textContent).toContain('2026');
  });

  it('renders no <img> whose src resolves to the evidence URL', () => {
    const { container } = render(<EvidenceList items={items} />);
    const imgs = container.querySelectorAll('img');
    imgs.forEach((img) => {
      expect(img.getAttribute('src')).not.toBe(EVIDENCE_URL);
    });
  });

  it('renders no <video> whose src resolves to the evidence URL', () => {
    const { container } = render(<EvidenceList items={items} />);
    const videos = container.querySelectorAll('video');
    videos.forEach((video) => {
      expect(video.getAttribute('src')).not.toBe(EVIDENCE_URL);
    });
    const sources = container.querySelectorAll('source');
    sources.forEach((source) => {
      expect(source.getAttribute('src')).not.toBe(EVIDENCE_URL);
    });
  });
});
