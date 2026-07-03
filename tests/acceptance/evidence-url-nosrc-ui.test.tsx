import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EvidenceList from '../../src/components/EvidenceList';

const DETECTED_URL = 'https://harmful.example.com/post/999';

const mockEvidence = [
  {
    id: 'ev-1',
    url: DETECTED_URL,
    pageTitle: 'Harmful Post Title',
    domain: 'harmful.example.com',
    detectedAt: '2026-07-03T12:00:00.000Z',
    caseId: 'case-1',
  },
];

describe('EvidenceList — metadata-only rendering, no media src', () => {
  it('renders URL text, pageTitle, domain, and detectedAt for each evidence item', () => {
    render(<EvidenceList evidence={mockEvidence} />);

    expect(screen.getByText(DETECTED_URL)).toBeTruthy();
    expect(screen.getByText('Harmful Post Title')).toBeTruthy();
    expect(screen.getByText('harmful.example.com')).toBeTruthy();
    // detectedAt must appear in some human-readable or ISO form
    expect(screen.getByText(/2026-07-03|Jul.*2026|2026.*Jul/i)).toBeTruthy();
  });

  it('does not render any <img> or <video> element whose src references the detected URL', () => {
    const { container } = render(<EvidenceList evidence={mockEvidence} />);

    const imgs = Array.from(container.querySelectorAll('img'));
    const videos = Array.from(container.querySelectorAll('video'));

    const hasImgSrc = imgs.some((el) => el.getAttribute('src') === DETECTED_URL);
    const hasVideoSrc = videos.some((el) => el.getAttribute('src') === DETECTED_URL);

    // Also check <source> elements nested inside <video>
    const sources = Array.from(container.querySelectorAll('video source'));
    const hasSourceSrc = sources.some((el) => el.getAttribute('src') === DETECTED_URL);

    expect(hasImgSrc).toBe(false);
    expect(hasVideoSrc).toBe(false);
    expect(hasSourceSrc).toBe(false);
  });
});
